
with open(r'c:\Users\User\Downloads\ZipSMA\src\app\admin\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def check_balance(opening, closing):
    count = 0
    for i, char in enumerate(content):
        if char == opening:
            count += 1
        elif char == closing:
            count -= 1
        if count < 0:
            line_num = content[:i].count('\n') + 1
            print(f"Count for {opening}{closing} went negative at line {line_num}")
            count = 0
    return count

print(f"Final brace count {{}}: {check_balance('{', '}')}")
print(f"Final paren count (): {check_balance('(', ')')}")
print(f"Final bracket count []: {check_balance('[', ']')}")
