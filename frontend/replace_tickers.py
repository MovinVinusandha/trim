import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    lines = f.readlines()

# 1. Inject the SectionTicker component before const HomePage
has_ticker = False
for line in lines:
    if "const SectionTicker =" in line:
        has_ticker = True
        break

if not has_ticker:
    for i, line in enumerate(lines):
        if "const HomePage: React.FC =" in line:
            ticker_code = """
const SectionTicker = ({ number, title, commitMsg }: { number: string, title: string, commitMsg: string }) => (
  <div className="bg-background relative border-b border-border w-full hidden md:block">
    <div className="max-w-7xl mx-auto border-x border-border flex items-stretch h-12 text-[11px] font-mono tracking-widest uppercase">
      <div className="w-12 lg:w-16 flex-shrink-0 border-r border-border flex items-center justify-center text-muted-foreground opacity-60">
        {number}
      </div>
      <div className="flex-grow flex items-center justify-between px-6 overflow-hidden">
        <span className="text-primary font-bold truncate">
          {title}
        </span>
        <span className="text-muted-foreground truncate opacity-70 ml-4 hidden md:inline-block lowercase tracking-normal">
          {commitMsg}
        </span>
      </div>
      <div className="w-12 lg:w-16 flex-shrink-0 border-l border-border bg-hatch"></div>
    </div>
  </div>
);
"""
            lines.insert(i, ticker_code)
            break

# Convert lines to string to use replace
content = "".join(lines)

# Remove the old hardcoded ticker
old_ticker = """            {/* ── Status Bar / Ticker (Laravel Cloud Style) ───────────────── */}
      <div className="bg-background relative border-b border-border w-full hidden md:block">
        <div className="max-w-7xl mx-auto border-x border-border flex items-stretch h-12 text-[11px] font-mono tracking-widest uppercase">
          {/* Left Box: Line Number */}
          <div className="w-12 lg:w-16 flex-shrink-0 border-r border-border flex items-center justify-center text-muted-foreground opacity-60">
            7
          </div>
          
          {/* Middle Box: Content */}
          <div className="flex-grow flex items-center justify-between px-6 overflow-hidden">
            <span className="text-primary font-bold truncate">
              BUILT BY DEVELOPERS FOR DEVELOPERS
            </span>
            <span className="text-muted-foreground truncate opacity-70 ml-4 hidden sm:inline-block lowercase tracking-normal">
              movin vinusandha · [core-742] deploy global edge nodes for sub-15ms hop routing
            </span>
          </div>

          {/* Right Box: Hatch Pattern */}
          <div className="w-12 lg:w-16 flex-shrink-0 border-l border-border bg-hatch">
            {/* CSS repeating linear gradient */}
          </div>
        </div>
      </div>"""

if old_ticker in content:
    content = content.replace(old_ticker, "")

# Now inject the component before each section
replacements = [
    (
        "{/* ── Unified Features Bento Grid ───────────────────────────────── */}", 
        "      <SectionTicker number=\"01\" title=\"CORE ARCHITECTURE\" commitMsg=\"movin vinusandha · [feat-101] initialize robust link management system\" />\n      {/* ── Unified Features Bento Grid ───────────────────────────────── */}"
    ),
    (
        "{/* ── Advanced Tech Super-Grid (API, Globe, Integrations) ──────── */}",
        "      <SectionTicker number=\"02\" title=\"BUILT BY DEVELOPERS FOR DEVELOPERS\" commitMsg=\"movin vinusandha · [core-742] deploy global edge nodes for sub-15ms hop routing\" />\n      {/* ── Advanced Tech Super-Grid (API, Globe, Integrations) ──────── */}"
    ),
    (
        "{/* ── Self-Hosted & Enterprise (High-Contrast Inversion) ────────────── */}",
        "      <SectionTicker number=\"03\" title=\"ENTERPRISE GRADE SECURITY\" commitMsg=\"movin vinusandha · [sec-990] implement admin vault and panic switch quarantine\" />\n      {/* ── Self-Hosted & Enterprise (High-Contrast Inversion) ────────────── */}"
    ),
    (
        "{/* ── Pricing / Free & Open (Bento Redesign) ─────────── */}",
        "      <SectionTicker number=\"04\" title=\"SCALABLE PRICING\" commitMsg=\"movin vinusandha · [ops-304] provision open-source multi-tenant clusters\" />\n{/* ── Pricing / Free & Open (Bento Redesign) ─────────── */}"
    ),
    (
        "{/* ── Testimonials (Infinite Marquee) ─────────────── */}",
        "      <SectionTicker number=\"05\" title=\"LOVED BY MODERN TEAMS\" commitMsg=\"movin vinusandha · [ops-220] scale infrastructure to handle bfcm holiday traffic\" />\n      {/* ── Testimonials (Infinite Marquee) ─────────────── */}"
    ),
    (
        "{/* ── FAQ Section (CSS Grid Accordion) ─────────────── */}",
        "      <SectionTicker number=\"06\" title=\"KNOWLEDGE BASE\" commitMsg=\"movin vinusandha · [docs-2440] add technical faq for zero-trust architecture\" />\n      {/* ── FAQ Section (CSS Grid Accordion) ─────────────── */}"
    )
]

for target, repl in replacements:
    # Avoid double injection
    if repl not in content:
        content = content.replace(target, repl)

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Tickers injected!")
