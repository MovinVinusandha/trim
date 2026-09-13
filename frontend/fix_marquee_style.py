import sys

with open('src/index.css', 'r') as f:
    css = f.read()

# Remove the old manual keyframes so they don't conflict
css = css.replace("""@keyframes infinite-scroll-x {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
.animate-infinite-scroll-x {
  animation: infinite-scroll-x linear infinite;
}""", "")
with open('src/index.css', 'w') as f:
    f.write(css)

# Update HomePage.tsx
with open('src/pages/HomePage.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{/* ── Testimonials (Infinite Marquee) ─────────────── */}" in line:
        start_idx = i
    if "{/* ── FAQ Section (CSS Grid Accordion) ─────────────── */}" in line:
        end_idx = i

if start_idx == -1 or end_idx == -1:
    print("Could not find blocks!")
    sys.exit(1)

stories_row_1 = [
    { "quote": "The Batch Creation API saved our marketing team hundreds of hours.", "name": "Sarah Jenkins", "handle": "sarahjenks" },
    { "quote": "Real-time global event tracking in under 15ms. Incredible.", "name": "Michael Chen", "handle": "mchen_dev" },
    { "quote": "The self-hosted Docker deployment with SSO was a breeze to set up.", "name": "David Wilson", "handle": "dwilson_ops" },
    { "quote": "Hop tracking and malware scanning gives us total peace of mind.", "name": "Elena Rodriguez", "handle": "elenarod" }
]

stories_row_2 = [
    { "quote": "Switching from Bitly was seamless. The Analytics alone are worth it.", "name": "James Smith", "handle": "jsmith22" },
    { "quote": "We run massive Black Friday campaigns. Trim never broke a sweat.", "name": "Anna Kowalski", "handle": "anna_k" },
    { "quote": "The immutable audit log is exactly what our compliance team needed.", "name": "Robert Taylor", "handle": "rtaylor_sec" },
    { "quote": "A beautifully engineered tool. Multi-tenant mode handles our clients perfectly.", "name": "Lisa Wang", "handle": "lisawang_pm" }
]

def render_row(stories, reverse=False, is_last=False):
    anim_dir = "motion-safe:[animation-direction:reverse]" if reverse else ""
    border_bottom = "" if is_last else "border-b border-border"
    # To offset the second row, we'll wrap the inner track in a relative container with negative margin
    offset = "ml-[-213px]" if reverse else ""
    return f"""
          <div className="flex overflow-hidden group w-full bg-background {border_bottom}">
            <div className="flex w-max motion-safe:animate-infinite-scroll-x group-hover:[animation-play-state:paused] {anim_dir} {offset}">
              {{[...{stories}, ...{stories}].map((item, idx) => (
                 <div key={{idx}} className="marquee-card p-10 lg:p-12 border-r border-border flex-shrink-0 bg-card hover:bg-primary/[0.01] transition-colors flex flex-col justify-between min-h-[250px]">
                    <p className="text-[15px] md:text-[17px] text-foreground font-medium mb-8 leading-relaxed tracking-tight">“{{item.quote}}”</p>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{{item.name}}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">@{{item.handle}}</div>
                    </div>
                 </div>
              ))}}
            </div>
          </div>"""

new_code = f"""
      {{/* ── Testimonials (Infinite Marquee) ─────────────── */}}
      <section className="bg-background relative overflow-hidden border-b border-border">
        <div className="max-w-7xl mx-auto border-x border-border flex flex-col relative">
          
          <div className="px-6 py-20 text-center border-b border-border bg-background relative z-20">
             <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight" style={{{{ fontFamily: "'Space Grotesk', sans-serif" }}}}>
               See what thousands of developers have to say
             </h2>
          </div>
          
          <div className="relative z-10 bg-background">
            {render_row(stories_row_1)}
            {render_row(stories_row_2, True, True)}
          </div>

          {{/* Subtler Fade masks so it matches Laravel Cloud */}}
          <div className="absolute left-0 top-[220px] bottom-0 w-12 sm:w-24 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-[220px] bottom-0 w-12 sm:w-24 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
        </div>
      </section>

"""

new_lines = lines[:start_idx] + [new_code] + lines[end_idx:]

with open('src/pages/HomePage.tsx', 'w') as f:
    f.writelines(new_lines)

print("Marquee completely restyled!")
