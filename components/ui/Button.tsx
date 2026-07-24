import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
};

const variants = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary-dark border border-primary-dark shadow-sm",
  accent:
    "bg-primary-mid text-primary-foreground hover:brightness-[0.92] border border-primary-dark/30 shadow-sm",
  outline:
    "border border-primary/35 text-primary bg-transparent hover:bg-primary/[0.07]",
  ghost: "text-primary hover:bg-surface/40",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-base rounded-lg",
  lg: "px-6 py-3 text-lg rounded-lg",
};

export function buttonStyles(
  variant: keyof typeof variants = "primary",
  size: keyof typeof sizes = "md",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center font-medium transition-colors",
    variants[variant],
    sizes[size],
    className
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonStyles(variant, size),
        "disabled:opacity-50 disabled:pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
