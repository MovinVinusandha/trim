import sys

# 1. Update index.css
with open('src/index.css', 'r') as f:
    css_content = f.read()

if "marquee-card" not in css_content:
    css_content += """
.marquee-card {
  width: calc(100vw - 48px);
}
@media (min-width: 640px) {
  .marquee-card {
    width: calc((min(100vw, 1280px) - 48px) / 2);
  }
}
@media (min-width: 1024px) {
  .marquee-card {
    width: calc((min(100vw, 1280px) - 48px) / 3);
  }
}
"""
    with open('src/index.css', 'w') as f:
        f.write(css_content)

# 2. Update HomePage.tsx
with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

content = content.replace('className="w-[85vw] sm:w-[350px] lg:w-[426px]', 'className="marquee-card')
content = content.replace('text-2xl sm:text-3xl font-bold text-foreground', 'text-2xl sm:text-3xl font-bold text-foreground')

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Marquee width fixed!")
