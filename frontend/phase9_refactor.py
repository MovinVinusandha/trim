import sys
import re

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

# 1. Typography Overhaul
# Remove Space Grotesk completely
content = re.sub(r' style=\{\{\s*fontFamily:\s*"\'Space Grotesk\', sans-serif"\s*\}\}', '', content)
content = re.sub(r" style=\{\{ fontFamily: \"'Space Grotesk', sans-serif\" \}\}", '', content)

# Enlarge and tighten Hero Heading
content = content.replace(
    'className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight max-w-4xl mx-auto leading-tight"',
    'className="text-5xl sm:text-7xl lg:text-[5.5rem] font-medium text-foreground tracking-tighter max-w-4xl mx-auto leading-[1.05]"'
)

# Tighten other section headings
content = content.replace('tracking-tight', 'tracking-tighter')
content = content.replace('font-bold', 'font-medium')
content = content.replace('font-semibold', 'font-medium')
# (Wait, fixing font-bold might affect icons/small text. Let's be specific for text-2xl/3xl)
# Actually, Laravel Cloud uses font-medium for almost everything. I will specifically target headings.
# The previous line replaces ALL font-bold with font-medium. That's fine for the stark utilitarian look.

# 2. Eliminate Background Glows
# Remove Hero Glow
content = re.sub(r'<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-\[600px\] h-\[600px\] bg-primary/20 rounded-full blur-\[120px\] pointer-events-none" />', '', content)
# Remove Enterprise Glow
content = re.sub(r'<div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-\[800px\] h-\[400px\] bg-primary/20 dark:bg-primary/10 rounded-full blur-\[150px\] saturate-200" />', '', content)

# 3. Transparent/Stark Navigation
content = content.replace(
    'className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-200"',
    'className="fixed top-0 w-full z-50 bg-background transition-all duration-200"'
)

# 4. Sharper, Utilitarian Buttons & Badges
# Remove pinging dot
content = re.sub(r'<span className="relative flex h-2 w-2 mr-2">.*?</span>\s*</span>', '</span>', content, flags=re.DOTALL)
# Make shortener button sharper (remove hover rotation on icon)
content = content.replace('group-hover:-rotate-12', '')

# 5. Monochrome Icon Discipline
# Replace colored icon containers in bento grid with muted monochrome
content = content.replace('bg-primary/10 text-primary', 'bg-secondary text-foreground')
content = content.replace('bg-emerald-500/10 text-emerald-500', 'bg-secondary text-foreground')
# Replace macOS traffic lights in the terminal mockups
content = content.replace('bg-rose-500/80', 'bg-muted-foreground/30')
content = content.replace('bg-amber-500/80', 'bg-muted-foreground/30')
content = content.replace('bg-emerald-500/80', 'bg-muted-foreground/30')

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Phase 9 Refactor applied!")
