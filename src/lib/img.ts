// img.ts — Cloudinary delivery helpers.
//
// Cards were loading full-resolution originals (often 1200px+) into 108–200px
// slots. On a mid-range Android that is the single biggest cause of janky
// scrolling and slow-feeling browsing — a large part of the "cheap" feel.
// Requesting a sized, auto-format, auto-quality derivative typically cuts
// payload by an order of magnitude.

/** Insert Cloudinary transforms into an upload URL. No-op for other hosts. */
export function cdnImage(
  url: string | undefined | null,
  opts: { width?: number; height?: number; blur?: boolean } = {}
): string {
  if (!url) return '';
  if (!url.includes('/upload/')) return url; // not a Cloudinary delivery URL

  const parts: string[] = ['f_auto', 'q_auto'];
  if (opts.width) parts.push(`w_${opts.width}`);
  if (opts.height) parts.push(`h_${opts.height}`, 'c_fill', 'g_auto');
  // Tiny, heavily-blurred placeholder for the blur-up effect.
  if (opts.blur) parts.push('e_blur:1000', 'q_10', 'w_24');

  return url.replace('/upload/', `/upload/${parts.join(',')}/`);
}

/** Card-sized thumbnail (2x for retina). */
export function cardThumb(url?: string | null, cssWidth = 200): string {
  return cdnImage(url, { width: cssWidth * 2 });
}

/** Low-quality image placeholder used behind the real image while it loads. */
export function lqip(url?: string | null): string {
  return cdnImage(url, { blur: true });
}
