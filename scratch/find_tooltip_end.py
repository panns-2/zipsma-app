
with open(r'c:\Users\User\Downloads\ZipSMA\src\app\admin\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<TooltipProvider>'
start_index = content.find(start_marker, content.find('h-screen w-full flex bg-background text-foreground overflow-hidden'))

if start_index == -1:
    print("Start marker not found")
    exit()

print(f"Start marker found at index {start_index}")

count = 1
pos = start_index + len(start_marker)
while pos < len(content):
    if content[pos:pos+len('<TooltipProvider>')] == '<TooltipProvider>':
        count += 1
        pos += len('<TooltipProvider>')
    elif content[pos:pos+len('</TooltipProvider>')] == '</TooltipProvider>':
        count -= 1
        pos += len('</TooltipProvider>')
        if count == 0:
            print(f"Closing </TooltipProvider> found at index {pos}")
            line_num = content[:pos].count('\n') + 1
            print(f"Line number: {line_num}")
            break
    else:
        pos += 1

print(f"Final count: {count}")
