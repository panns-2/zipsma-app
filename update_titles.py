import re

file_path = 'src/app/admin/dashboard/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace <CardTitle> with <CardTitle className="text-heading-md">
content = re.sub(r'<CardTitle>', r'<CardTitle className="text-heading-md">', content)

# Replace <CardTitle className="something"> to include text-heading-md
# unless it already contains text-heading
def repl(match):
    class_name = match.group(1)
    if 'text-heading' in class_name:
        return match.group(0) # unchanged
    # Clean up any generic text size or font weights
    class_name = re.sub(r'\b(text-xs|text-sm|text-md|text-lg|text-xl|text-2xl)\b', '', class_name)
    class_name = re.sub(r'\b(font-normal|font-medium|font-semibold|font-bold|font-extrabold|font-black)\b', '', class_name)
    # Add text-heading-md
    new_class_name = f'text-heading-md {class_name}'.strip()
    # remove duplicate spaces
    new_class_name = re.sub(r'\s+', ' ', new_class_name)
    return f'<CardTitle className="{new_class_name}">'

content = re.sub(r'<CardTitle className="([^"]+)">', repl, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
