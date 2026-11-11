import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { tokens } from './tokens';

/**
 * Utility for merging tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- BUTTON ---

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center font-semibold tracking-wide outline-none disabled:opacity-50 disabled:pointer-events-none',
    tokens.radius.full,
    tokens.transition
  ),
  {
    variants: {
      variant: {
        primary: cn(
          'bg-[#031120]/80 text-white border',
          tokens.colors.border.default,
          'shadow-[0_0_15px_rgba(56,189,248,0.4),inset_0_0_10px_rgba(56,189,248,0.2)]',
          'hover:bg-cyan-950/80 hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(56,189,248,0.7),inset_0_0_15px_rgba(56,189,248,0.4)] hover:scale-105 active:scale-95',
          'focus-visible:ring-2 focus-visible:ring-cyan-400/50'
        ),
        secondary: cn(
          tokens.colors.bg.panel,
          'text-zinc-300 border border-zinc-800 hover:bg-white/10 hover:text-white hover:border-zinc-700',
          'active:scale-95'
        ),
        outline: cn(
          'bg-transparent text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-400',
          'active:scale-95'
        ),
        ghost: cn(
          'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5'
        ),
      },
      size: {
        sm: 'px-4 py-2 text-xs',
        md: 'px-7 py-3.5 text-sm sm:text-base',
        lg: 'px-10 py-4 text-base sm:text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

// --- CARD ---

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          tokens.colors.bg.panel,
          tokens.colors.border.default,
          tokens.radius.lg,
          'backdrop-blur-xl border p-6 shadow-2xl shadow-black/50',
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// --- STAT BAR ---

export interface StatBarProps {
  label: string;
  value: number;
  max?: number;
  // accent color class like 'bg-cyan-500'
  color?: string;
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  value,
  max = 100,
  color = 'bg-cyan-500',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-[11px] font-mono uppercase tracking-wider text-zinc-500">
        <span>{label}</span>
        <span className="text-zinc-400">
          {value} / {max}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40 border border-white/5">
        <div
          className={cn('h-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(56,189,248,0.4)]', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
