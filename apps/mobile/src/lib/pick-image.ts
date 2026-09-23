import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export async function pickLibraryImage(quality = 0.75) {
  if (Platform.OS === "ios") {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    quality,
    mediaTypes: ["images"],
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0];
}

export async function pickCameraImage(quality = 0.75) {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ quality, mediaTypes: ["images"] });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0];
}
