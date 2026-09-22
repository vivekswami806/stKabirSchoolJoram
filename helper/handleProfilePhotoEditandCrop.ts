import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

const MAX_SIZE_KB = 300;

export const handleEditPhoto = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,      // 👈 crop UI
    aspect: [1, 1],           // 👈 square
    quality: 1,               // keep max here, we compress later
  });

  if (result.canceled) return;

  let image = result.assets[0];

  // 🔧 Resize + compress
  let compressed = await ImageManipulator.manipulateAsync(
    image.uri,
    [{ resize: { width: 512, height: 512 } }],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    }
  );

  // 🔁 If still > 300 KB, compress more
  let sizeKB = (compressed.base64?.length || 0) * 0.75 / 1024;

  if (sizeKB > MAX_SIZE_KB) {
    compressed = await ImageManipulator.manipulateAsync(
      image.uri,
      [{ resize: { width: 512, height: 512 } }],
      {
        compress: 0.6,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );
  }

  console.log("Final size:", sizeKB.toFixed(2), "KB");

  // ✅ Ready to upload
  const base64Image = compressed.base64;

  // call your API here
};

export const compressImage = async (imageUri: string) => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: 800, // Resize width (maintains aspect ratio)
          },
        },
      ],
      {
        compress: 0.6, // 0 to 1 (lower = more compression)
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    return result.uri;
  } catch (error) {
    console.log("Compression Error:", error);
    return imageUri;
  }
};
