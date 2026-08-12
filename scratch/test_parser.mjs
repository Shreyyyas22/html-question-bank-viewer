import { parseQuestionBank } from './src/parser/htmlQuestionParser.js';
import fs from 'fs';

// Read a chunk of the file to see if we can parse the first topic
const html = fs.readFileSync('DQB Obstetrics.html', 'utf-8');

// The file might be using ES modules, but we are running in Node, 
// so we need to bypass DOMParser which doesn't exist in Node natively.
