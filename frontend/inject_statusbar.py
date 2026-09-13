import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

target = "{/* ── Unified Features Bento Grid ───────────────────────────────── */}"
statusbar_jsx = """      {/* ── Status Bar / Ticker (Laravel Cloud Style) ───────────────── */}
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
      </div>

      {/* ── Unified Features Bento Grid ───────────────────────────────── */}"""

if target in content and "Status Bar / Ticker" not in content:
    content = content.replace(target, statusbar_jsx)
    with open('src/pages/HomePage.tsx', 'w') as f:
        f.write(content)
    print("Status bar injected successfully!")
else:
    print("Could not find target or already injected.")

