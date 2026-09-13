import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

target = """      {/* ── Testimonials (Infinite Marquee) ─────────────── */}
      <section className="bg-background relative overflow-hidden border-b border-border">
        <div className="max-w-7xl mx-auto border-x border-border flex flex-col">"""

replacement = """      {/* ── Testimonials (Infinite Marquee) ─────────────── */}
      <section className="bg-background relative overflow-hidden border-b border-border">
        <div className="max-w-7xl mx-auto border-x border-border flex flex-col relative">
          {/* Gradient fade masks for the marquee edges */}
          <div className="absolute left-0 top-16 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-16 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
"""

content = content.replace(target, replacement)

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Fade masks added!")
