import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, normalize } from 'path';

// Relativo al cwd del proceso (/app dentro del contenedor), montado como volumen de Docker
// para que sobreviva a los rebuilds — ver docker-compose.app.yml.
export const UPLOADS_ROOT = join(process.cwd(), 'uploads');

/** Decodifica un data URL en base64 (ej. "data:application/pdf;base64,JVBERi0...") a un Buffer. */
export function decodeBase64DataUrl(dataUrl: string): Buffer {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Buffer.from(base64, 'base64');
}

const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};
const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
};

/** Extrae el mime type de un data URL (ej. "data:image/png;base64,..." → "image/png"). */
export function mimeFromDataUrl(dataUrl: string): string {
  const match = /^data:([^;]+);base64,/.exec(dataUrl);
  return match ? match[1] : 'application/octet-stream';
}

/** Extensión de archivo para un mime type de imagen conocido; 'jpg' como default razonable. */
export function extensionFromMime(mime: string): string {
  return MIME_TO_EXTENSION[mime] ?? 'jpg';
}

/** Content-Type a partir de la extensión de un archivo guardado (para servirlo de vuelta). */
export function mimeFromExtension(relativePath: string): string {
  const ext = relativePath.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TO_MIME[ext] ?? 'application/octet-stream';
}

/** Guarda un archivo dentro de uploads/{subdir}/{filename} y devuelve la ruta relativa (la que se guarda en DB). */
export function saveUploadFile(subdir: string, filename: string, contents: Buffer): string {
  const dir = join(UPLOADS_ROOT, subdir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, filename), contents);
  return `${subdir}/${filename}`;
}

/** Resuelve una ruta relativa guardada en DB a la ruta absoluta real, sin permitir salirse de uploads/. */
export function resolveUploadPath(relativePath: string): string {
  const full = normalize(join(UPLOADS_ROOT, relativePath));
  if (!full.startsWith(UPLOADS_ROOT)) {
    throw new Error('Ruta de archivo inválida');
  }
  return full;
}

export function uploadFileExists(relativePath: string | null | undefined): boolean {
  if (!relativePath) return false;
  try {
    return existsSync(resolveUploadPath(relativePath));
  } catch {
    return false;
  }
}
