import type { TryOnFeature, TryOnLook } from "@photomatcher/types";
import { colorizePortraitRgba } from "@photomatcher/color-engine";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import jpeg from "jpeg-js";

export type TryOnEnabled = Record<TryOnFeature, boolean>;

export const DEFAULT_TRYON_ENABLED: TryOnEnabled = {
  hair: true,
  eyes: true,
  lips: true,
  cheeks: true,
  jewelry: false,
  dress: false,
};

export type PortraitPixels = {
  original: Uint8Array;
  width: number;
  height: number;
};

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array | ArrayBuffer | ArrayLike<number>) {
  const view =
    bytes instanceof ArrayBuffer
      ? new Uint8Array(bytes)
      : bytes instanceof Uint8Array
        ? bytes
        : Uint8Array.from(bytes as ArrayLike<number>);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < view.length; i += chunk) {
    binary += String.fromCharCode(...view.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function asUint8(data: Uint8Array | ArrayBuffer | ArrayLike<number>) {
  if (data instanceof Uint8Array) return data;
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return Uint8Array.from(data as ArrayLike<number>);
}

export async function loadPortraitPixels(uri: string): Promise<PortraitPixels> {
  const manipulated = await ImageManipulator.manipulateAsync(uri.split("?")[0], [{ resize: { width: 720 } }], {
    compress: 0.92,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });
  if (!manipulated.base64) throw new Error("Could not read that photo");
  const decoded = jpeg.decode(base64ToBytes(manipulated.base64), { useTArray: true });
  return {
    original: asUint8(decoded.data),
    width: decoded.width,
    height: decoded.height,
  };
}

export async function renderPortraitLook(
  portrait: PortraitPixels,
  look: TryOnLook,
  enabled: TryOnEnabled,
  stamp: number,
) {
  const out = colorizePortraitRgba(portrait.original, portrait.width, portrait.height, look, enabled);
  const encoded = jpeg.encode({ data: out, width: portrait.width, height: portrait.height }, 90);
  const dest = `${FileSystem.cacheDirectory}everyhue-tryon-${stamp}.jpg`;
  await FileSystem.writeAsStringAsync(dest, bytesToBase64(asUint8(encoded.data)), {
    encoding: FileSystem.EncodingType.Base64,
  });
  return dest;
}
