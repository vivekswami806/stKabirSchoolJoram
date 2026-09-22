export const getImageUri = (image?: string) => {
    if (!image) return undefined;
    const trimmed = image.trim();
    if (trimmed.startsWith("data:image")) {
      return trimmed;
    }
    return `data:image/jpeg;base64,${trimmed}`;
  };