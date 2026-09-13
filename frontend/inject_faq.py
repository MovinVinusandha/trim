import sys

with open('src/pages/HomePage.tsx', 'r') as f:
    lines = f.readlines()

has_faq = False
for line in lines:
    if "const FaqItem =" in line:
        has_faq = True
        break

if not has_faq:
    for i, line in enumerate(lines):
        if "const HomePage: React.FC =" in line:
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
            
with open('src/pages/HomePage.tsx', 'w') as f:
    f.writelines(lines)
    
print("Injected FaqItem")
