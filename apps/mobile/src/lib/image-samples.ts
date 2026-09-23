import {
  PhotoValidationError,
  assertValidPhoto,
  statsFromRgbaGrid,
  stubSamplesFromAverageRgb,
  srgbToLab,
} from "@photomatcher/color-engine";
import type { LabColor } from "@photomatcher/types";
import * as ImageManipulator from "expo-image-manipulator";
import jpeg from "jpeg-js";

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Sample colors from a local image URI — works in Expo Go (no native module). */
export async function samplesFromImageUri(uri: string): Promise<LabColor[]> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 64, height: 64 } }],
    { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!manipulated.base64) {
    throw new PhotoValidationError("no_pixels", "We couldn't read that image. Try another photo.");
  }

  const decoded = jpeg.decode(base64ToBytes(manipulated.base64), { useTArray: true });
  const pixels =
    decoded.data instanceof Uint8Array
      ? decoded.data
      : Uint8Array.from(decoded.data as ArrayLike<number>);
  const stats = statsFromRgbaGrid(pixels, decoded.width, decoded.height);
  assertValidPhoto(stats);

  const { r, g, b } = stats.centerRgb;
  const samples = stubSamplesFromAverageRgb(r, g, b);
  samples.push(srgbToLab(r, g, b));
  return samples;
}

export { PhotoValidationError };
