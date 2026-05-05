
import fs from 'fs';

const content = fs.readFileSync('src/app/admin/dashboard/page.tsx', 'utf8');
const lines = content.split('\n');
let dDiff = 0; // div diff

for (let i = 2790; i < 3253; i++) {
    const line = lines[i];
    dDiff += (line.match(/<div/g) || []).length - (line.match(/<\/div>/g) || []).length;
    if (dDiff !== 0) {
        // console.log(`Line ${i+1} [dDiff=${dDiff}]: ${line.trim()}`);
    }
}
console.log(`Range 2790-3253 dDiff: ${dDiff}`);
