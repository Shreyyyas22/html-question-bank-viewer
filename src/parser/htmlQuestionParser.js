/**
 * Extracts individual JSON object strings from a JS array representation.
 * Uses bracket matching to handle objects without eval().
 */
function extractObjectsFromArray(jsString) {
  const objects = [];
  let depth = 0;
  let inString = false;
  let escape = false;
  let currentObjectStart = -1;

  for (let i = 0; i < jsString.length; i++) {
    const char = jsString[i];
    
    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false; // We only care about double quotes since strict JSON uses double quotes
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      if (depth === 0) {
        currentObjectStart = i;
      }
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0 && currentObjectStart !== -1) {
        objects.push(jsString.substring(currentObjectStart, i + 1));
        currentObjectStart = -1;
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

  // Find all iframe containers that hold topic content
  const containers = doc.querySelectorAll('.iframe-container');
  
  if (containers.length === 0) {
    // If we can't find .iframe-container, the HTML format is unknown
    return {
      topics: [],
      totalParsed: 0,
      failedCount: 0,
      errors: [{ topic: 'Global', index: 0, message: 'Could not find any topic containers in the HTML.' }]
    };
  }

  let globalId = 0;

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
        const rawQ = JSON.parse(objStr);
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
