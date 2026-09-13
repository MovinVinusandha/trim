import sys

with open('src/index.css', 'r') as f:
    css_content = f.read()

if "bg-hatch" not in css_content:
    hatch_css = """
@layer utilities {
  .bg-hatch {
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(0, 0, 0, 0.05) 4px,
      rgba(0, 0, 0, 0.05) 5px
    );
  }
  .dark .bg-hatch {
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 4px,
      rgba(255, 255, 255, 0.06) 4px,
      rgba(255, 255, 255, 0.06) 5px
    );
  }
}
"""
    css_content += hatch_css
    with open('src/index.css', 'w') as f:
        f.write(css_content)

print("bg-hatch added!")
