
with open(r'c:\Users\User\Downloads\ZipSMA\src\app\admin\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

old_line = '                                                                            onClick={() => handleClearDailyFees(row.studentId, row.categoryId, row.categoryName)}\n'
new_line = '                                                                            onClick={() => handleClearDailyFees(row.studentId, row.categoryId, row.categoryName, row.docId)}\n'

found = False
for i, line in enumerate(lines):
    if 'handleClearDailyFees(row.studentId, row.categoryId, row.categoryName)' in line:
        print(f"Found at line {i+1}: {repr(line)}")
        lines[i] = line.replace(
            'handleClearDailyFees(row.studentId, row.categoryId, row.categoryName)',
            'handleClearDailyFees(row.studentId, row.categoryId, row.categoryName, row.docId)'
        )
        found = True
        print(f"Replaced with: {repr(lines[i])}")
        break

if not found:
    print("Pattern not found!")
else:
    with open(r'c:\Users\User\Downloads\ZipSMA\src\app\admin\dashboard\page.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("File saved successfully.")
