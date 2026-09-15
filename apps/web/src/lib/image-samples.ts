import {
  PhotoValidationError,
  assertValidPhoto,
  statsFromRgbaGrid,
  stubSamplesFromAverageRgb,
  srgbToLab,
} from "@photomatcher/color-engine";
import type { LabColor } from "@photomatcher/types";

export { PhotoValidationError };

export async function samplesFromImageFile(file: File): Promise<LabColor[]> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new PhotoValidationError("no_pixels", "Your browser couldn't process this image.");
  }

  ctx.drawImage(bitmap, 0, 0, size, size);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, size, size);
  const stats = statsFromRgbaGrid(imageData.data, size, size);
  assertValidPhoto(stats);

  const { r, g, b } = stats.centerRgb;
  const samples = stubSamplesFromAverageRgb(r, g, b);
  samples.push(srgbToLab(r, g, b));
  return samples;
}
