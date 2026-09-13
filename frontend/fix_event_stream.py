import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    content = f.read()

start_marker = "const LiveEventStream = () => {"
end_marker = "  );\n};\n"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker, start_idx) + len(end_marker)

new_component = """const LiveEventStream = () => {
  const [events, setEvents] = React.useState(() => [
    generateRandomEvent(),
    generateRandomEvent(),
    generateRandomEvent(),
    generateRandomEvent()
  ]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => {
        const newEvents = [generateRandomEvent(), ...prev];
        return newEvents.slice(0, 4); // Keep exactly 4 full lines visible
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
      
      <div className="flex flex-col relative bg-card">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 53 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-[3fr_3.5fr_2fr_2.5fr] border-b border-border hover:bg-primary/[0.03] transition-colors group cursor-default bg-card h-[53px]">
                <div className="px-3 py-2.5 truncate text-muted-foreground flex items-center h-full">{event.date}</div>
                <div className="px-3 py-2.5 border-l border-border truncate flex flex-col justify-center gap-0.5 h-full">
                  <span className="font-semibold text-foreground leading-none">{event.link}</span>
                  <span className="text-[9px] text-muted-foreground/60 truncate leading-none mt-1">{event.dest}</span>
                </div>
                <div className="px-3 py-2.5 border-l border-border truncate flex items-center gap-1.5 text-muted-foreground h-full">
                  <MapPin className="w-3 h-3 opacity-50" />
                  {event.country}
                </div>
                <div className="px-3 py-2.5 border-l border-border truncate flex items-center gap-1.5 text-muted-foreground h-full">
                  {event.device === 'Mobile' ? <Smartphone className="w-3 h-3 opacity-50" /> : <Laptop className="w-3 h-3 opacity-50" />}
                  {event.device}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
"""

content = content[:start_idx] + new_component + content[end_idx:]

with open('src/pages/HomePage.tsx', 'w') as f:
    f.write(content)

print("Event Stream fixed!")
