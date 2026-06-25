import { MediaMetadata } from '../types';
import { inferOrientation } from './videoFormat';

export async function readVideoMetadata(file: File): Promise<MediaMetadata> {
  const url = URL.createObjectURL(file);

  try {
    const metadata = await new Promise<MediaMetadata>((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const width = video.videoWidth || 0;
        const height = video.videoHeight || 0;
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        resolve({
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          width,
          height,
          duration_seconds: duration,
          aspect_ratio: width && height ? width / height : undefined,
          orientation: inferOrientation(width, height),
          has_audio: true,
          source: 'browser',
        });
      };
      video.onerror = () => reject(new Error('Nao foi possivel ler os metadados do video.'));
      video.src = url;
    });

    return metadata;
  } finally {
    URL.revokeObjectURL(url);
  }
}
