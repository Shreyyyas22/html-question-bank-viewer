/**
 * Extracts individual JSON object strings from a JS array representation.
 * Uses bracket matching to handle objects without eval().
 */
function extractObjectsFromArray(jsString) {
  const objects = [];
  let depth = 0;
  let inString = false;
  let stringChar = null;
  let escape = false;
  let currentObjectStart = -1;
  let arrayDepth = 0; // Track array brackets to avoid picking up arbitrary JS blocks

  for (let i = 0; i < jsString.length; i++) {
    const char = jsString[i];
    
    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      stringChar = char;
      continue;
    }

    // Keep track of the top-level array so we only extract objects inside it
    if (char === '[') {
      arrayDepth++;
    } else if (char === ']') {
      arrayDepth--;
      if (arrayDepth === 0) {
        // Once the main questions array is closed, stop parsing completely.
        // This prevents parsing trailing JavaScript code (like catch blocks).
        break;
      }
    }

    if (char === '{') {
      if (depth === 0 && arrayDepth > 0) {
        currentObjectStart = i;
      }
      if (arrayDepth > 0) {
        depth++;
      }
    } else if (char === '}') {
      if (arrayDepth > 0) {
        depth--;
        if (depth === 0 && currentObjectStart !== -1) {
          objects.push(jsString.substring(currentObjectStart, i + 1));
          currentObjectStart = -1;
        }
      }
    }
  }
  return objects;
}

/**
 * Normalizes a parsed raw question object into the app's standard format.
 */
function normalizeQuestion(rawQ, topicName, id) {
  return {
    id,
    topic: topicName,
    text: rawQ.text || '',
    options: rawQ.options || [],
    correctAnswer: rawQ.correct_answer || '',
    explanation: rawQ.explanation || '',
    images: rawQ.question_images || [],
    explanationImages: rawQ.explanation_images || []
  };
}

/**
 * Parses the full raw HTML string from the question bank.
 * @param {string} htmlString - The raw file content
 * @returns {Object} { topics: Array, totalParsed: number, failedCount: number, errors: Array }
 */
export function parseQuestionBank(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  
  const topicsMap = new Map();
  let totalParsed = 0;
  let failedCount = 0;
  const errors = [];
  let globalId = 0;

  // 1. Detect Combined Format (TESTS_LIST)
  let testsListStartIdx = htmlString.indexOf('TESTS_LIST = [');
  if (testsListStartIdx !== -1) {
    // Extract everything from '[' onwards for the TESTS_LIST array
    const arrayContent = htmlString.substring(htmlString.indexOf('[', testsListStartIdx));
    const testObjectsStrings = extractObjectsFromArray(arrayContent);
    
    testObjectsStrings.forEach((testStr, testIdx) => {
      try {
        let testObj;
        try {
          testObj = JSON.parse(testStr);
        } catch (e) {
          testObj = new Function('return (' + testStr + ')')();
        }
        
        const topicName = testObj.title || `Unknown Topic ${testIdx + 1}`;
        const questions = testObj.questions || [];
        const parsedQuestions = [];
        
        questions.forEach((rawQ, qIdx) => {
          try {
            const normalized = normalizeQuestion(rawQ, topicName, `${topicName}-${qIdx}-${globalId++}`);
            parsedQuestions.push(normalized);
            totalParsed++;
          } catch (e) {
            failedCount++;
            errors.push({ topic: topicName, index: qIdx, message: `Failed to normalize question: ${e.message}` });
          }
        });
        
        if (parsedQuestions.length > 0) {
          topicsMap.set(topicName, {
            name: topicName,
            questions: parsedQuestions,
            count: parsedQuestions.length
          });
        }
      } catch (e) {
        errors.push({ topic: 'Global', index: testIdx, message: `Failed to parse test object: ${e.message}` });
      }
    });
    
    return {
      topics: Array.from(topicsMap.values()),
      totalParsed,
      failedCount,
      errors
    };
  }

  // 2. Detect Legacy Iframe Format
  const containers = doc.querySelectorAll('.iframe-container');
  
  if (containers.length === 0) {
    return {
      topics: [],
      totalParsed: 0,
      failedCount: 0,
      errors: [{ topic: 'Global', index: 0, message: 'Could not find any topic containers or TESTS_LIST in the HTML.' }]
    };
  }

  containers.forEach(container => {
    const h2 = container.querySelector('h2');
    const topicName = h2 ? h2.textContent.trim() : 'Unknown Topic';
    
    const iframe = container.querySelector('iframe');
    if (!iframe) {
      errors.push({ topic: topicName, index: 0, message: 'No iframe found for topic.' });
      return;
    }

    const srcdoc = iframe.getAttribute('srcdoc');
    if (!srcdoc) {
      errors.push({ topic: topicName, index: 0, message: 'No srcdoc attribute found on iframe.' });
      return;
    }

    // Parse the inner HTML document from srcdoc
    const innerDoc = parser.parseFromString(srcdoc, 'text/html');
    const scripts = innerDoc.querySelectorAll('script');
    
    let questionsJsString = null;
    for (const script of scripts) {
      if (script.textContent && script.textContent.includes('questions = [')) {
        questionsJsString = script.textContent;
        break;
      }
    }

    if (!questionsJsString) {
      errors.push({ topic: topicName, index: 0, message: 'Could not locate questions array in script tags.' });
      return;
    }

    // Decode any lingering HTML entities (like &quot;) in the script content
    const textArea = document.createElement('textarea');
    textArea.innerHTML = questionsJsString;
    const decodedJsString = textArea.value;

    // Find start of the populated array.
    // We look for 'questions = [{' because some files have 'questions = [];' earlier in the script.
    let arrayStartIdx = decodedJsString.indexOf('questions = [{');
    if (arrayStartIdx === -1) {
      // Fallback: look for the last occurrence of 'questions = ['
      arrayStartIdx = decodedJsString.lastIndexOf('questions = [');
      if (arrayStartIdx === -1) return;
    }
    
    // Extract everything from '[' onwards
    const arrayContent = decodedJsString.substring(decodedJsString.indexOf('[', arrayStartIdx));
    
    // Extract individual objects using bracket matching
    const objectStrings = extractObjectsFromArray(arrayContent);
    
    const parsedQuestions = [];
    
    objectStrings.forEach((objStr, idx) => {
      try {
        let rawQ;
        try {
          rawQ = JSON.parse(objStr);
        } catch (e) {
          // Fallback for JS objects (e.g. single quotes, unquoted keys, trailing commas)
          rawQ = new Function('return (' + objStr + ')')();
        }
        const normalized = normalizeQuestion(rawQ, topicName, `${topicName}-${idx}-${globalId++}`);
        parsedQuestions.push(normalized);
        totalParsed++;
      } catch (e) {
        failedCount++;
        errors.push({ topic: topicName, index: idx, message: `Failed to parse question object: ${e.message}` });
      }
    });

    if (parsedQuestions.length > 0) {
      topicsMap.set(topicName, {
        name: topicName,
        questions: parsedQuestions,
        count: parsedQuestions.length
      });
    }
  });

  return {
    topics: Array.from(topicsMap.values()),
    totalParsed,
    failedCount,
    errors
  };
}
