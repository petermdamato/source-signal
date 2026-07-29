import { LogoImage } from "@/components/vendor/LogoImage";

const SIZES = {
  sm: { box: "h-8 w-8", text: "text-sm", rounded: "rounded" },
  base: { box: "h-12 w-12", text: "text-base", rounded: "rounded-lg" },
  md: { box: "h-14 w-14", text: "text-lg", rounded: "rounded-lg" },
  lg: { box: "h-24 w-24", text: "text-3xl", rounded: "rounded-xl" },
} as const;

type VendorLogoProps = {
  src: string | null | undefined;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
};

/** Company/vendor logo with transparent background (letter fallback keeps a tint). */
export function VendorLogo({ src, name, size = "md", className = "" }: VendorLogoProps) {
  const { box, text, rounded } = SIZES[size];

  if (src) {
    return (
      <div className={`${box} shrink-0 ${className}`}>
        <LogoImage src={src} alt={name ? `${name} logo` : ""} />
      </div>
    );
  }

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center ${rounded} bg-primary/10 font-bold text-primary ${text} ${className}`}
    >
      {name.charAt(0)}
    </div>
  );
}
