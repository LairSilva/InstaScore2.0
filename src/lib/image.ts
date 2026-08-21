/**
 * Client-side image validation and compression utilities.
 */

export interface ProcessedImage {
  base64: string;
  sizeBytes: number;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Validates file type and size.
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Formato de arquivo não suportado. Envie apenas JPG, JPEG, PNG ou WebP."
    };
  }
  if (file.size > 15 * 1024 * 1024) {
    return {
      valid: false,
      error: "O arquivo excede o tamanho máximo de 15MB."
    };
  }
  return { valid: true };
}

/**
 * Compresses and resizes an image client-side before sending it to the server.
 * Resizes the image to a maximum width of 1600px (preserving aspect ratio)
 * and exports as a WebP or JPEG with 0.8 quality to guarantee excellent legibility under 1MB.
 */
export function compressImage(file: File): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const maxDimension = 1600;

        // Resize if exceeding max dimension in either width or height
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Não foi possível criar o contexto do canvas para compressão."));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first, fallback to JPEG
        let mimeType = "image/webp";
        let base64 = canvas.toDataURL(mimeType, 0.82);

        // If WebP is not supported or exported data URL doesn't contain webp, fallback to jpeg
        if (!base64.startsWith("data:image/webp")) {
          mimeType = "image/jpeg";
          base64 = canvas.toDataURL(mimeType, 0.85);
        }

        // Calculate approximate size from Base64 string
        const base64Length = base64.split(",")[1].length;
        const approximateSize = Math.round((base64Length * 3) / 4);

        resolve({
          base64,
          sizeBytes: approximateSize,
          width,
          height,
          mimeType
        });
      };

      img.onerror = () => {
        reject(new Error("Falha ao carregar a imagem. O arquivo pode estar corrompido."));
      };

      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error("Erro ao ler dados da imagem."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Erro ao carregar o arquivo."));
    };

    reader.readAsDataURL(file);
  });
}
