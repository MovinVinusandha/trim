import sys

# 1. Update index.css
with open('src/index.css', 'r') as f:
    css_content = f.read()

if "infinite-scroll-x" not in css_content:
    css_content += """
@keyframes infinite-scroll-x {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
.animate-infinite-scroll-x {
  animation: infinite-scroll-x linear infinite;
}
"""
    with open('src/index.css', 'w') as f:
        f.write(css_content)

# 2. Update HomePage.tsx
with open('src/pages/HomePage.tsx', 'r') as f:
    lines = f.readlines()

# Inject Plus into imports
for i, line in enumerate(lines):
    if "ShieldAlert," in line:
        lines.insert(i+1, "  Plus,\n")
        break

# Find where to inject FaqItem (right before const HomePage = )
for i, line in enumerate(lines):
    if "const HomePage = () => {" in line:
        faq_component = """
const FaqItem = ({ question, answer }: { question: string, answer: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex justify-between items-center py-6 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-sm md:text-base font-medium text-foreground group-hover:text-primary transition-colors">{question}</span>
        <span className="relative flex items-center justify-center w-5 h-5 ml-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
          <span className={`absolute w-full h-0.5 bg-current transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          <span className={`absolute w-full h-0.5 bg-current transition-transform duration-300 ${isOpen ? 'rotate-0' : 'rotate-90'}`} />
        </span>
      </button>
      <div 
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="pb-6 text-sm text-muted-foreground leading-relaxed">
            {answer}
          </div>
        </div>
      </div>
    </div>
  );
};
"""
        lines.insert(i, faq_component)
        break

# Find Testimonials and CTA
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if "{/* ── Testimonials (Bento Redesign) ─────────────── */}" in line:
        start_idx = i
    if "{/* ── Final CTA Banner & Footer (With Crisp Dot Matrix) ─── */}" in line:
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

def render_row(stories, reverse=False):
    html = f"""
        <div className="flex overflow-hidden group w-full bg-background border-b border-border">
          <div className="flex w-max motion-safe:animate-infinite-scroll-x group-hover:[animation-play-state:paused] {'motion-safe:[animation-direction:reverse]' if reverse else ''}" style={{'{'} animationDuration: '40s' {'}'}}>
            {'{'}[...{str(stories)}, ...{str(stories)}].map((item, idx) => (
               <div key={'{'}idx{'}'} className="w-[100vw] sm:w-[50vw] lg:w-[33.333vw] p-8 md:p-12 border-l border-border flex-shrink-0 bg-card hover:bg-primary/[0.02] transition-colors flex flex-col justify-between min-h-[200px]">
                  <blockquote className="text-sm md:text-base text-foreground font-medium mb-6 leading-relaxed">"{'{'}item.quote{'}'}"</blockquote>
                  <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{'{'}item.company{'}'}</div>
               </div>
            )){'}'}
          </div>
        </div>"""
    return html

new_code = f"""
      {{/* ── Testimonials (Infinite Marquee) ─────────────── */}}
      <section className="bg-background relative overflow-hidden border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-16 border-x border-border text-center">
           <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight" style={{'{'} fontFamily: "'Space Grotesk', sans-serif" {'}'}}>
             Loved by modern teams
           </h2>
        </div>
        
        {render_row(stories_row_1)}
        {render_row(stories_row_2, True)}
      </section>

      {{/* ── FAQ Section (CSS Grid Accordion) ─────────────── */}}
      <section className="bg-background relative overflow-hidden border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-24 border-x border-border">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="col-span-1 md:col-span-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-4" style={{'{'} fontFamily: "'Space Grotesk', sans-serif" {'}'}}>
                Frequently asked questions
              </h2>
              <p className="text-sm text-muted-foreground">
                Everything you need to know about Trim's architecture, security, and global edge network.
              </p>
            </div>
            
            <div className="col-span-1 md:col-span-8 border-t border-border">
              <FaqItem 
                question="How fast is the Global Edge Network?" 
                answer="Our distributed edge nodes ensure sub-15ms redirect speeds worldwide. No matter where your users are located, Trim routes them through the closest data center for hyper-optimized hop times." 
              />
              <FaqItem 
                question="How does Real-Time Event Tracking work?" 
                answer="Every click is instantly streamed to your dashboard using Server-Sent Events (SSE). You can watch traffic unfold on our interactive 3D Globe, complete with hop tracking, device OS, and geographic data." 
              />
              <FaqItem 
                question="Can I self-host Trim?" 
                answer="Yes. Trim offers a dual-deployment model. You can self-host via our official Docker images or use our fully managed Multi-Tenant Cloud. Both modes share the exact same enterprise feature set." 
              />
              <FaqItem 
                question="Is the Admin Security Vault included?" 
                answer="Yes, all enterprise and self-hosted deployments include the Admin Security Vault. This provides Immutable Audit Logs, Proactive Malware Scanning, Live .env Sync, and a one-click Panic Switch to instantly quarantine all active links during a threat." 
              />
            </div>
          </div>
        </div>
      </section>
"""

new_lines = lines[:start_idx] + [new_code] + lines[end_idx:]

with open('src/pages/HomePage.tsx', 'w') as f:
    f.writelines(new_lines)

print("Phase 7 injected successfully!")
