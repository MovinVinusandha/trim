import sys

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
    { "quote": "The Batch Creation API saved our marketing team hundreds of hours.", "company": "Vercel" },
    { "quote": "Real-time global event tracking in under 15ms. Incredible.", "company": "Supabase" },
    { "quote": "The self-hosted Docker deployment with SSO was a breeze to set up.", "company": "Acme Corp" },
    { "quote": "Hop tracking and malware scanning gives us total peace of mind.", "company": "Stripe" }
]

stories_row_2 = [
    { "quote": "Switching from Bitly was seamless. The Analytics alone are worth it.", "company": "Netflix" },
    { "quote": "We run massive Black Friday campaigns. Trim never broke a sweat.", "company": "Shopify" },
    { "quote": "The immutable audit log is exactly what our compliance team needed.", "company": "Coinbase" },
    { "quote": "A beautifully engineered tool. Multi-tenant mode handles our clients perfectly.", "company": "Figma" }
]

def render_row(stories, reverse=False, is_last=False):
    anim_dir = "motion-safe:[animation-direction:reverse]" if reverse else ""
    border_bottom = "" if is_last else "border-b border-border"
    return f"""
          <div className="flex overflow-hidden group w-full bg-background {border_bottom}">
            <div className="flex w-max motion-safe:animate-infinite-scroll-x group-hover:[animation-play-state:paused] {anim_dir}" style={{{{ animationDuration: '40s' }}}}>
              {{[...{stories}, ...{stories}].map((item, idx) => (
                 <div key={{idx}} className="w-[85vw] sm:w-[350px] lg:w-[426px] p-8 md:p-12 border-r border-border flex-shrink-0 bg-card hover:bg-primary/[0.02] transition-colors flex flex-col justify-between min-h-[200px]">
                    <blockquote className="text-sm md:text-base text-foreground font-medium mb-6 leading-relaxed">"{{item.quote}}"</blockquote>
                    <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{{item.company}}</div>
                 </div>
              ))}}
            </div>
          </div>"""

new_code = f"""
      {{/* ── Testimonials (Infinite Marquee) ─────────────── */}}
      <section className="bg-background relative overflow-hidden border-b border-border">
        <div className="max-w-7xl mx-auto border-x border-border flex flex-col">
          <div className="px-6 py-16 text-center border-b border-border">
             <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight" style={{{{ fontFamily: "'Space Grotesk', sans-serif" }}}}>
               Loved by modern teams
             </h2>
          </div>
          {render_row(stories_row_1)}
          {render_row(stories_row_2, True, True)}
        </div>
      </section>

"""

new_lines = lines[:start_idx] + [new_code] + lines[end_idx:]

with open('src/pages/HomePage.tsx', 'w') as f:
    f.writelines(new_lines)

print("Marquee fixed!")
