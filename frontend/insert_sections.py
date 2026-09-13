import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

target = "{/* ── Pricing / Free & Open (Bento Redesign) ─────────── */}"

new_sections = """
      {/* ── Integrations Grid ───────────────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="bg-background border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-16 border-x border-border flex flex-col items-center">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Plays well with others
          </h2>
          <p className="text-xs text-muted-foreground mb-10 text-center">
            Integrate Trim directly into your existing workflows and tools.
          </p>
          <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-6 gap-[1px] bg-border border border-border rounded-xl overflow-hidden shadow-sm">
            {[
              { name: 'Slack', icon: Hexagon },
              { name: 'Zapier', icon: Workflow },
              { name: 'GitHub', icon: Code },
              { name: 'Discord', icon: Server },
              { name: 'Raycast', icon: Terminal },
              { name: 'Webhooks', icon: Activity },
            ].map((integration, idx) => (
              <div key={idx} className="bg-card aspect-square p-4 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-primary/[0.03] group">
                <integration.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-foreground tracking-wider uppercase">{integration.name}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* ── Developer API (Batch Creation) ───────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="bg-background border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-16 border-x border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            <div>
              <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Terminal className="w-4 h-4" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                API First. <span className="text-muted-foreground">Built for scale.</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                Automate your marketing workflows with our robust REST API. Create batch links, update destinations on the fly, and manage campaigns programmatically.
              </p>
              <ul className="flex flex-col gap-2.5">
                {['Batch link creation endpoints', 'Instant Token Revocation', 'Webhooks & SSE Support'].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-primary" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Split Screen Code Editor Mockup */}
            <div className="rounded-xl overflow-hidden border border-border shadow-lg bg-[#0F111A]">
              <div className="h-8 bg-[#181A25] border-b border-white/5 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <div className="mx-auto text-[10px] text-white/40 font-mono flex items-center gap-2">
                  <Code className="w-3 h-3" /> batch_create.sh
                </div>
              </div>
              <div className="p-4 text-[11px] font-mono leading-relaxed overflow-x-auto text-emerald-400">
                <span className="text-rose-400">curl</span> -X POST https://api.trim.ly/v1/links/batch \\<br/>
                &nbsp;&nbsp;-H <span className="text-amber-300">"Authorization: Bearer trim_live_xxx"</span> \\<br/>
                &nbsp;&nbsp;-H <span className="text-amber-300">"Content-Type: application/json"</span> \\<br/>
                &nbsp;&nbsp;-d <span className="text-amber-300">'{'{'}"campaign_id": "black-friday", "links": [{"url": "https://...", "tags": ["promo"]}]}'</span>
              </div>
              <div className="p-4 text-[10px] font-mono leading-relaxed bg-[#08090E] border-t border-white/5 text-white/60">
                <span className="text-emerald-400">201 Created</span> (12ms)<br/>
                {'{'}<br/>
                &nbsp;&nbsp;"status": "success",<br/>
                &nbsp;&nbsp;"data": {'{'}<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"created": 1500,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"campaign": "black-friday"<br/>
                &nbsp;&nbsp;{'}'}<br/>
                {'}'}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Real-Time Events & 3D Globe ────────────────────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="bg-background border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-20 border-x border-border overflow-hidden relative">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />

          <div className="flex flex-col items-center text-center mb-12 relative z-10">
             <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                <Globe2 className="w-4 h-4" />
             </div>
             <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Global Edge Network
             </h2>
             <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
                Track every click globally in real-time. Trim's distributed network ensures your links resolve in under 15ms anywhere in the world, while the 3D Globe stream visualizes your traffic live.
             </p>
          </div>

          <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center relative z-10">
             {/* 3D Globe Mockup (CSS only) */}
             <div className="flex-1 w-full aspect-square relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-border border-dashed animate-[spin_60s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-primary/20 bg-card/50 shadow-[inset_0_0_50px_rgba(0,153,255,0.1)] backdrop-blur-sm" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(0,153,255,0.4),transparent_50%)] rounded-full mix-blend-screen opacity-50" />
                
                {/* Ping dots representing live traffic */}
                <span className="absolute top-[30%] left-[20%] flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>
                <span className="absolute top-[60%] right-[30%] flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span>
                <span className="absolute bottom-[20%] left-[40%] flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
                
                <Globe2 className="w-16 h-16 text-primary/30" />
             </div>

             {/* Events Stream Feed */}
             <div className="flex-1 w-full flex flex-col gap-3">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Event Stream</div>
                {[
                  { city: 'Tokyo, JP', os: 'iOS', time: 'Just now', color: 'bg-emerald-500' },
                  { city: 'London, UK', os: 'macOS', time: '2s ago', color: 'bg-primary' },
                  { city: 'New York, US', os: 'Windows', time: '5s ago', color: 'bg-amber-500' },
                  { city: 'Sydney, AU', os: 'Android', time: '12s ago', color: 'bg-rose-500' },
                ].map((event, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    className="p-3 border border-border rounded-lg bg-card/80 backdrop-blur shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${event.color}`} />
                      <div>
                        <div className="text-xs font-semibold text-foreground">{event.city}</div>
                        <div className="text-[10px] text-muted-foreground">Redirect via {event.os}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{event.time}</div>
                  </motion.div>
                ))}
             </div>
          </div>
        </div>
      </motion.section>

      {/* ── Self-Hosted & Enterprise (Dark Theme Break) ────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={fadeUpVariant}
        className="bg-[#01000F] border-b border-white/10 relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 py-24 border-x border-white/10 relative z-10 flex flex-col items-center">
          
          {/* Huge subtle dark mode ambient glow */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#44aaff] rounded-full blur-[150px] opacity-10 saturate-200" />
          
          <div className="w-8 h-8 rounded-md bg-white/5 text-white flex items-center justify-center mb-6 border border-white/10">
            <Server className="w-4 h-4 text-[#A1AFC5]" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight text-center max-w-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Your own private cloud, fully managed <span className="text-[#A1AFC5]">and isolated, with enterprise-level support.</span>
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
                   <Check className="w-4 h-4 text-[#44aaff] flex-shrink-0" />
                   <span className="text-sm text-[#A1AFC5]">{item}</span>
                 </div>
               ))}
               <div className="flex items-center gap-3 mt-6">
                 <button className="h-10 px-5 rounded-md text-sm font-medium border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-colors">
                   Read Documentation
                 </button>
                 <button className="h-10 px-5 rounded-md text-sm font-medium text-white hover:text-white/80 transition-colors">
                   Talk to Sales
                 </button>
               </div>
            </div>

            {/* Admin Vault Mockup */}
            <div className="border border-white/10 bg-[#0A0A10] rounded-xl overflow-hidden shadow-2xl relative">
               <div className="h-10 border-b border-white/10 bg-white/[0.02] flex items-center justify-between px-4">
                 <div className="text-[10px] uppercase tracking-widest text-[#A1AFC5] font-bold flex items-center gap-2"><ShieldAlert className="w-3 h-3 text-rose-500" /> Admin Security Vault</div>
               </div>
               <div className="p-5 flex flex-col gap-4">
                 <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                   <div>
                     <div className="text-sm font-bold text-white">Live .env Sync</div>
                     <div className="text-[10px] text-[#A1AFC5]">Synchronize deployment secrets.</div>
                   </div>
                   <div className="w-8 h-4 rounded-full bg-[#44aaff]/20 flex items-center justify-end p-0.5"><div className="w-3 h-3 rounded-full bg-[#44aaff]" /></div>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-lg border border-rose-500/20 bg-rose-500/5">
                   <div>
                     <div className="text-sm font-bold text-rose-400">Panic Switch</div>
                     <div className="text-[10px] text-rose-400/60">Immediately quarantine all traffic.</div>
                   </div>
                   <button className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded hover:bg-rose-600 transition-colors">ENGAGE</button>
                 </div>
                 <div className="p-3 text-[10px] font-mono text-[#A1AFC5]/50 bg-black/50 rounded border border-white/5">
                   > docker-compose up -d<br/>
                   > Initializing multi-tenant isolation...<br/>
                   > System ready.
                 </div>
               </div>
            </div>
          </div>
        </div>
      </motion.section>
"""

new_content = content.replace(target, new_sections + "\n" + target)

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(new_content)

print("Sections successfully injected!")
