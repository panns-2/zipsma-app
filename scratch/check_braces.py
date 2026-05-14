
with open(r'c:\Users\User\Downloads\ZipSMA\src\app\admin\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

brace_count = 0
for i, char in enumerate(content):
    if char == '{':
        brace_count += 1
    elif char == '}':
        brace_count -= 1
    
    # Optional: check line numbers if it goes negative
    if brace_count < 0:
        line_num = content[:i].count('\n') + 1
        print(f"Brace count went negative at line {line_num}")
        # Reset to continue checking for other errors
        brace_count = 0

print(f"Final brace count: {brace_count}")
