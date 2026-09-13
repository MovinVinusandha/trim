import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

# 1. Define highlight function and arrays
definitions = """
const highlightTrim = (text: string) => {
  const parts = text.split(/(Trim)/gi);
  return parts.map((part, i) => 
    part.toLowerCase() === 'trim' ? <span key={i} className="text-primary">{part}</span> : part
  );
};

const testimonialsRow1 = [
  { quote: 'Trim\\'s Batch Creation API saved our marketing team hundreds of hours.', name: 'Sarah Jenkins', handle: 'sarahjenks' },
  { quote: 'Trim provides real-time global event tracking in under 15ms. Incredible.', name: 'Michael Chen', handle: 'mchen_dev' },
  { quote: 'The self-hosted Docker deployment for Trim with SSO was a breeze to set up.', name: 'David Wilson', handle: 'dwilson_ops' },
  { quote: 'Hop tracking and malware scanning in Trim gives us total peace of mind.', name: 'Elena Rodriguez', handle: 'elenarod' }
];

const testimonialsRow2 = [
  { quote: 'Switching to Trim from Bitly was seamless. The Analytics alone are worth it.', name: 'James Smith', handle: 'jsmith22' },
  { quote: 'We run massive Black Friday campaigns. Trim never broke a sweat.', name: 'Anna Kowalski', handle: 'anna_k' },
  { quote: 'Trim\\'s immutable audit log is exactly what our compliance team needed.', name: 'Robert Taylor', handle: 'rtaylor_sec' },
  { quote: 'Trim is a beautifully engineered tool. Multi-tenant mode handles our clients perfectly.', name: 'Lisa Wang', handle: 'lisawang_pm' }
];
"""

if "const highlightTrim =" not in content:
    content = content.replace("const HomePage: React.FC = () => {", definitions + "\nconst HomePage: React.FC = () => {")

# 2. Extract out the old marquee section and replace it
start_marker = "{/* ── Testimonials (Infinite Marquee) ─────────────── */}"
end_marker = "{/* ── FAQ Section (CSS Grid Accordion) ─────────────── */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find blocks!")
    sys.exit(1)

new_marquee = """      {/* ── Testimonials (Infinite Marquee) ─────────────── */}
      <section className="bg-background relative overflow-hidden border-b border-border">
        <div className="max-w-7xl mx-auto border-x border-border flex flex-col relative">
          
          <div className="px-6 py-20 text-center border-b border-border bg-background relative z-20">
             <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
               See what thousands of developers have to say
             </h2>
          </div>
          
          <div className="relative z-10 bg-background">
            
          <div className="flex overflow-hidden group w-full bg-background border-b border-border">
            <div className="flex w-max motion-safe:animate-infinite-scroll-x group-hover:[animation-play-state:paused]  ">
              {[...testimonialsRow1, ...testimonialsRow1].map((item, idx) => (
                 <div key={idx} className="marquee-card p-10 lg:p-12 border-r border-border flex-shrink-0 bg-card hover:bg-primary/[0.01] transition-colors flex flex-col justify-between min-h-[250px]">
                    <p className="text-[15px] md:text-[17px] text-foreground font-medium mb-8 leading-relaxed tracking-tight">“{highlightTrim(item.quote)}”</p>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">@{item.handle}</div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
          <div className="flex overflow-hidden group w-full bg-background ">
            <div className="flex w-max motion-safe:animate-infinite-scroll-x group-hover:[animation-play-state:paused] motion-safe:[animation-direction:reverse] ml-[-213px]">
              {[...testimonialsRow2, ...testimonialsRow2].map((item, idx) => (
                 <div key={idx} className="marquee-card p-10 lg:p-12 border-r border-border flex-shrink-0 bg-card hover:bg-primary/[0.01] transition-colors flex flex-col justify-between min-h-[250px]">
                    <p className="text-[15px] md:text-[17px] text-foreground font-medium mb-8 leading-relaxed tracking-tight">“{highlightTrim(item.quote)}”</p>
                    <div>
                      <div className="text-sm font-semibold text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">@{item.handle}</div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
          </div>

          {/* Subtler Fade masks so it matches Laravel Cloud */}
          <div className="absolute left-0 top-[220px] bottom-0 w-12 sm:w-24 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-[220px] bottom-0 w-12 sm:w-24 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
        </div>
      </section>\n\n      """

content = content[:start_idx] + new_marquee + content[end_idx:]

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Highlights added!")
