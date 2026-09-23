import jpeg from "jpeg-js";
import { colorizePortraitRgba } from "@photomatcher/color-engine";
import type { TryOnFeature, TryOnLook } from "@photomatcher/types";

type TryOnEnabled = Record<TryOnFeature, boolean>;

function downscale(pixels: Uint8Array, w: number, h: number, maxW: number) {
  if (w <= maxW) return { pixels, width: w, height: h };
  const width = maxW;
  const height = Math.max(1, Math.round((h * maxW) / w));
  const out = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const sy = Math.min(h - 1, Math.floor((y * h) / height));
    for (let x = 0; x < width; x++) {
      const sx = Math.min(w - 1, Math.floor((x * w) / width));
      const si = (sy * w + sx) * 4;
      const di = (y * width + x) * 4;
      out[di] = pixels[si];
      out[di + 1] = pixels[si + 1];
      out[di + 2] = pixels[si + 2];
      out[di + 3] = 255;
    }
  }
  return { pixels: out, width, height };
}

export function renderTryOnLocal(
  imageBytes: Uint8Array,
  mimeType: string,
  look: TryOnLook,
  enabled: TryOnEnabled,
): string | null {
  if (!/jpeg|jpg/i.test(mimeType) && imageBytes[0] !== 0xff) return null;
  let decoded: { data: Uint8Array; width: number; height: number };
  try {
    decoded = jpeg.decode(Buffer.from(imageBytes), { useTArray: true });
  } catch {
    return null;
  }
  const scaled = downscale(Uint8Array.from(decoded.data), decoded.width, decoded.height, 720);
  const out = colorizePortraitRgba(scaled.pixels, scaled.width, scaled.height, look, enabled);
  const encoded = jpeg.encode({ data: out, width: scaled.width, height: scaled.height }, 90);
  return `data:image/jpeg;base64,${Buffer.from(encoded.data).toString("base64")}`;
}
