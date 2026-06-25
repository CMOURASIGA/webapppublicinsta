export async function captureVideoFrame(file: File, timeSeconds: number, filenameBase: string): Promise<File> {
  const url = URL.createObjectURL(file);

  try {
    return await new Promise<File>((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;

      const handleSeeked = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth || 1080;
          canvas.height = video.videoHeight || 1920;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Nao foi possivel preparar a capa do video.'));
            return;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error('Nao foi possivel gerar a capa do video.'));
              return;
            }
            resolve(new File([blob], `${filenameBase}-thumbnail.jpg`, { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.92);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Falha ao capturar frame do video.'));
        }
      };

      video.onloadedmetadata = () => {
        const target = Math.min(Math.max(0, timeSeconds), Number.isFinite(video.duration) ? video.duration : 0);
        video.currentTime = target;
      };
      video.onseeked = handleSeeked;
      video.onerror = () => reject(new Error('Nao foi possivel carregar o video para gerar thumbnail.'));
      video.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
