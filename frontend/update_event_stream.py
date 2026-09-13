import sys
import re

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

# 1. Update Imports
if 'AnimatePresence' not in content:
    content = content.replace("import { motion, type Variants } from 'framer-motion';", "import { motion, AnimatePresence, type Variants } from 'framer-motion';")

# Ensure Laptop and Smartphone are imported from lucide-react
lucide_import_pattern = r'import \{([^}]+)\} from \'lucide-react\';'
match = re.search(lucide_import_pattern, content)
if match:
    imports = match.group(1)
    if 'Laptop' not in imports:
        imports += ', Laptop, Smartphone, MapPin'
        content = content[:match.start(1)] + imports + content[match.end(1):]

# 2. Add LiveEventStream component
event_stream_comp = """
const generateRandomEvent = () => {
  const ids = ['/67E9BA7E', '/96107F21', '/A1B2C3D4', '/FF9922AA', '/XY987654'];
  const countries = ['Local', 'US', 'UK', 'DE', 'FR', 'JP'];
  const devices = ['Desktop', 'Mobile', 'Tablet'];
  
  return {
    id: Math.random().toString(36).substr(2, 9),
    date: `Sep 13 at ${new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`,
    link: ids[Math.floor(Math.random() * ids.length)],
    dest: 'https://github.com/dubinc/d...',
    country: countries[Math.floor(Math.random() * countries.length)],
    device: devices[Math.floor(Math.random() * devices.length)],
  };
};

const LiveEventStream = () => {
  const [events, setEvents] = React.useState(() => [generateRandomEvent(), generateRandomEvent()]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvents = [generateRandomEvent(), ...prev];
        return newEvents.slice(0, 3); // Keep top 3
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full border border-border rounded-lg shadow-sm bg-card overflow-hidden text-[11px] flex flex-col relative z-10">
      <div className="grid grid-cols-[3fr_3.5fr_2fr_2.5fr] border-b border-border bg-muted/20 font-medium text-muted-foreground">
        <div className="px-3 py-2 flex items-center gap-1.5">Date <span className="text-primary text-[10px]">↑↓</span></div>
        <div className="px-3 py-2 border-l border-border">Link</div>
        <div className="px-3 py-2 border-l border-border">Country</div>
        <div className="px-3 py-2 border-l border-border">Device</div>
      </div>
      
      <div className="flex flex-col relative bg-card h-[135px] overflow-hidden">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="grid grid-cols-[3fr_3.5fr_2fr_2.5fr] border-b border-border last:border-b-0 hover:bg-primary/[0.03] transition-colors group cursor-default absolute w-full bg-card"
              style={{ position: 'relative' }}
            >
              <div className="px-3 py-2.5 truncate text-muted-foreground flex items-center">{event.date}</div>
              <div className="px-3 py-2.5 border-l border-border truncate flex flex-col justify-center gap-0.5">
                <span className="font-semibold text-foreground">{event.link}</span>
                <span className="text-[9px] text-muted-foreground/60 truncate">{event.dest}</span>
              </div>
              <div className="px-3 py-2.5 border-l border-border truncate flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="w-3 h-3 opacity-50" />
                {event.country}
              </div>
              <div className="px-3 py-2.5 border-l border-border truncate flex items-center gap-1.5 text-muted-foreground">
                {event.device === 'Mobile' ? <Smartphone className="w-3 h-3 opacity-50" /> : <Laptop className="w-3 h-3 opacity-50" />}
                {event.device}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
"""

if "const LiveEventStream" not in content:
    # Insert right before const HomePage
    content = content.replace("const HomePage = () => {", event_stream_comp + "\nconst HomePage = () => {")


# 3. Replace Developer API section
target_section_start = """            {/* 1. Developer API (col-span-8) */}
            <div className="col-span-1 md:col-span-8 bg-card p-6 flex flex-col justify-between group hover:bg-primary/[0.02] transition-colors relative">"""

# We need to replace the entire 1. Developer API section until the GEN section starts
gen_section_start = """            {/* 2. Global Edge Network (col-span-4) */}"""

start_idx = content.find(target_section_start)
end_idx = content.find(gen_section_start)

replacement_section = """            {/* 1. Real-Time Event Stream (col-span-8) */}
            <div className="col-span-1 md:col-span-8 bg-card p-6 flex flex-col justify-between group hover:bg-primary/[0.02] transition-colors relative">
              <div className="mb-6 relative z-10">
                <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">Real-Time Event Stream</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Application logs, usage, metrics, and geographic tracking codes, all visible in the dashboard in real-time.
                </p>
              </div>
              <LiveEventStream />
            </div>

"""

if start_idx != -1 and end_idx != -1:
    content = content[:start_idx] + replacement_section + content[end_idx:]

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Event Stream added!")
