export const MAX_INLINE_VIDEO_UPLOAD_BYTES = 45 * 1024 * 1024;
export const MAX_VIDEO_DURATION_SECONDS = 180;
export const ACCEPTED_VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v'] as const;
export const ACCEPTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v'] as const;

export function formatBytes(bytes:number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatDurationLabel(seconds:number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const rounded = Math.round(seconds);
  const minutes = Math.floor(rounded / 60);
  const remaining = rounded % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

export function getFileExtension(filename:string): string {
  const match = filename.toLowerCase().match(/\.[^.]+$/);
  return match?.[0] || '';
}

export function inferOrientation(width:number, height:number): 'vertical' | 'horizontal' | 'square' | 'unknown' {
  if (!width || !height) return 'unknown';
  if (width === height) return 'square';
  return width > height ? 'horizontal' : 'vertical';
}
