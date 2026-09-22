export const getMimeTypeFromBase64 = (base64: string) => {
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64.startsWith('R0lGOD')) return 'image/gif';
    if (base64.startsWith('UklGR')) return 'image/webp';
    return 'image/jpeg'; // safe fallback
  };
  

  export const getBase64ImageUri = (base64?: string) => {
    if (!base64) return "";
  
    const cleaned = base64.replace(/\s/g, '');
    const mime = getMimeTypeFromBase64(cleaned);
  
    return `data:${mime};base64,${cleaned}`;
  };
  