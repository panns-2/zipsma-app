
const fs = require('fs');
const content = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');
const lines = content.split('\n');

let openBraces = 0;
let inString = false;
let stringChar = '';

for (let i = 0; i < 1754; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (inString) {
            if (char === stringChar && line[j-1] !== '\\') {
                inString = false;
            }
        } else {
            if (char === '"' || char === "'" || char === '`') {
                inString = true;
                stringChar = char;
            } else if (char === '{') {
                openBraces++;
            } else if (char === '}') {
                openBraces--;
            }
        }
    }
}

console.log('Open braces at line 1754:', openBraces);
