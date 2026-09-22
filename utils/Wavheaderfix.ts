// ─── WAV File Header Utilities ────────────────────────────────────────────────

import * as FileSystem from 'expo-file-system/legacy';

/**
 * Validates if a file has a proper WAV header
 */
export async function isValidWavFile(fileUri: string): Promise<boolean> {
  try {
    // Read first 4 bytes to check for RIFF header
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const binaryString = atob(base64Data.substring(0, 100));
    
    // Check for "RIFF" magic number
    if (binaryString[0] === 'R' && binaryString[1] === 'I' && 
        binaryString[2] === 'F' && binaryString[3] === 'F') {
      console.log('✅ Valid WAV header found');
      return true;
    } else {
      console.log('❌ Invalid WAV header:', binaryString.substring(0, 4));
      return false;
    }
  } catch (e) {
    console.log('Error validating WAV:', e);
    return false;
  }
}

/**
 * Fixes WAV files with missing or incorrect headers
 * Reads raw audio data and wraps it with proper WAV header
 */
export async function fixWavFile(inputUri: string, sampleRate: number = 16000): Promise<string> {
  try {
    console.log('🔧 Attempting to fix WAV file...');

    // Read the audio data
    const base64Data = await FileSystem.readAsStringAsync(inputUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const audioDataView = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      audioDataView[i] = binaryString.charCodeAt(i);
    }

    // Create proper WAV header
    const numChannels = 1;
    const bytesPerSample = 2; // 16-bit
    const dataLength = audioDataView.length;

    // Create WAV header (44 bytes)
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    // "RIFF" chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataLength, true); // File size - 8
    writeString(view, 8, 'WAVE');

    // "fmt " subchunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // ByteRate
    view.setUint16(32, numChannels * bytesPerSample, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample

    // "data" subchunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataLength, true); // Subchunk2Size

    // Combine header + audio data
    const headerArray = new Uint8Array(header);
    const wavFile = new Uint8Array(headerArray.length + audioDataView.length);
    wavFile.set(headerArray);
    wavFile.set(audioDataView, headerArray.length);

    // Convert back to base64
    let outputBinaryStr = '';
    for (let i = 0; i < wavFile.length; i++) {
      outputBinaryStr += String.fromCharCode(wavFile[i]);
    }

    const fixedBase64 = btoa(outputBinaryStr);

    // Save fixed WAV file
    const outputPath = inputUri.replace('.wav', '_fixed.wav');
    await FileSystem.writeAsStringAsync(outputPath, fixedBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('✅ WAV file fixed and saved at:', outputPath);
    return outputPath;

  } catch (error) {
    console.error('❌ Failed to fix WAV file:', error);
    // Return original if fix fails
    return inputUri;
  }
}

/**
 * Helper to write string to DataView (for WAV header)
 */
function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Get WAV file info for debugging
 */
export async function getWavFileInfo(fileUri: string): Promise<{
  fileSize: number;
  hasRiffHeader: boolean;
  sampleRate?: number;
  channels?: number;
}> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const binaryString = atob(base64Data.substring(0, 200));
    
    const hasRiffHeader = 
      binaryString[0] === 'R' && binaryString[1] === 'I' && 
      binaryString[2] === 'F' && binaryString[3] === 'F';

    let sampleRate = 0;
    let channels = 0;

    if (hasRiffHeader) {
      // Read sample rate (bytes 24-27)
      sampleRate = (
        binaryString.charCodeAt(24) |
        (binaryString.charCodeAt(25) << 8) |
        (binaryString.charCodeAt(26) << 16) |
        (binaryString.charCodeAt(27) << 24)
      );

      // Read channels (bytes 22-23)
      channels = (
        binaryString.charCodeAt(22) |
        (binaryString.charCodeAt(23) << 8)
      );
    }

    return {
      fileSize: fileInfo.size as number,
      hasRiffHeader,
      sampleRate: hasRiffHeader ? sampleRate : undefined,
      channels: hasRiffHeader ? channels : undefined,
    };

  } catch (error) {
    console.error('Error getting WAV info:', error);
    return {
      fileSize: 0,
      hasRiffHeader: false,
    };
  }
}