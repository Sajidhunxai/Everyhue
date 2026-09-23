import * as FileSystem from "expo-file-system/legacy";

const FILE = `${FileSystem.documentDirectory}everyhue-last-portrait.jpg`;

export async function saveLastPhoto(uri: string): Promise<void> {
  const info = await FileSystem.getInfoAsync(FILE);
  if (info.exists) await FileSystem.deleteAsync(FILE, { idempotent: true });
  await FileSystem.copyAsync({ from: uri, to: FILE });
}

export async function loadLastPhoto(): Promise<string | null> {
  const info = await FileSystem.getInfoAsync(FILE);
  return info.exists ? FILE : null;
}
