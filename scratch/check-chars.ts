
import fs from 'fs';

const content = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');
const lines = content.split('\n');
const line = lines[259]; // Line 260
console.log(`Line 260: "${line}"`);
for (let i = 0; i < line.length; i++) {
    console.log(`${line[i]}: ${line.charCodeAt(i)}`);
}
