
with open(r'c:\Users\User\Downloads\ZipSMA\src\app\admin\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = 'h-screen w-full flex bg-background text-foreground overflow-hidden'
start_index = content.find(start_marker)
if start_index == -1:
    print("Start marker not found")
    exit()

print(f"Start marker found at index {start_index}")

# Adjust to start after the '<div'
start_pos = content.rfind('<div', 0, start_index)
print(f"Opening <div found at index {start_pos}")

count = 1
pos = start_index + len(start_marker)
while pos < len(content):
    if content[pos:pos+4] == '<div':
        count += 1
        pos += 4
    elif content[pos:pos+6] == '</div':
        count -= 1
        pos += 6
        if count == 0:
            print(f"Closing </div> found at index {pos}")
            line_num = content[:pos].count('\n') + 1
            print(f"Line number: {line_num}")
            print(f"Context: {content[pos-20:pos+20]!r}")
            break
    else:
        pos += 1
