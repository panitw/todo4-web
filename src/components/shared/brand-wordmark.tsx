import { cn } from "@/lib/utils";

interface BrandWordmarkProps {
  variant: "sidebar" | "mobile";
  className?: string;
}

const gradients = {
  sidebar: "linear-gradient(45deg, #ff6b95, #8b5cf6 50%, #22e5ff 100%)",
  mobile: "linear-gradient(45deg, #ff4d7d, #4a03a2 50%, #00d4ff 100%)",
} as const;

export function BrandWordmark({ variant, className }: BrandWordmarkProps) {
  return (
    <span
      className={cn("font-black tracking-tight select-none", className)}
      style={{
        letterSpacing: "-0.5px",
        backgroundImage: gradients[variant],
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
      }}
    >
      Todo4
    </span>
  );
}
