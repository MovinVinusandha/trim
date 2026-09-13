import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    lines = f.readlines()

# Find start and end indices
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{/* ── Integrations Grid ───────────────────────────────────────── */}" in line:
        start_idx = i
    if "{/* ── Pricing / Free & Open (Bento Redesign) ─────────── */}" in line:
        end_idx = i

if start_idx == -1 or end_idx == -1:
    print("Could not find blocks!")
    sys.exit(1)

new_code = """      {/* ── Advanced Tech Super-Grid (API, Globe, Integrations) ──────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="bg-background border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-16 border-x border-border">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Built for Scale and Speed
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
              Robust APIs for programmatic control, global edge networks for sub-15ms redirects, and seamless integrations with your stack.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-[1px] bg-border rounded-xl overflow-hidden border border-border shadow-sm">
            
            {/* 1. Developer API (col-span-8) */}
            <div className="col-span-1 md:col-span-8 bg-card p-6 flex flex-col justify-between group hover:bg-primary/[0.02] transition-colors relative">
              <div className="mb-8 relative z-10">
                <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-tight mb-1.5">Developer API</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Automate marketing workflows with our REST API. Batch create links, update destinations on the fly, and manage campaigns.
                </p>
              </div>
              {/* Tight Code Editor Mockup */}
              <div className="rounded-lg overflow-hidden border border-border shadow-sm bg-[#0F111A] relative z-10">
                <div className="h-6 bg-[#181A25] border-b border-white/5 flex items-center px-3 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                  <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                  <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  <div className="mx-auto text-[9px] text-white/40 font-mono flex items-center gap-1.5">
                    <Code className="w-2.5 h-2.5" /> batch_create.sh
                  </div>
                </div>
                <div className="p-3 text-[10px] font-mono leading-relaxed overflow-x-auto text-emerald-400">
                  <span className="text-rose-400">curl</span> -X POST https://api.trim.ly/v1/links/batch \\<br/>
                  &nbsp;&nbsp;-H <span className="text-amber-300">"Authorization: Bearer trim_live_xxx"</span> \\<br/>
                  &nbsp;&nbsp;-d <span className="text-amber-300">{"'{\\"campaign\\": \\"bf2026\\", \\"links\\": [...] }'"}</span>
                </div>
                <div className="p-2.5 text-[9px] font-mono leading-relaxed bg-[#08090E] border-t border-white/5 text-white/60">
                  <span className="text-emerald-400">201 Created</span> (12ms) - {'{"status":"success","created":1500}'}
                </div>
              </div>
            </div>

            {/* 2. Global Edge Network (col-span-4) */}
            <div className="col-span-1 md:col-span-4 bg-card p-6 flex flex-col justify-between group hover:bg-primary/[0.02] transition-colors relative overflow-hidden">
              <div className="mb-6 relative z-10">
                <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                  <Globe2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-foreground tracking-tight mb-1.5">Global Edge Network</h3>
                <p className="text-xs text-muted-foreground">
                  Track clicks globally in real-time. Sub-15ms redirects worldwide.
                </p>
              </div>
              {/* Compact Globe & Event Stream */}
              <div className="relative w-full aspect-square mt-auto flex flex-col justify-end">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48">
                  <div className="absolute inset-0 rounded-full border border-border border-dashed animate-[spin_60s_linear_infinite]" />
                  <div className="absolute inset-4 rounded-full border border-primary/20 bg-background/50 shadow-[inset_0_0_50px_rgba(0,153,255,0.1)] backdrop-blur-sm" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,153,255,0.4),transparent_50%)] rounded-full mix-blend-screen opacity-50" />
                  <Globe2 className="w-10 h-10 text-primary/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                
                {/* Event Stream Overlay */}
                <div className="relative z-10 flex flex-col gap-1.5 mt-20">
                  {[
                    { city: 'Tokyo, JP', color: 'bg-emerald-500' },
                    { city: 'London, UK', color: 'bg-primary' },
                    { city: 'New York, US', color: 'bg-amber-500' },
                  ].map((event, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.15 }}
                      className="px-2.5 py-1.5 border border-border rounded-md bg-card/90 backdrop-blur shadow-sm flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${event.color}`} />
                        <div className="text-[10px] font-semibold text-foreground">{event.city}</div>
                      </div>
                      <div className="text-[8px] text-muted-foreground font-mono">Just now</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Integrations (col-span-12) */}
            <div className="col-span-1 md:col-span-12 bg-card p-4 flex flex-col md:flex-row items-center justify-between group hover:bg-primary/[0.02] transition-colors relative">
              <div className="flex items-center gap-3 mb-4 md:mb-0">
                <div className="w-6 h-6 rounded-md bg-secondary text-muted-foreground flex items-center justify-center">
                  <Workflow className="w-3 h-3" />
                </div>
                <div className="text-xs font-bold text-foreground">Seamless Integrations</div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
                {[
                  { name: 'Slack', icon: Hexagon },
                  { name: 'Zapier', icon: Workflow },
                  { name: 'GitHub', icon: Code },
                  { name: 'Discord', icon: Server },
                  { name: 'Raycast', icon: Terminal },
                  { name: 'Webhooks', icon: Activity },
                ].map((integration, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <integration.icon className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:block">{integration.name}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </motion.section>

      {/* ── Self-Hosted & Enterprise (High-Contrast Inversion) ────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="bg-zinc-900 dark:bg-zinc-100 border-b border-zinc-800 dark:border-zinc-300 relative overflow-hidden transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 py-24 border-x border-zinc-800 dark:border-zinc-300 relative z-10 flex flex-col items-center transition-colors duration-300">
          
          {/* Subtle Ambient Glow (adapts to light/dark inversion) */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 dark:bg-primary/10 rounded-full blur-[150px] saturate-200" />
          
          <div className="w-8 h-8 rounded-md bg-zinc-800 dark:bg-zinc-200 text-zinc-100 dark:text-zinc-900 flex items-center justify-center mb-6 border border-zinc-700 dark:border-zinc-300 transition-colors duration-300">
            <Server className="w-4 h-4" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white dark:text-zinc-900 mb-4 tracking-tight text-center max-w-3xl transition-colors duration-300" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your own private cloud, fully managed <span className="text-zinc-400 dark:text-zinc-500 transition-colors duration-300">and isolated, with enterprise-level support.</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 mt-12 w-full max-w-5xl">
            {/* Checkmarks */}
            <div className="flex flex-col justify-center gap-4">
               {[
                 'Self-Host via Docker or use Multi-Tenant Hosted',
                 'Admin Security Vault with Live .env Sync',
                 'Immutable Audit Log & Tamper-Evident Trails',
                 'System Maintenance Mode & Panic Switch',
                 'Advanced RBAC & Threat Intelligence'
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center gap-3">
                   <Check className="w-4 h-4 text-primary flex-shrink-0" />
                   <span className="text-sm text-zinc-300 dark:text-zinc-700 font-medium transition-colors duration-300">{item}</span>
                 </div>
               ))}
               <div className="flex items-center gap-3 mt-6">
                 <button className="h-10 px-5 rounded-md text-sm font-medium border border-zinc-700 dark:border-zinc-300 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors duration-300">
                   Read Documentation
                 </button>
                 <button className="h-10 px-5 rounded-md text-sm font-medium text-white dark:text-zinc-900 hover:text-zinc-300 dark:hover:text-zinc-600 transition-colors duration-300">
                   Talk to Sales
                 </button>
               </div>
            </div>

            {/* Admin Vault Mockup (Always Dark because terminals are dark) */}
            <div className="border border-zinc-800 dark:border-zinc-300 bg-[#0A0A10] rounded-xl overflow-hidden shadow-2xl relative transition-colors duration-300">
               <div className="h-10 border-b border-white/10 bg-white/[0.02] flex items-center justify-between px-4">
                 <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold flex items-center gap-2"><ShieldAlert className="w-3 h-3 text-rose-500" /> Admin Security Vault</div>
               </div>
               <div className="p-5 flex flex-col gap-4">
                 <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                   <div>
                     <div className="text-sm font-bold text-white">Live .env Sync</div>
                     <div className="text-[10px] text-zinc-400">Synchronize deployment secrets.</div>
                   </div>
                   <div className="w-8 h-4 rounded-full bg-primary/20 flex items-center justify-end p-0.5"><div className="w-3 h-3 rounded-full bg-primary" /></div>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                   <div>
                     <div className="text-sm font-bold text-rose-400">Panic Switch</div>
                     <div className="text-[10px] text-rose-400/60">Immediately quarantine all traffic.</div>
                   </div>
                   <button className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded hover:bg-rose-600 transition-colors">ENGAGE</button>
                 </div>
                 <div className="p-3 text-[10px] font-mono text-zinc-500 bg-black/50 rounded border border-white/5">
                   &gt; docker-compose up -d<br/>
                   &gt; Initializing multi-tenant isolation...<br/>
                   &gt; System ready.
                 </div>
               </div>
            </div>
          </div>
        </div>
      </motion.section>
"""

new_lines = lines[:start_idx] + [new_code] + lines[end_idx:]

with open('src/pages/HomePage.tsx', 'w') as f:
    f.writelines(new_lines)

print("Super-grid injected successfully!")
