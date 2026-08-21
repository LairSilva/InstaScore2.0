/**
 * InstaScore Image Security & Integrity Validator
 * 
 * Enforces strict multi-layer server-side validation on screenshot uploads:
 * 1. Payload size limits (per image and cumulative)
 * 2. Magic bytes verification (JPEG, PNG, WEBP)
 * 3. Exact binary dimension extraction & bounds checking (200px - 8000px)
 * 4. Zero-tolerance blocking of SVG, XML, HTML, and script payloads
 * 5. Detection and rejection of corrupted or truncated binary streams
 */

export interface ValidatedImage {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  data: string; // Clean raw base64 string
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
}

export interface ImageValidationResult {
  valid: boolean;
  image?: ValidatedImage;
  error?: string;
  message?: string;
}

export const IMAGE_SECURITY_CONFIG = {
  MAX_BYTES_PER_IMAGE: 5 * 1024 * 1024, // 5 MB decoded binary
  MAX_TOTAL_BYTES: 12 * 1024 * 1024,   // 12 MB cumulative for all screenshots
  MIN_WIDTH: 200,
  MIN_HEIGHT: 200,
  MAX_WIDTH: 8000,
  MAX_HEIGHT: 8000,
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp"] as const
};

/**
 * Extracts width and height from PNG binary buffer.
 */
function parsePngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  // IHDR chunk starts at byte 12. Bytes 16-19: Width (BE), Bytes 20-23: Height (BE)
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

/**
 * Extracts width and height from JPEG binary buffer.
 */
function parseJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4) return null;
  let offset = 2; // Skip SOI (0xFFD8)

  while (offset < buffer.length - 8) {
    if (buffer[offset] !== 0xFF) {
      offset++;
      continue;
    }

    const marker = buffer[offset + 1];
    // Start of Frame markers (Baseline, Extended, Progressive, etc.)
    if (
      (marker >= 0xC0 && marker <= 0xC3) ||
      (marker >= 0xC5 && marker <= 0xC7) ||
      (marker >= 0xC9 && marker <= 0xCB) ||
      (marker >= 0xCD && marker <= 0xCF)
    ) {
      // Marker layout: 0xFF, Marker, Length (2B), Precision (1B), Height (2B BE), Width (2B BE)
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    // Skip to next marker using length field
    const markerLength = buffer.readUInt16BE(offset + 2);
    offset += 2 + markerLength;
  }

  return null;
}

/**
 * Extracts width and height from WEBP binary buffer.
 */
function parseWebpDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 30) return null;

  const chunkType = buffer.toString("ascii", 12, 16);

  if (chunkType === "VP8 ") {
    // Lossy VP8: check sync code at offset 23 (0x9D 0x01 0x2A)
    if (buffer[23] === 0x9D && buffer[24] === 0x01 && buffer[25] === 0x2A) {
      const width = buffer.readUInt16LE(26) & 0x3FFF;
      const height = buffer.readUInt16LE(28) & 0x3FFF;
      return { width, height };
    }
  } else if (chunkType === "VP8L") {
    // Lossless VP8L: signature at offset 20 is 0x2F
    if (buffer[20] === 0x2F) {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      const width = 1 + (((b1 & 0x3F) << 8) | b0);
      const height = 1 + (((b3 & 0xF) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6));
      return { width, height };
    }
  } else if (chunkType === "VP8X") {
    // Extended VP8X: Canvas Width (3 bytes LE) at 24-26, Canvas Height (3 bytes LE) at 27-29
    const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
    const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
    return { width, height };
  }

  return null;
}

/**
 * Validates a single image string (Data URI or Base64).
 */
export function validateImageSecurity(
  input: string,
  imageLabel: string = "Imagem"
): ImageValidationResult {
  if (!input || typeof input !== "string" || !input.trim()) {
    return {
      valid: false,
      error: "IMAGE_PAYLOAD_MISSING",
      message: `${imageLabel} não foi fornecida.`
    };
  }

  // 1. Separate Data URI prefix if present
  let declaredMime: string | null = null;
  let rawBase64 = input.trim();

  const dataUriMatch = input.match(/^data:([a-zA-Z0-9-+/.]+);base64,(.+)$/s);
  if (dataUriMatch) {
    declaredMime = dataUriMatch[1].toLowerCase();
    rawBase64 = dataUriMatch[2].trim();
  }

  // 2. Decode Base64
  let buffer: Buffer;
  try {
    buffer = Buffer.from(rawBase64, "base64");
  } catch {
    return {
      valid: false,
      error: "IMAGE_BASE64_CORRUPT",
      message: `${imageLabel} possui codificação Base64 corrompida.`
    };
  }

  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      error: "IMAGE_EMPTY",
      message: `${imageLabel} está vazia ou ilegível.`
    };
  }

  // 3. Size Limits Check
  if (buffer.length > IMAGE_SECURITY_CONFIG.MAX_BYTES_PER_IMAGE) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: "IMAGE_SIZE_EXCEEDED",
      message: `${imageLabel} excede o limite máximo permitido de 5MB (tamanho: ${sizeMb}MB).`
    };
  }

  // 4. Reject SVG / XML / HTML / Script Injections in payload
  const headText = buffer.slice(0, Math.min(buffer.length, 1024)).toString("utf8").toLowerCase();
  const dangerousPatterns = [
    "<svg", "<?xml", "<!doctype svg", "<script", "<html", "<!doctype html",
    "onload=", "onerror=", "javascript:", "<embed", "<object", "xlink:href"
  ];
  for (const pattern of dangerousPatterns) {
    if (headText.includes(pattern)) {
      return {
        valid: false,
        error: "FORBIDDEN_FILE_TYPE",
        message: `${imageLabel} contém formato não suportado ou código incorporado (SVG/HTML não são permitidos). Envie uma captura JPEG, PNG ou WEBP.`
      };
    }
  }

  // 5. Magic Bytes Verification
  let detectedMime: "image/jpeg" | "image/png" | "image/webp" | null = null;
  let dimensions: { width: number; height: number } | null = null;

  // JPEG Check (0xFF 0xD8 0xFF)
  if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    detectedMime = "image/jpeg";
    dimensions = parseJpegDimensions(buffer);
  }
  // PNG Check (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
  else if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    detectedMime = "image/png";
    dimensions = parsePngDimensions(buffer);
  }
  // WEBP Check (RIFF ... WEBP)
  else if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    detectedMime = "image/webp";
    dimensions = parseWebpDimensions(buffer);
  }

  if (!detectedMime) {
    return {
      valid: false,
      error: "INVALID_MAGIC_BYTES",
      message: `${imageLabel} não é uma imagem válida nos formatos suportados (JPEG, PNG, WEBP).`
    };
  }

  // Verify declared MIME coherence if Data URI was used
  if (declaredMime && declaredMime !== detectedMime) {
    // Normalization check: image/jpg -> image/jpeg
    const normalizedDeclared = declaredMime === "image/jpg" ? "image/jpeg" : declaredMime;
    if (normalizedDeclared !== detectedMime) {
      return {
        valid: false,
        error: "MIME_MISMATCH",
        message: `${imageLabel} declara o tipo ${declaredMime}, mas seu conteúdo binário é ${detectedMime}.`
      };
    }
  }

  // 6. Dimensions and Bounds Verification
  if (!dimensions || dimensions.width <= 0 || dimensions.height <= 0) {
    return {
      valid: false,
      error: "IMAGE_DIMENSIONS_UNREADABLE",
      message: `Não foi possível ler as dimensões da ${imageLabel}. O arquivo pode estar corrompido ou truncado.`
    };
  }

  if (
    dimensions.width < IMAGE_SECURITY_CONFIG.MIN_WIDTH ||
    dimensions.height < IMAGE_SECURITY_CONFIG.MIN_HEIGHT
  ) {
    return {
      valid: false,
      error: "IMAGE_TOO_SMALL",
      message: `${imageLabel} possui resolução insuficiente (${dimensions.width}x${dimensions.height}px). O tamanho mínimo é ${IMAGE_SECURITY_CONFIG.MIN_WIDTH}x${IMAGE_SECURITY_CONFIG.MIN_HEIGHT}px.`
    };
  }

  if (
    dimensions.width > IMAGE_SECURITY_CONFIG.MAX_WIDTH ||
    dimensions.height > IMAGE_SECURITY_CONFIG.MAX_HEIGHT
  ) {
    return {
      valid: false,
      error: "IMAGE_TOO_LARGE",
      message: `${imageLabel} excede a resolução máxima permitida (${dimensions.width}x${dimensions.height}px). O limite é ${IMAGE_SECURITY_CONFIG.MAX_WIDTH}x${IMAGE_SECURITY_CONFIG.MAX_HEIGHT}px.`
    };
  }

  return {
    valid: true,
    image: {
      mimeType: detectedMime,
      data: rawBase64,
      buffer,
      width: dimensions.width,
      height: dimensions.height,
      sizeBytes: buffer.length
    }
  };
}

/**
 * Validates multiple screenshots collectively, ensuring individual and combined constraints.
 */
export function validateScreenshotBatch(images: { input: string; label: string }[]): {
  valid: boolean;
  validatedImages: ValidatedImage[];
  totalSizeBytes: number;
  error?: string;
  message?: string;
} {
  const validatedImages: ValidatedImage[] = [];
  let totalSizeBytes = 0;

  for (const item of images) {
    const res = validateImageSecurity(item.input, item.label);
    if (!res.valid || !res.image) {
      return {
        valid: false,
        validatedImages: [],
        totalSizeBytes: 0,
        error: res.error,
        message: res.message
      };
    }

    validatedImages.push(res.image);
    totalSizeBytes += res.image.sizeBytes;
  }

  if (totalSizeBytes > IMAGE_SECURITY_CONFIG.MAX_TOTAL_BYTES) {
    const totalMb = (totalSizeBytes / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      validatedImages: [],
      totalSizeBytes,
      error: "TOTAL_IMAGE_SIZE_EXCEEDED",
      message: `O tamanho total acumulado das imagens (${totalMb}MB) ultrapassa o limite de 12MB.`
    };
  }

  return {
    valid: true,
    validatedImages,
    totalSizeBytes
  };
}
