import { cn } from '@/lib/cn';

const variants = {
  ghost: 'border-white/10 bg-white/5 text-sky-50 hover:border-accent/50 hover:bg-accentSoft/60',
  subtle: 'border-white/10 bg-panel/80 text-sky-50 hover:border-sky-200/20 hover:bg-white/10',
  accent: 'border-accent/40 bg-accent text-slate hover:border-accent hover:bg-sky-300',
};

export function ActionButton({
  children,
  className,
  variant = 'ghost',
  size = 'md',
  ...props
}) {
  const sizes = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-3 text-sm',
  };

  return (
    <button
      type="button"
      className={cn(
        'rounded-xl border font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        variants[variant] || variants.ghost,
        sizes[size] || sizes.md,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
