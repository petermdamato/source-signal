"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const WHITE_LUMINANCE = 220;
const DARK_LUMINANCE = 40;
/** Invert when at least 90% of opaque pixels are white/light (transparent-background logos). */
const WHITE_PIXEL_RATIO = 0.9;
/** Add a dark plate when enough white to wash out, but color marks should stay true. */
const MIN_PLATE_WHITE_RATIO = 0.4;
const TRANSPARENT_ALPHA = 40;
/** Need meaningful transparency — not a flat opaque white (or JPEG) matte. */
const MIN_TRANSPARENT_RATIO = 0.08;
/** White wordmark baked onto a dark plate (monochrome only). */
const MIN_DARK_PLATE_RATIO = 0.5;
const MIN_WHITE_ON_DARK_RATIO = 0.05;
const MAX_CHROMATIC_RATIO = 0.05;

type LogoTreatment = "none" | "invert" | "dark-bg";

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isOpaqueLight(a: number, r: number, g: number, b: number): boolean {
  return a >= 200 && luminance(r, g, b) >= WHITE_LUMINANCE;
}

function isChromatic(r: number, g: number, b: number): boolean {
  if (Math.max(r, g, b) - Math.min(r, g, b) < 25) return false;
  const lum = luminance(r, g, b);
  return lum > DARK_LUMINANCE && lum < WHITE_LUMINANCE;
}

/**
 * Fallback when canvas is tainted (cross-origin). Matches vendor naming for
 * monochrome white wordmarks — not hyphenated color descriptors like ATTOM-Logo-White.png.
 */
function monochromeLightVariantUrlTreatment(src: string): LogoTreatment {
  const path = src.split("?")[0].split("#")[0].toLowerCase();

  if (/-dark\.(svg|png|webp|jpe?g)$/.test(path) || /[-_]dark[-_.]/.test(path)) return "none";
  if (/[-_]black[-_.]/.test(path) || /[-_]black\.(svg|png|webp|jpe?g)$/.test(path)) return "none";

  if (path.endsWith(".svg")) {
    if (/[-_]white\.svg$/.test(path) || /[-_]white[-_.]/.test(path) || /-light\.svg$/.test(path)) {
      return "invert";
    }
    // TF_logo_w.svg — white + color on transparency, no CORS
    if (/_w\.svg$/.test(path) || /[-_]logo_w\.svg$/.test(path)) {
      return "dark-bg";
    }
  }

  if (/\.(png|webp|jpe?g)$/.test(path)) {
    if (/_white[-_.]/.test(path) || /_white\.(png|webp|jpe?g)$/.test(path)) {
      return "invert";
    }
  }

  return "none";
}

/**
 * Classify transparent vs dark-plate logos for invert or dark background.
 * Returns treatment, or null if canvas is tainted (cross-origin).
 */
function analyzeImage(img: HTMLImageElement): LogoTreatment | null {
  try {
    const sample = 32;
    const canvas = document.createElement("canvas");
    canvas.width = sample;
    canvas.height = sample;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, sample, sample);
    const { data, width, height } = ctx.getImageData(0, 0, sample, sample);
    const totalPixels = width * height;

    let transparentPixels = 0;
    let whiteOpaquePixels = 0;
    let darkOpaquePixels = 0;
    let chromaticOpaquePixels = 0;
    let opaquePixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a < TRANSPARENT_ALPHA) {
        transparentPixels++;
        continue;
      }

      opaquePixels++;
      const lum = luminance(r, g, b);
      if (lum >= WHITE_LUMINANCE) whiteOpaquePixels++;
      else if (lum <= DARK_LUMINANCE) darkOpaquePixels++;
      else if (isChromatic(r, g, b)) chromaticOpaquePixels++;
    }

    if (opaquePixels === 0) return "none";

    const transparentRatio = transparentPixels / totalPixels;
    const whiteRatio = whiteOpaquePixels / opaquePixels;
    const darkRatio = darkOpaquePixels / opaquePixels;
    const chromaticRatio = chromaticOpaquePixels / opaquePixels;

    if (transparentRatio >= MIN_TRANSPARENT_RATIO) {
      const cornerCoords = [
        [0, 0],
        [width - 1, 0],
        [0, height - 1],
        [width - 1, height - 1],
      ] as const;
      let opaqueLightCorners = 0;
      for (const [x, y] of cornerCoords) {
        const i = (y * width + x) * 4;
        if (isOpaqueLight(data[i + 3], data[i], data[i + 1], data[i + 2])) {
          opaqueLightCorners++;
        }
      }
      if (opaqueLightCorners >= 3) {
        return "none";
      }

      if (whiteRatio >= WHITE_PIXEL_RATIO) {
        return chromaticRatio < MAX_CHROMATIC_RATIO ? "invert" : "dark-bg";
      }
      if (whiteRatio >= MIN_PLATE_WHITE_RATIO) {
        return "dark-bg";
      }
      return "none";
    }

    if (chromaticRatio >= MAX_CHROMATIC_RATIO) {
      return "none";
    }

    if (
      darkRatio >= MIN_DARK_PLATE_RATIO &&
      whiteRatio >= MIN_WHITE_ON_DARK_RATIO &&
      whiteRatio < WHITE_PIXEL_RATIO
    ) {
      return "invert";
    }

    return "none";
  } catch {
    return null;
  }
}

type LogoImageProps = {
  src: string;
  alt: string;
  className?: string;
};

/** Renders a logo with invert or dark plate when white marks would wash out on light UI. */
export function LogoImage({ src, alt, className = "" }: LogoImageProps) {
  const [treatment, setTreatment] = useState<LogoTreatment>("none");
  const pixelDecision = useRef<LogoTreatment | null>(null);

  const applyFromImage = useCallback(
    (img: HTMLImageElement) => {
      const analyzed = analyzeImage(img);
      if (analyzed === null) {
        const fallback = monochromeLightVariantUrlTreatment(src);
        if (fallback !== "none") {
          pixelDecision.current = fallback;
          setTreatment(fallback);
        }
        return;
      }
      pixelDecision.current = analyzed;
      setTreatment(analyzed);
    },
    [src]
  );

  useEffect(() => {
    pixelDecision.current = null;
    setTreatment("none");

    const probe = new window.Image();
    probe.crossOrigin = "anonymous";
    probe.onload = () => applyFromImage(probe);
    probe.onerror = () => {
      const fallback = monochromeLightVariantUrlTreatment(src);
      if (fallback !== "none") {
        pixelDecision.current = fallback;
        setTreatment(fallback);
      }
    };
    probe.src = src;
  }, [src, applyFromImage]);

  const handleLoad = useCallback(
    (event: React.SyntheticEvent<HTMLImageElement>) => {
      if (pixelDecision.current !== null) return;
      applyFromImage(event.currentTarget);
    },
    [applyFromImage]
  );

  const img = (
    <img
      src={src}
      alt={alt}
      onLoad={handleLoad}
      className={`h-full w-full object-contain ${treatment === "invert" ? "invert" : ""} ${className}`.trim()}
    />
  );

  if (treatment === "dark-bg") {
    return (
      <span className="flex h-full w-full items-center justify-center rounded-md bg-neutral-900 p-1">
        {img}
      </span>
    );
  }

  return img;
}
