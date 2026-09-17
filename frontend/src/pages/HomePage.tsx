import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  MousePointerClick,
  Folder,
  Tag,
  BarChart3,
  Shield,
  Zap,
  Sparkles,
  Terminal,
  Globe2,
  Code,
  Server,
  Activity,
  Hexagon,
  Database,
  Workflow,
  ShieldAlert,
  Plus,
  Laptop,
  Smartphone,
  MapPin,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import type { UrlSend } from '../types';

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// Parent is NEVER invisible — only children animate.
// Opacity stays 1 so the section is always in the layout/visible.
// The parent just controls WHEN children start their stagger sequence.
const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.0 } },
};

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const slideLeftVariant: Variants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const scaleInVariant: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

interface ShortenedResult {
  shortUrl: string;
  longUrl: string;
}

// ── GitHub icon (inline SVG) ─────────────────────────────────────────────────
const GithubIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

// ── Crisp Dot Matrix Background ──────────────────────────────────────────────
const DotMatrix: React.FC<{ className?: string; fadeMask?: boolean }> = ({
  className = '',
  fadeMask = true,
}) => (
  <div
    className={`absolute inset-0 w-full h-full pointer-events-none text-zinc-900/[0.18] dark:text-zinc-100/[0.22] ${className}`}
    style={{
      backgroundImage: 'radial-gradient(circle, currentColor 1.25px, transparent 1.25px)',
      backgroundSize: '24px 24px',
      maskImage: fadeMask
        ? 'radial-gradient(ellipse 80% 70% at 50% 50%, black 45%, transparent 100%)'
        : undefined,
      WebkitMaskImage: fadeMask
        ? 'radial-gradient(ellipse 80% 70% at 50% 50%, black 45%, transparent 100%)'
        : undefined,
    }}
  />
);

// ── Quarter-circle decorative shapes ─────────────────────────────────────────
const QuarterCircle: React.FC<{ className?: string; flip?: boolean }> = ({ className, flip }) => (
  <svg
    viewBox="0 0 120 120"
    className={className}
    style={{ transform: flip ? 'scaleX(-1)' : undefined }}
  >
    <path d="M0 120 Q0 0 120 0 L120 120 Z" fill="currentColor" />
  </svg>
);

// ── Feature card (Arcane Grid Cell) ─────────────────────────────────────────
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
}
const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, desc }) => (
  <motion.div variants={cardVariant} whileHover={{ y: -3, transition: { duration: 0.2 } }} className="p-6 sm:p-8 bg-background flex flex-col items-start gap-4 transition-colors group hover:bg-secondary/40">
    <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-border flex items-center justify-center group-hover:text-foreground group-hover:border-border transition-colors">
      {icon}
    </div>
    <div>
      <h3
        className="font-medium text-sm tracking-tighter text-foreground transition-colors"
       
      >
        {title}
      </h3>
      <p className="text-muted-foreground text-xs leading-relaxed mt-1.5">{desc}</p>
    </div>
  </motion.div>
);

// ── Pricing card (Arcane Connected Cell) ─────────────────────────────────────
interface PricingCardProps {
  tier: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  ctaLink?: string;
  highlighted?: boolean;
  onCtaClick?: (e: React.MouseEvent) => void;
}
const PricingCard: React.FC<PricingCardProps> = ({
  tier,
  price,
  description,
  features,
  cta,
  ctaLink = '/register',
  highlighted,
  onCtaClick,
}) => (
  <motion.div variants={cardVariant} whileHover={{ y: -3, transition: { duration: 0.2 } }} className="p-8 sm:p-10 bg-background flex flex-col justify-between transition-colors hover:bg-secondary/20">
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-border flex items-center justify-center">
            {highlighted ? <Sparkles className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{tier}</p>
        </div>
        {highlighted && (
          <span className="text-[10px] uppercase font-medium tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-border">
            Recommended
          </span>
        )}
      </div>
      <p
        className="text-4xl font-medium text-foreground mt-4 tracking-tighter"
       
      >
        {price}
      </p>
      {description && <p className="text-xs mt-2 text-muted-foreground">{description}</p>}
    </div>
    <ul className="flex flex-col gap-3 my-8">
      {features.map((f, i) => (
        <motion.li key={f} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.35 }} className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
            <Check className="w-2.5 h-2.5" />
          </div>
          <span>{f}</span>
        </motion.li>
      ))}
    </ul>
    {onCtaClick ? (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        type="button"
        onClick={onCtaClick}
        className={`w-full text-center px-6 py-2.5 rounded-md font-medium text-xs transition-colors ${
          highlighted ? 'btn-solid' : 'btn-secondary'
        }`}
      >
        {cta}
      </motion.button>
    ) : (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
        <Link
          to={ctaLink}
          className={`w-full text-center px-6 py-2.5 rounded-md font-medium text-xs transition-colors ${
            highlighted ? 'btn-solid' : 'btn-secondary'
          }`}
        >
          {cta}
        </Link>
      </motion.div>
    )}
  </motion.div>
);

// ── Testimonial card (Arcane Review Cell) ────────────────────────────────────
interface TestimonialProps {
  quote: string;
  name: string;
  role: string;
  initials: string;
}
const TestimonialCard: React.FC<TestimonialProps> = ({ quote, name, role, initials }) => (
  <div className="p-8 bg-background flex flex-col justify-between gap-6 hover:bg-secondary/20 transition-colors">
    <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">"{quote}"</p>
    <div className="flex items-center gap-3 pt-4 border-t border-border">
      <div className="w-8 h-8 rounded-full bg-secondary text-foreground border border-border flex items-center justify-center text-xs font-medium flex-shrink-0">
        {initials}
      </div>
      <div>
        <p className="text-xs font-medium text-foreground">{name}</p>
        <p className="text-[11px] text-muted-foreground">{role}</p>
      </div>
    </div>
  </div>
);

// ── Workspace Organization Animated Mockup ─────────────────────────────────
const WorkspaceMockup: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<'marketing' | 'product' | 'social'>('marketing');

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFolder(prev => {
        if (prev === 'marketing') return 'product';
        if (prev === 'product') return 'social';
        return 'marketing';
      });
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const folderData = {
    marketing: {
      folderName: 'Marketing',
      items: [
        { name: 'trim.ly/summer-sale-26', tag: 'campaign' },
        { name: 'trim.ly/newsletter-sep', tag: 'email' },
      ]
    },
    product: {
      folderName: 'Product',
      items: [
        { name: 'trim.ly/changelog-v2', tag: 'release' },
        { name: 'trim.ly/api-docs-latest', tag: 'dev' },
      ]
    },
    social: {
      folderName: 'Social Bio',
      items: [
        { name: 'trim.ly/twitter-bio', tag: 'x.com' },
        { name: 'trim.ly/discord-join', tag: 'community' },
      ]
    }
  };

  const current = folderData[activeFolder];

  return (
    <div className="mt-8 relative w-full h-[220px] border border-border rounded-md bg-background/50 overflow-hidden shadow-sm flex flex-col group-hover:border-primary/30 transition-colors">
      {/* Clean Window Title Bar */}
      <div className="h-8 border-b border-border bg-card/80 flex items-center px-4 gap-2 flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
        <span className="ml-3 text-[10px] font-mono text-muted-foreground/70">workspace / folders</span>
      </div>

      <div className="flex h-full overflow-hidden">
        {/* Left Sidebar: Folder List */}
        <div className="w-36 border-r border-border p-2.5 flex flex-col gap-1.5 flex-shrink-0 bg-secondary/10">
          <button
            type="button"
            onClick={() => setActiveFolder('marketing')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-all text-left ${
              activeFolder === 'marketing' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Folder className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Marketing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFolder('product')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-all text-left ${
              activeFolder === 'product' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Folder className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Product</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFolder('social')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-medium transition-all text-left ${
              activeFolder === 'social' 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Folder className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Social Bio</span>
          </button>
        </div>

        {/* Right Main Panel: Clean Animated Links List */}
        <div className="flex-1 p-4 flex flex-col justify-center overflow-hidden bg-background/30">
          <div className="flex flex-col gap-2.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFolder}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex flex-col gap-2.5"
              >
                {current.items.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded border border-border bg-card shadow-xs"
                  >
                    <span className="font-mono text-xs font-medium text-foreground truncate pr-2">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                      {item.tag}
                    </span>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Automated Link Check Animated Mockup (Pass / Fail cycle) ───────────────
const AutomatedLinkCheckMockup: React.FC = () => {
  const [phase, setPhase] = useState<'loading' | 'passed' | 'fail-loading' | 'failed'>('loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (phase === 'loading') {
      setProgress(0);
      const stepInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(stepInterval);
            timer = setTimeout(() => setPhase('passed'), 200);
            return 100;
          }
          return prev + 12;
        });
      }, 90);
      return () => {
        clearInterval(stepInterval);
        clearTimeout(timer);
      };
    }

    if (phase === 'passed') {
      timer = setTimeout(() => {
        setPhase('fail-loading');
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (phase === 'fail-loading') {
      setProgress(0);
      const stepInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(stepInterval);
            timer = setTimeout(() => setPhase('failed'), 200);
            return 100;
          }
          return prev + 12;
        });
      }, 90);
      return () => {
        clearInterval(stepInterval);
        clearTimeout(timer);
      };
    }

    if (phase === 'failed') {
      timer = setTimeout(() => {
        setPhase('loading');
      }, 3200);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const isFailed = phase === 'failed' || phase === 'fail-loading';
  const isLoaded = phase === 'passed' || phase === 'failed';

  const currentUrl = isFailed ? 'https://malicious-redirect-hazard.xyz' : 'https://example.com/very/long/path...';

  return (
    <div className="w-full md:w-96 p-4 border border-border rounded-md bg-background/50 shadow-sm flex flex-col gap-3 group-hover:border-primary/30 transition-colors relative overflow-hidden">
      {/* Top progress bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-secondary overflow-hidden">
        <motion.div
          className={`h-full ${isFailed ? 'bg-rose-500' : 'bg-emerald-500'}`}
          initial={{ width: '0%' }}
          animate={{ width: isLoaded ? '100%' : `${progress}%` }}
          transition={{ ease: 'easeOut', duration: 0.1 }}
        />
      </div>

      {/* Header bar: URL & overall status pill */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div className="text-xs text-muted-foreground font-mono truncate max-w-[220px]">
          {currentUrl}
        </div>

        <AnimatePresence mode="wait">
          {phase === 'loading' || phase === 'fail-loading' ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="text-[10px] font-medium font-mono text-primary bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1 border border-primary/20 shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              SCANNING {progress}%
            </motion.div>
          ) : phase === 'passed' ? (
            <motion.div
              key="secure"
              initial={{ opacity: 0, scale: 0.8, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-[10px] font-medium font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/20 shrink-0"
            >
              <Check className="w-3 h-3" /> SECURE
            </motion.div>
          ) : (
            <motion.div
              key="threat"
              initial={{ opacity: 0, scale: 0.8, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-[10px] font-medium font-mono text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-rose-500/20 shrink-0"
            >
              <AlertTriangle className="w-3 h-3" /> THREAT
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid of 3 result metrics with pop-up transition */}
      <div className="grid grid-cols-3 gap-2">
        {/* Status card */}
        <div className="bg-card border border-border rounded p-2 text-center flex flex-col justify-center min-h-[58px] relative overflow-hidden">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-mono">Status</div>
          <AnimatePresence mode="wait">
            {!isLoaded ? (
              <motion.div
                key="loading-status"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="h-3.5 w-12 bg-muted rounded mx-auto animate-pulse"
              />
            ) : phase === 'passed' ? (
              <motion.div
                key="status-passed"
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.05 }}
                className="text-xs font-medium text-foreground flex items-center justify-center gap-1"
              >
                200 OK
              </motion.div>
            ) : (
              <motion.div
                key="status-failed"
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.05 }}
                className="text-xs font-medium text-rose-500 flex items-center justify-center gap-1"
              >
                403 BLOCKED
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Malware card */}
        <div className="bg-card border border-border rounded p-2 text-center flex flex-col justify-center min-h-[58px] relative overflow-hidden">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-mono">Malware</div>
          <AnimatePresence mode="wait">
            {!isLoaded ? (
              <motion.div
                key="loading-malware"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="h-3.5 w-12 bg-muted rounded mx-auto animate-pulse"
              />
            ) : phase === 'passed' ? (
              <motion.div
                key="malware-passed"
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.12 }}
                className="text-xs font-medium text-emerald-500 flex items-center justify-center gap-1"
              >
                Passed
              </motion.div>
            ) : (
              <motion.div
                key="malware-detected"
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.12 }}
                className="text-xs font-medium text-rose-500 flex items-center justify-center gap-1 font-bold"
              >
                Detected
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phishing card */}
        <div className="bg-card border border-border rounded p-2 text-center flex flex-col justify-center min-h-[58px] relative overflow-hidden">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-mono">Phishing</div>
          <AnimatePresence mode="wait">
            {!isLoaded ? (
              <motion.div
                key="loading-phishing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                className="h-3.5 w-12 bg-muted rounded mx-auto animate-pulse"
              />
            ) : phase === 'passed' ? (
              <motion.div
                key="phishing-passed"
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.19 }}
                className="text-xs font-medium text-emerald-500 flex items-center justify-center gap-1"
              >
                Passed
              </motion.div>
            ) : (
              <motion.div
                key="phishing-flagged"
                initial={{ opacity: 0, scale: 0.8, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 22, delay: 0.19 }}
                className="text-xs font-medium text-rose-500 flex items-center justify-center gap-1 font-bold"
              >
                Flagged
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

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

const SectionTicker = ({ number, title, commitMsg }: { number: string, title: string, commitMsg: string }) => (
  <div className="w-full hidden md:block flex flex-col">
    {/* Gap Row */}
    <div className="bg-background relative border-b border-border">
      <div className="max-w-7xl mx-auto border-x border-border flex items-stretch h-10 sm:h-12">
        <div className="w-12 lg:w-16 flex-shrink-0 border-r border-border"></div>
        <div className="flex-grow"></div>
        <div className="w-12 lg:w-16 flex-shrink-0 border-l border-border"></div>
      </div>
    </div>
    {/* Ticker Row */}
    <div className="bg-background relative border-b border-border">
      <div className="max-w-7xl mx-auto border-x border-border flex items-stretch h-12 text-[11px] font-mono tracking-widest uppercase">
        <div className="w-12 lg:w-16 flex-shrink-0 border-r border-border flex items-center justify-center text-muted-foreground opacity-60">
          {number}
        </div>
        <div className="flex-grow flex items-center justify-between px-6 overflow-hidden">
          <span className="text-primary font-medium text-[10px] md:text-[11px] truncate tracking-wider">
            {title}
          </span>
          <span className="text-muted-foreground truncate opacity-70 ml-4 hidden md:inline-block lowercase tracking-normal">
            {commitMsg}
          </span>
        </div>
        <div className="w-12 lg:w-16 flex-shrink-0 border-l border-border bg-hatch"></div>
      </div>
    </div>
  </div>
);

const highlightTrim = (text: string) => {
  const parts = text.split(/(Trim)/gi);
  return parts.map((part, i) => 
    part.toLowerCase() === 'trim' ? <span key={i} className="text-primary">{part}</span> : part
  );
};

const testimonialsRow1 = [
  { quote: 'Trim\'s Batch Creation API saved our marketing team hundreds of hours.', name: 'Sarah Jenkins', handle: 'sarahjenks' },
  { quote: 'Trim provides real-time global event tracking in under 15ms. Incredible.', name: 'Michael Chen', handle: 'mchen_dev' },
  { quote: 'The self-hosted Docker deployment for Trim with SSO was a breeze to set up.', name: 'David Wilson', handle: 'dwilson_ops' },
  { quote: 'Hop tracking and malware scanning in Trim gives us total peace of mind.', name: 'Elena Rodriguez', handle: 'elenarod' }
];

const testimonialsRow2 = [
  { quote: 'Switching to Trim from Bitly was seamless. The Analytics alone are worth it.', name: 'James Smith', handle: 'jsmith22' },
  { quote: 'We run massive Black Friday campaigns. Trim never broke a sweat.', name: 'Anna Kowalski', handle: 'anna_k' },
  { quote: 'Trim\'s immutable audit log is exactly what our compliance team needed.', name: 'Robert Taylor', handle: 'rtaylor_sec' },
  { quote: 'Trim is a beautifully engineered tool. Multi-tenant mode handles our clients perfectly.', name: 'Lisa Wang', handle: 'lisawang_pm' }
];


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
        return newEvents.slice(0, 5); // Keep up to 5 so bottom item smoothly collapses out
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full border border-border rounded-lg shadow-sm bg-card overflow-hidden text-[11px] flex flex-col relative z-10">
      <div className="grid grid-cols-[3fr_3.5fr_2fr_2.5fr] border-b border-border bg-muted/20 font-medium text-muted-foreground z-10">
        <div className="px-3 py-2 flex items-center gap-1.5">Date <span className="text-primary text-[10px]">↑↓</span></div>
        <div className="px-3 py-2 border-l border-border">Link</div>
        <div className="px-3 py-2 border-l border-border">Country</div>
        <div className="px-3 py-2 border-l border-border">Device</div>
      </div>
      
      {/* Fixed height container (4 rows * 53px = 212px) to prevent layout stutter */}
      <div className="h-[212px] overflow-hidden flex flex-col relative bg-card">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              layout="position"
              initial={{ opacity: 0, height: 0, y: -20 }}
              animate={{ opacity: 1, height: 53, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ 
                height: { duration: 0.45, ease: [0.25, 1, 0.5, 1] },
                opacity: { duration: 0.35, ease: "easeOut" },
                y: { duration: 0.45, ease: [0.25, 1, 0.5, 1] },
                layout: { duration: 0.45, ease: [0.25, 1, 0.5, 1] }
              }}
              className="overflow-hidden flex-shrink-0"
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

const HomePage: React.FC = () => {
  const { token } = useAuth();
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [longUrl, setLongUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<ShortenedResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleTryItNow = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    setTimeout(() => {
      urlInputRef.current?.focus();
    }, 400);
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl.trim()) return;
    setError('');
    setGeneratedUrl(null);
    setLoading(true);
    try {
      const { data } = await axiosInstance.post<UrlSend>('/shorten', {
        longUrl: longUrl.trim(),
      });
      setGeneratedUrl({ shortUrl: data.shortUrl, longUrl: data.longUrl });
    } catch (err: any) {
      const backendMessage = String(
        err?.response?.data?.message || err?.message || 'Failed to shorten URL. Please try again.'
      );
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary"
      style={{ fontFamily: "'Inter', 'Space Grotesk', sans-serif" }}
    >
      {/* ── Fixed Minimalist Navigation ──────────────────────────────── */}
                        {/* 1. Navbar Glass Background Layer (Separate so it doesn't break mix-blend-mode) */}
      <div className="fixed top-0 left-0 right-0 h-14 z-40 backdrop-blur-md pointer-events-none" />

      {/* 2. Navbar Content Layer (Strictly mix-blend-difference, NO backdrop filters here) */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 mix-blend-difference text-white pointer-events-none border-b border-[#1A1814]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between pointer-events-auto">
          
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BrandLogo className="h-5 w-auto text-white" />
          </Link>

          {/* Center: Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium absolute left-1/2 -translate-x-1/2">
            <a href="#features" className="hover:opacity-70 transition-opacity">
              Features
            </a>
            <a href="#pricing" className="hover:opacity-70 transition-opacity">
              Pricing
            </a>
            <a href="#testimonials" className="hover:opacity-70 transition-opacity">
              Reviews
            </a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-4">
            <div className="hover:opacity-70 transition-opacity">
              <ThemeToggle className="!bg-transparent !border-transparent !text-white hover:!opacity-70" />
            </div>
            {token ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-md text-[13px] font-medium px-4 py-1.5 border border-white hover:bg-white hover:text-black transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[13px] font-medium hover:opacity-70 transition-opacity px-2 py-1"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center rounded-md text-[13px] font-medium px-4 py-1.5 bg-white text-black hover:opacity-90 transition-opacity"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
      {/* ── Hero Section ──────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative overflow-hidden pt-28 pb-16 border-b border-border"
      >
        {/* Crisp Visible Dot Matrix */}
        <DotMatrix />

        {/* Subtle Ambient Radial Glow */}
        
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12 flex flex-col items-center gap-6 sm:gap-7">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full max-w-3xl mx-auto text-center flex flex-col items-center gap-6 sm:gap-7"
          >
          {/* 1. Badge */}
          <motion.div
            variants={fadeUpVariant}
            className="group inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md border border-border bg-card/80 backdrop-blur-sm text-[11px] uppercase tracking-widest font-semibold text-muted-foreground shadow-sm hover:border-border/80 hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-foreground opacity-50" />
            <span>Fast · Free · No signup needed</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1 text-muted-foreground group-hover:text-foreground" />
          </motion.div>

          {/* 2. Trim Logo */}
          <motion.div variants={fadeUpVariant} className="flex items-center justify-center mt-1 mb-3 sm:mb-5">
            <BrandLogo className="h-16 sm:h-20 md:h-24 w-auto text-foreground" />
          </motion.div>

          {/* 3. Headline */}
          <motion.h1
            variants={fadeUpVariant}
            className="text-5xl sm:text-6xl lg:text-[5rem] font-medium text-foreground leading-none tracking-tighter max-w-2xl"
           
          >
            Shorten, track &amp;
            <br />
            <span className="relative">
              manage your links{' '}
              
            </span>
          </motion.h1>

          {/* 4. Subtitle Paragraph */}
          <motion.p
            variants={fadeUpVariant}
            className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed mt-3 sm:mt-5"
          >
            Paste your long URL below and get a short, shareable link instantly. No account required
            to try it out.
          </motion.p>

          {/* ── Shorten Form ──────────────────────────────────────── */}
          <motion.div variants={fadeUpVariant} className="w-full max-w-2xl mt-1">
            <form
              onSubmit={handleShorten}
              className="flex flex-col sm:flex-row gap-2 p-1.5 sm:p-2 bg-card border border-border rounded-md shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all group"
            >
              <div className="flex-1 relative flex items-center">
                <Link2 className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none flex-shrink-0" />
                <input
                  ref={urlInputRef}
                  id="home-shorten-input"
                  type="url"
                  required
                  value={longUrl}
                  onChange={(e) => {
                    setLongUrl(e.target.value);
                    setGeneratedUrl(null);
                    setError('');
                  }}
                  className="w-full bg-transparent pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
                  placeholder="Paste your long URL here…"
                />
              </div>
              <motion.button
                id="home-shorten-submit"
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.97 }}
                className="btn-solid px-5 py-2.5 text-xs font-medium flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-60 transition-all rounded-md"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Shortening…</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:scale-125  group-hover:fill-current" />
                    <span>Shorten it</span>
                  </>
                )}
              </motion.button>
            </form>

            {/* Error */}
            {error && (
              <div className="mt-3 flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/30 rounded-md px-4 py-2.5 text-left shadow-sm">
                <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <p className="text-rose-500 text-xs font-medium">{error}</p>
              </div>
            )}

            {/* Result */}
            {generatedUrl && (
              <div className="mt-3 p-4 bg-card border border-border rounded-md text-left shadow-sm">
                <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider mb-2">
                  Your short link is ready
                </p>
                <div className="flex items-center gap-3">
                  <a
                    href={generatedUrl.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-foreground font-medium text-sm hover:underline flex items-center gap-1.5 min-w-0"
                  >
                    <span className="truncate">{generatedUrl.shortUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
                  </a>
                  <button
                    id="home-copy-btn"
                    onClick={copyToClipboard}
                    className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 rounded-md"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-muted-foreground text-xs mt-2 truncate">
                  → {generatedUrl.longUrl}
                </p>
              </div>
            )}

            {/* Sub-CTA */}
            <p className="mt-4 text-xs text-muted-foreground">
              {token ? (
                <>
                  Go to your{' '}
                  <Link
                    to="/dashboard"
                    className="font-medium text-foreground underline hover:no-underline"
                  >
                    dashboard
                  </Link>{' '}
                  to manage, edit, and track all your links.
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="font-medium text-foreground underline hover:no-underline"
                  >
                    Create a free account
                  </Link>{' '}
                  to manage, edit, and track your links.
                </>
              )}
            </p>
          </motion.div>
        </motion.div>
        </div>
      </section>
      </main>

      {/* ── Trusted by Section ──────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={fadeUpVariant}
        className="bg-background relative w-full border-b border-border"
      >
        <div className="max-w-7xl mx-auto border-x border-border">
          <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border border-b border-transparent">
            {/* Title Cell */}
            <div className="col-span-1 p-6 flex items-center justify-center lg:justify-start bg-background z-10 relative">
              <h2 className="text-muted-foreground text-xs font-medium uppercase tracking-widest text-center lg:text-left">
                Trusted by modern teams and developers
              </h2>
            </div>
            
            {/* Scrolling Logos Marquee */}
            <div className="col-span-1 lg:col-span-4 overflow-hidden flex bg-background group">
              <div className="flex w-max motion-safe:animate-infinite-scroll-x group-hover:[animation-play-state:paused]">
                {[
                  "/figma/logo2.svg",
                  "/figma/logo3.svg",
                  "/figma/logo4.svg",
                  "/figma/natroma.svg",
                  "/figma/logo2.svg",
                  "/figma/logo3.svg",
                  "/figma/logo4.svg",
                  "/figma/natroma.svg"
                ].map((src, idx) => (
                  <div 
                    key={idx} 
                    className="w-[200px] lg:w-[250px] p-6 md:p-8 flex items-center justify-center border-r border-border hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors shrink-0"
                  >
                    <img
                      src={src}
                      alt="Partner Logo"
                      className="max-h-[28px] w-auto brightness-0 dark:invert"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>



            <SectionTicker number="01" title="CORE ARCHITECTURE" commitMsg="movin vinusandha · [feat-101] initialize robust link management system" />
      {/* ── Unified Features Bento Grid ───────────────────────────────── */}
      <motion.section
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="bg-background border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-16 border-x border-border">
          <motion.div variants={fadeUpVariant} className="text-center mb-10">
            <h2
              className="text-2xl sm:text-3xl font-medium text-foreground mb-3 tracking-tighter"
             
            >
              Everything you need, in one place.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
              Powerful link management with real-time analytics, custom domains, and team collaboration.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-12 gap-[1px] bg-border rounded-lg overflow-hidden border border-border shadow-sm auto-rows-[minmax(280px,_auto)]">
            {/* 1. Dashboard (col-span-8) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-4 bg-card p-5 sm:p-6 flex flex-col justify-between relative group transition-colors hover:bg-primary/[0.02]">
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-3">
                  <Folder className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">Workspace Organization</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Organize links with Folders & Tags. Keep your workspace tidy and filter your entire library in seconds.
                </p>
              </div>
              {/* Nested UI: Interactive & Animated Workspace Mockup */}
              <WorkspaceMockup />
            </motion.div>

            {/* 2. Analytics (col-span-4) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-8 bg-card p-5 sm:p-6 flex flex-col justify-between relative group transition-colors hover:bg-primary/[0.02]">
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-3">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">Deep Analytics</h3>
                <p className="text-xs text-muted-foreground">
                  Track clicks, devices, browsers, and geographic data in real-time.
                </p>
              </div>
              
              {/* Nested UI: High-Fidelity Analytics Mockup */}
              <div className="mt-8 border border-border rounded-md bg-background overflow-hidden flex flex-col relative group-hover:border-primary/30 transition-colors shadow-sm">
                {/* KPIs */}
                <div className="flex items-center border-b border-border bg-card/50">
                  <div className="p-3 border-r border-border flex-1">
                    <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5"><Activity className="w-3 h-3 text-primary" /> Total Clicks</div>
                    <div className="text-lg font-medium tracking-tight text-foreground">351</div>
                  </div>
                  <div className="p-3 border-r border-border flex-1 hidden sm:block">
                    <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5"><Zap className="w-3 h-3 text-amber-500" /> Peak Traffic</div>
                    <div className="text-lg font-medium tracking-tight text-foreground flex items-baseline gap-1.5">209 <span className="text-[8px] text-muted-foreground font-normal tracking-normal uppercase">(Fri, Sep 11)</span></div>
                  </div>
                  <div className="p-3 flex-1">
                    <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wider flex items-center gap-1.5"><Globe2 className="w-3 h-3 text-emerald-500" /> Top Source</div>
                    <div className="text-lg font-medium tracking-tight text-foreground">Chrome</div>
                  </div>
                </div>
                
                {/* Chart Area */}
                <div className="relative h-40 w-full p-4 flex flex-col justify-between overflow-hidden">
                  {/* Grid lines */}
                  <div className="absolute inset-x-4 inset-y-4 flex flex-col justify-between pointer-events-none">
                    <div className="border-t border-border border-dashed w-full" />
                    <div className="border-t border-border border-dashed w-full" />
                    <div className="border-t border-border border-dashed w-full" />
                    <div className="border-t border-border border-dashed w-full" />
                  </div>
                  
                  {/* Y Axis Labels */}
                  <div className="absolute left-4 inset-y-4 flex flex-col justify-between text-[9px] text-muted-foreground font-mono z-10 pointer-events-none">
                    <span>220</span>
                    <span>165</span>
                    <span>110</span>
                    <span>55</span>
                    <span>0</span>
                  </div>

                  {/* The SVG Chart */}
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full absolute inset-0 text-primary">
                      <defs>
                        <linearGradient id="chart-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
                          <stop offset="60%" stopColor="currentColor" stopOpacity="0.08" />
                          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Smooth Organic Growth Wave */}
                      <motion.path 
                        d="M0,82 C35,80 65,72 95,68 C130,64 160,70 190,52 C220,34 245,38 270,16 C295,30 325,48 355,42 C375,38 390,44 400,45 L400,100 L0,100 Z"
                        fill="url(#chart-gradient)"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                      <motion.path 
                        d="M0,82 C35,80 65,72 95,68 C130,64 160,70 190,52 C220,34 245,38 270,16 C295,30 325,48 355,42 C375,38 390,44 400,45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        transition={{ duration: 1.6, ease: "easeInOut" }}
                      />
                    </svg>
                  </div>
                  
                  {/* Floating Peak Tooltip & Pulse Dot pinned to peak (x: 270/400 = 67.5%, y: 16%) */}
                  <div className="absolute left-[67.5%] top-[16%] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border-2 border-background shadow-xs" />
                    </span>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.4 }}
                    className="absolute top-2 right-12 sm:right-24 bg-card/95 backdrop-blur-sm border border-border shadow-md rounded-md p-2 flex flex-col gap-0.5 z-20"
                  >
                    <div className="text-[8px] text-muted-foreground font-mono flex items-center justify-between gap-2">
                      <span>Fri, Sep 11</span>
                      <span className="text-[7px] bg-primary/10 text-primary font-bold px-1 rounded">PEAK</span>
                    </div>
                    <div className="text-[11px] font-semibold flex items-center gap-1.5 text-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      209 clicks/min
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* 4. Custom Aliases (col-span-8) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-8 bg-card p-5 sm:p-6 flex flex-col justify-between relative group transition-colors hover:bg-primary/[0.02]">
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-md bg-secondary text-foreground flex items-center justify-center mb-3">
                  <MousePointerClick className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">Custom Aliases</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Create branded short links with your own memorable custom slug, improving click-through rates.
                </p>
              </div>
              {/* Nested UI: Slug editor */}
              <div className="mt-8 flex items-center max-w-md w-full">
                <div className="px-4 py-3 bg-secondary border border-r-0 border-border rounded-l-lg text-sm text-muted-foreground flex-shrink-0">trim.ly/</div>
                <div className="flex-1 px-4 py-3 bg-background border border-primary/50 rounded-r-lg text-sm text-foreground shadow-[0_0_0_1px_rgba(0,153,255,0.2)]">my-custom-brand</div>
              </div>
            </motion.div>

            {/* 3. Password Protection (col-span-4) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-4 bg-card p-5 sm:p-6 flex flex-col justify-between relative group transition-colors hover:bg-primary/[0.02]">
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-md bg-secondary text-foreground flex items-center justify-center mb-3">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">Password Protection</h3>
                <p className="text-xs text-muted-foreground">
                  Secure sensitive links behind a password so only the right people can access them.
                </p>
              </div>
              {/* Nested UI: Lock input */}
              <div className="mt-8 p-3 border border-border rounded-md bg-background flex items-center gap-2 shadow-sm group-hover:border-primary/30 transition-colors">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <div className="h-7 w-full bg-secondary rounded flex-1 flex items-center px-2">
                  <span className="text-xs text-muted-foreground tracking-[0.3em]">••••••••</span>
                </div>
                <div className="w-16 h-7 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] text-primary font-medium uppercase tracking-wider">Unlock</div>
              </div>
            </motion.div>

            {/* 5. UTM Templates (col-span-4) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-4 bg-card p-5 sm:p-6 flex flex-col justify-between relative group transition-colors hover:bg-primary/[0.02]">
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-md bg-secondary text-foreground flex items-center justify-center mb-3">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">UTM Templates</h3>
                <p className="text-xs text-muted-foreground">
                  Build and save UTM parameter templates to keep your marketing campaigns consistent.
                </p>
              </div>
              {/* Nested UI: UTM Builder */}
              <div className="mt-8 flex flex-col gap-2 p-4 border border-border rounded-md bg-background/50 shadow-sm group-hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-16">Source</div>
                  <div className="h-6 flex-1 bg-secondary rounded border border-border px-2 flex items-center"><span className="text-xs text-foreground">newsletter</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider w-16">Medium</div>
                  <div className="h-6 flex-1 bg-secondary rounded border border-border px-2 flex items-center"><span className="text-xs text-foreground">email</span></div>
                </div>
              </div>
            </motion.div>

            {/* 6. Campaigns (col-span-8) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-8 bg-card p-5 sm:p-6 flex flex-col justify-between relative group transition-colors hover:bg-primary/[0.02]">
              <div className="relative z-10">
                <div className="w-8 h-8 rounded-md bg-secondary text-foreground flex items-center justify-center mb-3">
                  <Folder className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">Campaign Management</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Group links into unified campaigns. Track aggregate performance and ROI across multiple channels at once.
                </p>
              </div>
              {/* Nested UI: Campaign List */}
              <div className="mt-8 flex flex-col gap-3 p-4 border border-border rounded-md bg-background/50 shadow-sm group-hover:border-primary/30 transition-colors">
                 <div className="flex items-center justify-between p-3 border border-border rounded bg-card">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-md bg-rose-500/10 text-rose-500 flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
                       <div>
                         <div className="text-sm font-medium text-foreground">Black Friday 2026</div>
                         <div className="text-[10px] text-muted-foreground">14 links • 45.2k clicks</div>
                       </div>
                    </div>
                    <div className="h-6 px-3 rounded-full bg-secondary text-foreground text-[10px] font-medium flex items-center">ACTIVE</div>
                 </div>
                 <div className="flex items-center justify-between p-3 border border-border rounded bg-card opacity-60">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center"><Folder className="w-4 h-4" /></div>
                       <div>
                         <div className="text-sm font-medium text-foreground">Summer Sale</div>
                         <div className="text-[10px] text-muted-foreground">8 links • 12.1k clicks</div>
                       </div>
                    </div>
                    <div className="h-6 px-3 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] font-medium flex items-center">ENDED</div>
                 </div>
              </div>
            </motion.div>

            {/* 7. Link Check (col-span-12) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-12 bg-card p-5 sm:p-8 flex flex-col md:flex-row items-center gap-8 relative group transition-colors hover:bg-primary/[0.02]">
              <div className="relative z-10 flex-1">
                <div className="w-8 h-8 rounded-md bg-secondary text-foreground flex items-center justify-center mb-3">
                  <Check className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">Automated Link Check</h3>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Trim automatically scans your destination URLs for malware, phishing, and broken links, ensuring your audience always lands safely.
                </p>
              </div>
              {/* Nested UI: Interactive & Dynamic Link Scan Mockup */}
              <AutomatedLinkCheckMockup />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      
            <SectionTicker number="02" title="BUILT BY DEVELOPERS FOR DEVELOPERS" commitMsg="movin vinusandha · [core-742] deploy global edge nodes for sub-15ms hop routing" />
      {/* ── Advanced Tech Super-Grid (API, Globe, Integrations) ──────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="bg-background border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-16 border-x border-border">
          <motion.div variants={fadeUpVariant} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-medium text-foreground mb-2 tracking-tighter">
              Built for Scale and Speed
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl mx-auto">
              Robust APIs for programmatic control, global edge networks for sub-15ms redirects, and seamless integrations with your stack.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-12 gap-[1px] bg-border rounded-lg overflow-hidden border border-border shadow-sm">
            
            {/* 1. Real-Time Event Stream (col-span-8) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-8 bg-card p-6 flex flex-col justify-between group hover:bg-primary/[0.02] transition-colors relative">
              <div className="mb-5 relative z-10">
                <div className="w-8 h-8 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">Real-Time Event Stream</h3>
                <p className="text-xs text-muted-foreground max-w-md">
                  Application logs, usage, metrics, and geographic tracking codes, all visible in the dashboard in real-time.
                </p>
              </div>
              <LiveEventStream />
            </motion.div>

            {/* 2. Global Edge Network (col-span-4) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-4 bg-card p-6 flex flex-col justify-between group hover:bg-primary/[0.02] transition-colors relative overflow-hidden">
              <div className="mb-5 relative z-10">
                <div className="w-8 h-8 rounded-md bg-secondary text-foreground flex items-center justify-center mb-3">
                  <Globe2 className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-medium text-foreground tracking-tighter mb-1.5">Global Edge Network</h3>
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
                        <div className="text-[10px] font-medium text-foreground">{event.city}</div>
                      </div>
                      <div className="text-[8px] text-muted-foreground font-mono">Just now</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* 3. Integrations (col-span-12) */}
            <motion.div variants={cardVariant} className="col-span-1 md:col-span-12 bg-card p-4 flex flex-col md:flex-row items-center justify-between group hover:bg-primary/[0.02] transition-colors relative">
              <div className="flex items-center gap-3 mb-3 md:mb-0">
                <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
                  <Workflow className="w-3 h-3" />
                </div>
                <div className="text-xs font-medium text-foreground">Seamless Integrations</div>
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
                    <span className="text-[10px] font-medium uppercase tracking-wider hidden sm:block">{integration.name}</span>
                  </div>
                ))}
              </div>
            </motion.div>

          </motion.div>
        </div>
      </motion.section>

            <SectionTicker number="03" title="ENTERPRISE GRADE SECURITY" commitMsg="movin vinusandha · [sec-990] implement admin vault and panic switch quarantine" />
      {/* ── Self-Hosted & Enterprise (High-Contrast Inversion) ────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="bg-zinc-950 dark:bg-zinc-900 border-b border-white/10 relative overflow-hidden transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-6 py-24 border-x border-white/10 relative z-10 flex flex-col items-center transition-colors duration-300">
          
          {/* Subtle Ambient Glow (adapts to light/dark inversion) */}
          
          
          <motion.div variants={scaleInVariant} className="w-8 h-8 rounded-md bg-zinc-800 text-zinc-100 flex items-center justify-center mb-5 border border-white/10 transition-colors duration-300">
            <Server className="w-4 h-4" />
          </motion.div>

          <motion.h2 variants={fadeUpVariant} className="text-3xl sm:text-4xl lg:text-5xl font-medium text-white mb-3 tracking-tighter text-center max-w-3xl transition-colors duration-300">
            Your own private cloud, fully managed <span className="text-zinc-400 transition-colors duration-300">and isolated, with enterprise-level support.</span>
          </motion.h2>
          
          <motion.div variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 mt-12 w-full max-w-5xl">
            {/* Checkmarks */}
            <motion.div variants={fadeUpVariant} className="flex flex-col justify-center gap-4">
               {[
                 'Self-Host via Docker or use Multi-Tenant Hosted',
                 'Admin Security Vault with Live .env Sync',
                 'Immutable Audit Log & Tamper-Evident Trails',
                 'System Maintenance Mode & Panic Switch',
                 'Advanced RBAC & Threat Intelligence'
               ].map((item, idx) => (
                 <motion.div key={idx} variants={slideLeftVariant} className="flex items-center gap-3">
                   <Check className="w-4 h-4 text-primary flex-shrink-0" />
                   <span className="text-sm text-zinc-300 font-medium transition-colors duration-300">{item}</span>
                 </motion.div>
               ))}
               <div className="flex items-center gap-3 mt-6">
                 <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="h-10 px-5 rounded-md text-sm font-medium border border-white/10 bg-white/10 text-white hover:bg-white/20 transition-colors duration-300">
                   Read Documentation
                 </motion.button>
                 <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} className="h-10 px-5 rounded-md text-sm font-medium text-zinc-300 hover:text-white transition-colors duration-300">
                   Talk to Sales
                 </motion.button>
               </div>
            </motion.div>

            {/* Admin Vault Mockup (Always Dark because terminals are dark) */}
            <motion.div variants={cardVariant} className="border border-white/10 bg-[#0A0A10] rounded-lg overflow-hidden shadow-2xl relative transition-colors duration-300">
               <div className="h-10 border-b border-white/10 bg-white/[0.02] flex items-center justify-between px-4">
                 <div className="text-[10px] uppercase tracking-widest text-zinc-400 font-medium flex items-center gap-2"><ShieldAlert className="w-3 h-3 text-rose-500" /> Admin Security Vault</div>
               </div>
               <div className="p-5 flex flex-col gap-4">
                 <div className="flex items-center justify-between p-3 rounded-md border border-white/10 bg-white/[0.02]">
                   <div>
                     <div className="text-sm font-medium text-white">Live .env Sync</div>
                     <div className="text-[10px] text-zinc-400">Synchronize deployment secrets.</div>
                   </div>
                   <div className="w-8 h-4 rounded-full bg-primary/20 flex items-center justify-end p-0.5"><div className="w-3 h-3 rounded-full bg-primary" /></div>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-md border border-rose-500/20 bg-rose-500/5">
                   <div>
                     <div className="text-sm font-medium text-rose-100">Panic Switch</div>
                     <div className="text-[10px] text-rose-100/60">Immediately quarantine all traffic.</div>
                   </div>
                   <button className="px-3 py-1 bg-rose-500 text-white text-[10px] font-medium rounded hover:bg-rose-600 transition-colors">ENGAGE</button>
                 </div>
                 <div className="p-3 text-[10px] font-mono text-zinc-300 bg-black/50 rounded border border-white/5">
                   &gt; docker-compose up -d<br/>
                   &gt; Initializing multi-tenant isolation...<br/>
                   &gt; System ready.
                 </div>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>
      <SectionTicker number="04" title="SCALABLE PRICING" commitMsg="movin vinusandha · [ops-304] provision open-source multi-tenant clusters" />
{/* ── Pricing / Free & Open (Bento Redesign) ─────────── */}
      <motion.section
        id="pricing"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="bg-background relative overflow-hidden border-b border-border"
      >
        <div className="max-w-7xl mx-auto border-x border-border">
          {/* Header Row */}
          <motion.div variants={fadeUpVariant} className="py-8 md:py-12 px-6 text-center relative">
            <h2 className="text-xl sm:text-3xl font-semibold text-foreground mb-3 tracking-tighter">
              Free and Open
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl mx-auto">
              Trim is free to use with no limits. Self-host it yourself or use our hosted version.
            </p>
            <QuarterCircle className="absolute top-0 right-0 w-12 h-12 text-border opacity-40 pointer-events-none" flip />
          </motion.div>

          {/* Pricing Grid - Box within a Box */}
          <div className="border-y border-border w-full bg-zinc-50/50 dark:bg-zinc-900/10">
            <motion.div variants={staggerContainer} className="max-w-4xl mx-auto border-x border-border grid grid-cols-1 md:grid-cols-2 bg-background relative shadow-[0_0_40px_rgba(0,0,0,0.02)] dark:shadow-none">
              
              {/* Anonymous User Column */}
              <motion.div variants={cardVariant} className="border-b md:border-b-0 md:border-r border-border p-5 md:p-8 flex flex-col justify-between group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors relative">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-md border border-border bg-background text-foreground flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <Zap className="w-3 h-3" />
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Anonymous</p>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tighter">Free</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6 max-w-xs">
                    Perfect for quick, one-off links without an account. No strings attached.
                  </p>
                  <ul className="flex flex-col gap-2.5 mb-8">
                    {['Instant short links', '24-hour link expiration', 'Basic QR Code generation'].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleTryItNow}
                  className="w-full text-center px-4 py-2 rounded-md font-medium text-xs border border-border bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Try it now
                </motion.button>
              </motion.div>

              {/* Registered User Column */}
              <motion.div variants={cardVariant} className="p-5 md:p-8 flex flex-col justify-between group relative overflow-hidden bg-zinc-50/30 dark:bg-zinc-900/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Shield className="w-3 h-3" />
                      </div>
                      <p className="text-[10px] font-mono text-primary uppercase tracking-widest">Registered</p>
                    </div>
                    <span className="px-2 py-0.5 border border-primary/20 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest rounded-full">
                      Recommended
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <p className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tighter">Free</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-6 max-w-xs">
                    Everything you need for advanced link management and analytics.
                  </p>
                  <ul className="flex flex-col gap-2.5 mb-8">
                    {['Password protection & Custom Tags', 'Deep Analytics & Tracking', 'Permanent, non-expiring links'].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                        <Check className="w-3 h-3 text-primary flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to={token ? '/dashboard' : '/register'}
                    className="w-full text-center px-4 py-2 rounded-md font-medium text-xs bg-foreground text-background hover:bg-foreground/90 transition-colors shadow-md block"
                  >
                    {token ? 'Go to Dashboard' : 'Create free account'}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Footer Row */}
          <motion.div variants={fadeUpVariant} className="py-6 text-center relative overflow-hidden">
            <p className="text-xs text-muted-foreground relative z-10">
              Want to self-host this application? Check out the{' '}
              <a
                href="https://github.com/MovinVinusandha/URL-Shortener"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline hover:no-underline inline-flex items-center gap-1"
              >
                <GithubIcon className="w-3.5 h-3.5" /> GitHub
              </a>{' '}
              repository.
            </p>
            <QuarterCircle className="absolute bottom-0 left-0 w-16 h-16 text-border opacity-40 pointer-events-none" />
          </motion.div>
        </div>
      </motion.section>



            <SectionTicker number="05" title="LOVED BY MODERN TEAMS" commitMsg="movin vinusandha · [ops-220] scale infrastructure to handle bfcm holiday traffic" />

            {/* ── Testimonials (Infinite Marquee) ─────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="bg-background relative overflow-hidden border-b border-border"
      >
        <div className="max-w-7xl mx-auto border-x border-border flex flex-col relative">
          
          <motion.div variants={fadeUpVariant} className="px-6 py-20 text-center border-b border-border bg-background relative z-20">
             <h2 className="text-3xl md:text-4xl font-medium text-foreground tracking-tighter">
               See what thousands of developers have to say
             </h2>
          </motion.div>
          
          <motion.div variants={fadeUpVariant} className="relative z-10 bg-background">
            
          <div className="flex overflow-hidden group w-full bg-background border-b border-border">
            <div className="flex w-max motion-safe:animate-infinite-scroll-x group-hover:[animation-play-state:paused]  ">
              {[...testimonialsRow1, ...testimonialsRow1].map((item, idx) => (
                 <div key={idx} className="marquee-card p-10 lg:p-12 border-r border-border flex-shrink-0 bg-card hover:bg-primary/[0.01] transition-colors flex flex-col justify-between min-h-[250px]">
                    <p className="text-[15px] md:text-[17px] text-foreground font-medium mb-8 leading-relaxed tracking-tighter">“{highlightTrim(item.quote)}”</p>
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
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
                    <p className="text-[15px] md:text-[17px] text-foreground font-medium mb-8 leading-relaxed tracking-tighter">“{highlightTrim(item.quote)}”</p>
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">@{item.handle}</div>
                    </div>
                 </div>
              ))}
            </div>
          </div>
          </motion.div>

          {/* Subtler Fade masks so it matches Laravel Cloud */}
          <div className="absolute left-0 top-[220px] bottom-0 w-12 sm:w-24 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
          <div className="absolute right-0 top-[220px] bottom-0 w-12 sm:w-24 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
        </div>
      </motion.section>

      {/* ── FAQ Section (CSS Grid Accordion) ─────────────── */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={staggerContainer}
        className="bg-background relative overflow-hidden border-b border-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-24 border-x border-border">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <motion.div variants={fadeUpVariant} className="col-span-1 md:col-span-4">
              <h2 className="text-2xl sm:text-3xl font-medium text-foreground tracking-tighter mb-3">
                Frequently asked questions
              </h2>
              <p className="text-sm text-muted-foreground">
                Everything you need to know about Trim's architecture, security, and global edge network.
              </p>
            </motion.div>
            
            <motion.div variants={fadeUpVariant} className="col-span-1 md:col-span-8 border-t border-border">
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
            </motion.div>
          </div>
        </div>
      </motion.section>
      {/* ── Final CTA Banner & Footer (With Crisp Dot Matrix) ─── */}
      <motion.footer
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={staggerContainer}
        className="relative w-full flex flex-col items-center overflow-hidden border-t border-border bg-background"
      >
        
        {/* CTA Block (Full Width Wrapper) */}
        <div className="relative w-full flex flex-col items-center justify-center pt-24 pb-0 border-b border-border overflow-hidden bg-background">
          {/* Crisp Visible Dot Matrix in End Section */}
          <DotMatrix fadeMask={false} className="opacity-70" />

          {/* Ambient Subtle Glow */}
          <div className="pointer-events-none absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[140px]" />

          {/* The CTA Block */}
          <motion.div variants={staggerContainer} className="flex flex-col items-center gap-5 z-10 relative px-6 text-center mb-16">
            <motion.h2 variants={fadeUpVariant} className="text-3xl sm:text-5xl font-medium tracking-tighter text-foreground">
              Ready to manage your links?
            </motion.h2>
            <motion.p variants={fadeUpVariant} className="text-xs sm:text-sm text-muted-foreground max-w-md">
              Join thousands of teams and developers who organize, secure, and track their links with Trim.
            </motion.p>
            <motion.div variants={fadeUpVariant} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to={token ? '/dashboard' : '/register'}
                className="group btn-solid px-8 py-3 text-xs font-medium shadow-lg mt-2 inline-flex items-center gap-2"
              >
                <span>{token ? 'Go to Dashboard' : 'Get Started'}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover:translate-x-1" />
              </Link>
            </motion.div>
          </motion.div>

          {/* The Massive Logo Watermark */}
          <motion.div variants={fadeUpVariant} className="w-full max-w-[1600px] mx-auto flex justify-center items-end mt-auto px-4 translate-y-12 relative z-0">
            <svg
            className="w-full h-auto text-foreground/[0.04]"
            viewBox="0 0 401 163"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M328.345 111.11C328.345 127.896 328.345 144.683 328.345 162.147C318.908 162.147 310.274 162.297 301.663 161.924C300.762 161.885 299.291 158.753 299.275 157.045C299.104 138.88 299.176 120.713 299.174 102.547C299.174 99.5468 299.218 96.5441 299.104 93.5479C298.615 80.7008 289.696 71.9234 277.122 71.8509C263.981 71.7751 254.853 80.1826 254.664 93.4346C254.364 114.43 254.433 135.434 254.688 156.431C254.745 161.11 253.423 162.519 248.812 162.24C242.503 161.859 236.151 162.123 229.819 162.202C227.318 162.233 225.696 161.759 225.704 158.683C225.796 122.023 225.814 85.3621 225.859 48.7017C225.859 48.547 225.975 48.3923 226.228 47.7606C235.072 47.7606 244.113 47.7606 253.905 47.7606C253.905 51.4324 253.905 54.9489 253.905 59.9863C263.847 49.5939 274.55 44.8348 287.55 46.0026C300.452 47.1616 310.357 53.6038 319.005 64.3878C320.5 62.4327 321.535 60.6903 322.932 59.3142C336.447 45.9941 352.562 42.0535 370.273 48.2864C387.948 54.5067 398.633 67.4285 400.104 86.4668C401 98.0677 400.504 109.778 400.585 121.439C400.668 133.272 400.519 145.11 400.833 156.936C400.947 161.222 399.51 162.424 395.388 162.207C389.238 161.882 383.052 161.939 376.896 162.195C372.968 162.358 371.695 160.995 371.719 157.04C371.845 136.041 371.882 115.039 371.641 94.0418C371.457 78.0197 358.407 68.4815 343.456 73.0716C334.17 75.9224 328.616 84.5644 328.114 97.7326C328.187 100.398 328.252 102.286 328.318 104.173C328.244 104.543 328.171 104.912 328.116 105.981C328.205 108.157 328.275 109.633 328.345 111.11Z"
              fill="currentColor"
            />
            <path
              d="M48.879 74.9511C48.8902 89.7421 48.3855 104.558 49.1055 119.315C49.5385 128.187 57.7459 134.886 67.1143 135.94C68.9297 136.144 70.7721 136.166 72.6024 136.172C80.6426 136.2 80.632 136.187 80.5528 144.496C80.51 148.993 80.458 153.491 80.5128 157.987C80.5438 160.534 79.8336 162.299 76.899 162.114C69.2777 161.633 61.4474 162.061 54.0807 160.42C35.183 156.209 22.1952 141.002 20.9314 121.455C20.0195 107.351 20.2809 93.1568 20.4313 79.0073C20.4793 74.4932 18.9645 73.0611 14.7137 73.4061C11.2347 73.6883 7.72155 73.5216 4.22646 73.6403C1.41329 73.7358 -0.0941571 72.8692 0.00533092 69.6519C0.190511 63.6618 0.148855 57.6591 0.0033778 51.6664C-0.0750532 48.4356 1.20687 47.107 4.42412 47.2904C8.0801 47.4988 11.7656 47.3071 15.4058 47.6421C19.2781 47.9985 20.777 46.7687 20.619 42.6633C20.3118 34.6796 20.6207 26.674 20.4258 18.6835C20.3441 15.3328 21.2371 13.8883 24.8815 14.0287C31.3673 14.2785 37.8735 14.1901 44.365 14.0151C47.4273 13.9325 48.471 15.0883 48.4139 18.0875C48.2556 26.413 48.4409 34.7462 48.2045 43.0682C48.1043 46.5994 49.3247 47.6773 52.8042 47.5989C61.9216 47.3934 71.0468 47.5296 80.7088 47.5296C80.7088 55.6997 80.8661 63.3126 80.5101 70.9014C80.4655 71.8508 77.7342 73.383 76.2057 73.4363C67.7216 73.7327 59.2244 73.6555 50.0073 73.8554C49.1483 74.3202 49.0136 74.6356 48.879 74.9511Z"
              fill="currentColor"
            />
            <path
              d="M137.689 79.6021C128.916 84.8812 124.94 92.4276 124.94 102.216C124.94 120.202 124.901 138.188 124.88 156.173C124.877 157.965 124.879 159.757 124.879 162.097C115.727 162.097 107.106 162.216 98.4998 161.92C97.6051 161.889 96.1065 159.418 96.0611 158.041C95.8201 150.721 95.951 143.389 95.9578 136.062C95.983 108.584 96.0102 81.106 96.0363 53.6281C96.038 51.8191 96.0364 50.0102 96.0364 47.8176C105.683 47.8176 114.92 47.8176 124.639 47.8176C124.639 52.7687 124.639 57.6507 124.639 62.4684C130.878 58.2289 136.381 53.2137 142.846 50.4592C149.184 47.7587 156.503 47.3586 164.287 45.7655C164.287 55.5351 164.291 63.6672 164.286 71.7992C164.283 75.0721 161.924 74.8698 159.72 74.8554C152.152 74.8058 144.748 75.5287 137.689 79.6021Z"
              fill="currentColor"
            />
            <path
              d="M179.437 143.971C179.508 139.596 179.579 135.221 179.633 130.028C179.55 128.463 179.483 127.717 179.417 126.971C179.495 123.261 179.573 119.551 179.642 114.932C179.562 106.596 179.492 99.168 179.422 91.7404C179.501 78.7772 179.771 65.8108 179.555 52.8525C179.481 48.4051 180.826 47.0583 185.21 47.254C192.645 47.5861 200.106 47.3453 208.293 47.3453C208.293 50.046 208.292 52.1473 208.293 54.2487C208.311 88.3429 208.257 122.438 208.437 156.531C208.459 160.811 207.459 162.516 202.915 162.248C196.616 161.877 190.278 162.028 183.962 162.183C180.71 162.262 179.443 161.011 179.609 157.792C179.779 154.474 179.653 151.141 179.642 147.012C179.565 145.463 179.501 144.717 179.437 143.971Z"
              fill="currentColor"
            />
            <path
              d="M177.056 14.3804C179.822 4.32414 186.227 -0.636336 195.06 0.0653536C203.38 0.726334 210.029 6.9702 210.829 14.8745C211.812 24.5753 204.476 32.9143 194.687 33.2246C184.215 33.5564 176.876 25.9083 177.056 14.3804Z"
              fill="currentColor"
            />
          </svg>
          </motion.div>
        </div>

        {/* Structured Multi-Column Navigation Grid */}
        <motion.div variants={fadeUpVariant} className="w-full max-w-7xl mx-auto relative z-10 bg-background">
          <div className="grid grid-cols-2 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-border">
            
            {/* Brand / Logo Column */}
            <div className="col-span-2 lg:col-span-2 p-8 md:p-12 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center mb-6">
                  <BrandLogo className="h-8 w-auto text-foreground" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  The brutalist, open-source link management platform for modern developers and enterprise teams.
                </p>
              </div>
              <div className="mt-12 flex items-center gap-4">
                <a href="https://github.com/MovinVinusandha/URL-Shortener" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <GithubIcon className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Globe2 className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Product Column */}
            <div className="col-span-1 p-8 md:p-12 flex flex-col gap-4">
              <h4 className="text-foreground font-mono text-xs uppercase tracking-widest mb-4">Product</h4>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-primary text-sm transition-colors">Pricing</a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Changelog</a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Documentation</a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">API Reference</a>
            </div>

            {/* Resources Column */}
            <div className="col-span-1 p-8 md:p-12 flex flex-col gap-4">
              <h4 className="text-foreground font-mono text-xs uppercase tracking-widest mb-4">Resources</h4>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Community</a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Blog</a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Open Source</a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Brand Assets</a>
            </div>

            {/* Company Column */}
            <div className="col-span-1 p-8 md:p-12 flex flex-col gap-4">
              <h4 className="text-foreground font-mono text-xs uppercase tracking-widest mb-4">Company</h4>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">About Us</a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Careers</a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">Terms of Service</a>
            </div>

          </div>
        </motion.div>
          
        {/* Bottom Copyright Bar - Expanded to full width */}
        <motion.div variants={fadeUpVariant} className="w-full border-t border-border bg-background relative z-10">
          <div className="max-w-7xl mx-auto p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
             <p className="text-xs text-muted-foreground">
               &copy; {new Date().getFullYear()} Trim. All rights reserved.
             </p>
             <p className="text-xs text-muted-foreground flex items-center gap-1">
               Designed in <Zap className="w-3 h-3 text-red-500 mx-0.5" /> Open Source
             </p>
          </div>
        </motion.div>
      </motion.footer>
    </div>
  );
};

export default HomePage;
