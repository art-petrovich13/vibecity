import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

interface LogoProps {
  className?: string;
}

export const Logo = ({ className }: LogoProps) => (
  <Link to="/" className={cn('group inline-flex items-center gap-2.5', className)} aria-label="VibeCity — на главную">
    <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-vibe-gradient shadow-glow transition-transform duration-300 group-hover:rotate-6">
      <span className="font-display text-base font-bold leading-none text-white">V</span>
      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-acid ring-2 ring-ink-950" />
    </span>
    <span className="font-display text-lg font-semibold tracking-tight text-white">
      Vibe<span className="gradient-text">City</span>
    </span>
  </Link>
);
