// shareCard.ts — the images people actually post (M4 §6.2).
//
// Replaces the old export: a plain white side-by-side with sans "Before/After"
// labels and a translucent watermark line. That reads as a tool's output. These
// read as a lookbook page — which is the whole point, because people share what
// makes THEM look good, not what advertises the app.
//
// Rules, deliberately:
//  - No emoji, no "AI" badges, no robot language. In-app we stay honest that
//    results are AI previews; the exported image is the user's photo styled
//    like an editorial page.
//  - The editorial serif carries the name; everything else is quiet.
//  - Watermark is a small brass wordmark, and it is OPTIONAL for paid tiers.
//
// Canvas needs fonts to be loaded before first paint or it silently falls back
// to a default serif — hence ensureFonts().

const BRASS = '#B98A2F';
const SURFACE = '#FAF8F5';
const INK = '#1C1917';
const INK_2 = '#57534E';
const HAIRLINE = '#E7E2DC';

const DISPLAY = '"Fraunces Variable", Fraunces, Georgia, serif';
const UI = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export type ShareCardKind = 'clean' | 'editorial' | 'beforeAfter';

export interface ShareCardOptions {
  afterUrl: string;
  beforeUrl?: string;
  styleName?: string;
  /** Hide the wordmark (paid tiers). */
  hideWatermark?: boolean;
  handle?: string;
  /** 1080x1350 (feed) or 1080x1920 (story). */
  format?: 'feed' | 'story';
}

/** Canvas draws with the fallback font unless the face is actually loaded. */
async function ensureFonts(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await Promise.all([
      (document as any).fonts.load(`600 64px ${DISPLAY}`),
      (document as any).fonts.load(`500 28px ${UI}`),
      (document as any).fonts.ready,
    ]);
  } catch {
    /* non-fatal — falls back to Georgia */
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw `img` covering the box (object-fit: cover), centred. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function drawWordmark(ctx: CanvasRenderingContext2D, cx: number, y: number, handle: string) {
  ctx.textAlign = 'center';
  ctx.fillStyle = BRASS;
  ctx.font = `600 26px ${DISPLAY}`;
  ctx.fillText('Hair Studio', cx, y);
  ctx.fillStyle = INK_2;
  ctx.font = `500 22px ${UI}`;
  ctx.fillText(handle, cx, y + 30);
}

/**
 * Render a share card. Returns a PNG blob (PNG, not JPEG: the mat and hairlines
 * band badly under JPEG compression).
 */
export async function renderShareCard(
  kind: ShareCardKind,
  opts: ShareCardOptions
): Promise<Blob | null> {
  const { afterUrl, beforeUrl, styleName, hideWatermark, handle = '@ShadHairStudio' } = opts;
  if (!afterUrl) return null;

  await ensureFonts();

  const W = 1080;
  const H = opts.format === 'story' ? 1920 : 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = SURFACE;
  ctx.fillRect(0, 0, W, H);

  try {
    const after = await loadImage(afterUrl);

    if (kind === 'clean') {
      // The photo, edge to edge. Nothing competes with it.
      drawCover(ctx, after, 0, 0, W, H);
      if (!hideWatermark) {
        // Scrim so the mark stays legible on any photo.
        const g = ctx.createLinearGradient(0, H - 190, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = g;
        ctx.fillRect(0, H - 190, W, 190);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `600 30px ${DISPLAY}`;
        ctx.fillText('Hair Studio', W / 2, H - 76);
        ctx.fillStyle = 'rgba(255,255,255,0.72)';
        ctx.font = `500 24px ${UI}`;
        ctx.fillText(handle, W / 2, H - 40);
      }
    } else if (kind === 'editorial') {
      // Photo on a paper mat with a hairline frame and the name in serif —
      // a lookbook page, not a screenshot.
      const m = 72;
      const imgH = Math.round((H - m * 2) * 0.76);
      drawCover(ctx, after, m, m, W - m * 2, imgH);
      ctx.strokeStyle = HAIRLINE;
      ctx.lineWidth = 2;
      ctx.strokeRect(m, m, W - m * 2, imgH);

      const textY = m + imgH + 84;
      ctx.textAlign = 'center';
      if (styleName) {
        ctx.fillStyle = INK;
        ctx.font = `600 52px ${DISPLAY}`;
        // Single line, trimmed — long names must not wrap into the wordmark.
        let name = styleName;
        while (ctx.measureText(name).width > W - m * 2 && name.length > 8) {
          name = name.slice(0, -2);
        }
        ctx.fillText(name === styleName ? name : `${name}…`, W / 2, textY);
      }
      if (!hideWatermark) drawWordmark(ctx, W / 2, textY + 76, handle);
    } else {
      // Before / after — vertical split, brass hairline seam.
      const before = beforeUrl ? await loadImage(beforeUrl) : null;
      if (!before) {
        drawCover(ctx, after, 0, 0, W, H);
      } else {
        const footer = hideWatermark ? 0 : 150;
        const half = W / 2;
        const imgH = H - footer;
        drawCover(ctx, before, 0, 0, half, imgH);
        drawCover(ctx, after, half, 0, half, imgH);

        ctx.fillStyle = BRASS;
        ctx.fillRect(half - 2, 0, 4, imgH);

        // Quiet labels, lowercase — not shouty "BEFORE/AFTER" chips.
        ctx.font = `500 26px ${UI}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillText('before', half / 2, imgH - 36);
        ctx.fillText('after', half + half / 2, imgH - 36);

        if (!hideWatermark) {
          ctx.fillStyle = SURFACE;
          ctx.fillRect(0, imgH, W, footer);
          if (styleName) {
            ctx.fillStyle = INK;
            ctx.font = `600 40px ${DISPLAY}`;
            ctx.fillText(styleName.slice(0, 34), W / 2, imgH + 60);
          }
          drawWordmark(ctx, W / 2, imgH + (styleName ? 108 : 74), handle);
        }
      }
    }

    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/png')
    );
  } catch {
    return null;
  }
}
