import sys
import re

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

# 1. Clean up badge (remove pinging dot, make rounded-md instead of full)
badge_target = """          <motion.div
            variants={fadeUpVariant}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 backdrop-blur-sm text-xs font-medium text-muted-foreground shadow-sm hover:border-border/80 hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>"""
badge_replacement = """          <motion.div
            variants={fadeUpVariant}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-border bg-card/80 backdrop-blur-sm text-[11px] uppercase tracking-widest font-semibold text-muted-foreground shadow-sm hover:border-border/80 hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground opacity-50" />"""
content = content.replace(badge_target, badge_replacement)

# Remove the hero glow completely
content = re.sub(r'<div className="pointer-events-none absolute[^>]*?w-\[550px\] h-\[300px\] bg-primary/10 rounded-full blur-\[120px\]" />', '', content)

# 2. Fix the Hero typography to be exactly like Laravel Cloud
content = content.replace('text-4xl sm:text-6xl lg:text-7xl font-medium text-foreground leading-[1.08] tracking-tighter', 'text-5xl sm:text-6xl lg:text-[5rem] font-medium text-foreground leading-none tracking-tighter')

# Remove the blue underline in hero "manage your links <span bg-primary/30>"
content = re.sub(r'<span className="absolute -bottom-1\.5 left-0 right-0 h-1 rounded-full bg-primary/30" />', '', content)

# 3. Clean up the Header
header_target = '<header className="fixed top-0 w-full z-50 bg-background transition-all duration-200">'
header_replacement = '<header className="fixed top-0 w-full z-50 bg-transparent transition-all duration-200">'
content = content.replace(header_target, header_replacement)
content = content.replace('className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border transition-all duration-200"', header_replacement)

# 4. Monochrome Icon Discipline in Bento Grids
# Features Grid icons
content = content.replace('bg-primary/10 text-primary', 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100')
# Developer API icon
content = content.replace('bg-primary/10 text-primary', 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100')
# Globe icon
content = content.replace('bg-emerald-500/10 text-emerald-500', 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100')
# Integration icon
content = content.replace('bg-secondary text-muted-foreground', 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100')
# Enterprise icon
content = content.replace('bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900', 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100')

# Traffic lights in terminals
content = content.replace('bg-rose-500/80', 'bg-border')
content = content.replace('bg-amber-500/80', 'bg-border')
content = content.replace('bg-emerald-500/80', 'bg-border')
content = content.replace('bg-rose-500/20 bg-rose-500/5', 'border-border bg-card')
content = content.replace('text-rose-400', 'text-foreground')

# 5. Buttons
content = content.replace('group-hover:-rotate-12', '')
content = content.replace('rounded-lg', 'rounded-md')
content = content.replace('rounded-xl', 'rounded-lg')
content = content.replace('rounded-2xl', 'rounded-lg')

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Polish applied!")
