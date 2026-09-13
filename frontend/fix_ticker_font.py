import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

target = 'className="text-primary font-bold truncate"'
replacement = 'className="text-primary font-semibold text-[10px] md:text-[11px] truncate tracking-wider"'

content = content.replace(target, replacement)

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Ticker font adjusted!")
