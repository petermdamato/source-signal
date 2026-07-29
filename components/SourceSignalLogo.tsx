import Link from "next/link";

type SourceSignalLogoProps = {
  linked?: boolean;
  /** Sets type scale for wordmark and mark (e.g. text-xl, text-lg). */
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

const ICEBERG_PATHS = (
  <>
    <path d="M32 8 L21 23 L32 23 Z" fill="#b8bfc1" />
    <path d="M32 8 L32 23 L43 23 Z" fill="#6c8494" />
    <path d="M17 29 L32 29 L32 48 L13 46 Z" fill="#4a6575" />
    <path d="M13 46 L32 48 L32 68 L22 58 Z" fill="#3d5666" />
    <path d="M32 29 L47 29 L51 46 L32 48 Z" fill="#2c4c5c" />
    <path d="M32 48 L51 46 L42 58 L32 68 Z" fill="#1e3642" />
  </>
);

function SourceSignalLockup({
  className = "text-xl",
  markClassName,
  wordmarkClassName = "font-display font-bold tracking-tight text-primary",
  wordmarkHoverClassName = "",
}: {
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  wordmarkHoverClassName?: string;
}) {
  return (
    <span
      className={`inline-grid grid-cols-[auto_auto] items-center gap-x-2.5 [grid-template-rows:1.05em] ${className}`}
    >
      <svg
        viewBox="0 0 64 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        shapeRendering="geometricPrecision"
        className={markClassName ?? "block h-full w-auto shrink-0"}
        aria-hidden
      >
        {ICEBERG_PATHS}
      </svg>
      <div className="grid h-full place-items-center">
        <span
          className={`block leading-none [text-box-trim:trim-both] [text-box-edge:cap_alphabetic] ${wordmarkClassName} ${wordmarkHoverClassName}`.trim()}
        >
          Source Signal
        </span>
      </div>
    </span>
  );
}

/** Source Signal mark + wordmark. */
export function SourceSignalLogo({
  linked = false,
  className = "text-xl",
  markClassName,
  wordmarkClassName = "font-display font-bold tracking-tight text-primary",
}: SourceSignalLogoProps) {
  if (linked) {
    return (
      <Link href="/" className="group inline-flex items-center transition-colors hover:text-accent-burg">
        <SourceSignalLockup
          className={className}
          markClassName={markClassName}
          wordmarkClassName={wordmarkClassName}
          wordmarkHoverClassName="transition-colors group-hover:text-accent-burg"
        />
      </Link>
    );
  }

  return (
    <SourceSignalLockup
      className={className}
      markClassName={markClassName}
      wordmarkClassName={wordmarkClassName}
    />
  );
}
