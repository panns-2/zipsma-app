const fs = require('fs');
const path = 'c:/Users/User/Downloads/ZipSMA/src/app/admin/dashboard/page.tsx';
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
const start = 1713; // 0-based index for line 1714
const end = 4861; // 0-based index for line 4862
lines.splice(start, end - start, "    return <div className=\"p-20 text-4xl font-bold\">Diagnosing... (db is {db ? 'ready' : 'null'})</div>;");
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Done');
