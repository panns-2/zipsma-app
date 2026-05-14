
with open(r'c:\Users\User\Downloads\ZipSMA\src\app\admin\dashboard\page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

def count_tag(tag):
    return content.count(f'<{tag}>') + content.count(f'<{tag} ')

def count_closing(tag):
    return content.count(f'</{tag}>')

tags = ['div', 'TooltipProvider', 'AlertDialog', 'Dialog']
for t in tags:
    o = count_tag(t)
    c = count_closing(t)
    print(f"{t}: {o} open, {c} close. Diff: {o-c}")
