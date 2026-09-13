import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

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

content = content.replace("const HomePage: React.FC = () => {", event_stream_comp + "\nconst HomePage: React.FC = () => {")

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

