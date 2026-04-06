import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "blue" | "cyan" | "violet";
  className?: string;
}

const colorMap = {
  default: "border-gray-200 bg-gray-50 text-text-secondary",
  blue: "border-accent-blue/20 bg-accent-blue/10 text-accent-blue",
  cyan: "border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan",
  violet: "border-accent-violet/20 bg-accent-violet/10 text-accent-violet",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
        colorMap[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
