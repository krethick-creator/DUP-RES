const fs = require('fs');
const file = 'd:/resume  system/client/js/pages/candidate.js';
let content = fs.readFileSync(file, 'utf8');

const methodsToRemove = [
  'renderProfile',
  'renderResume',
  'renderResumeAI',
  'renderInterview',
  'renderAIAssistant',
  'renderRoadmap',
  'renderLearning',
  'renderGitHub',
  'renderSettings',
  'bind',
  'loadOverviewCharts',
  'bindProfileButton',
  'getCodingInput',
  'formatDate',
  'refreshProfileUser'
];

let reportRemoved = [];

for (const method of methodsToRemove) {
  const regex = new RegExp(`^(?:\\s*async)?\\s*${method}\\s*\\([^)]*\\)\\s*\\{`, 'gm');
  const matches = [...content.matchAll(regex)];
  console.log(`${method} found ${matches.length} times`);
  
  if (matches.length > 1) {
    const lastMatch = matches[matches.length - 1];
    const startIndex = lastMatch.index;
    
    let braceCount = 0;
    let endIndex = -1;
    let started = false;
    
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        started = true;
      } else if (content[i] === '}') {
        braceCount--;
      }
      
      if (started && braceCount === 0) {
        endIndex = i + 1;
        while (endIndex < content.length && (content[endIndex] === ' ' || content[endIndex] === '\n' || content[endIndex] === '\r')) {
          endIndex++;
        }
        if (content[endIndex] === ',') endIndex++;
        break;
      }
    }
    
    if (endIndex !== -1) {
      content = content.substring(0, startIndex) + content.substring(endIndex);
      reportRemoved.push(method);
    }
  }
}

const assessRegex = new RegExp(`^(?:\\s*async)?\\s*renderAssessments\\s*\\([^)]*\\)\\s*\\{`, 'gm');
const assessMatches = [...content.matchAll(assessRegex)];
console.log(`renderAssessments found ${assessMatches.length} times`);
if (assessMatches.length > 1) {
  const lastMatch = assessMatches[assessMatches.length - 1];
  const renameStr = content.substring(lastMatch.index, lastMatch.index + lastMatch[0].length).replace('renderAssessments', 'renderCodingAssessment');
  content = content.substring(0, lastMatch.index) + renameStr + content.substring(lastMatch.index + lastMatch[0].length);
  console.log('Renamed second renderAssessments to renderCodingAssessment');
}

fs.writeFileSync(file, content);
console.log('Removed duplicate methods: ' + reportRemoved.join(', '));
