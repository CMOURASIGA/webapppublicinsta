import { MediaMetadata, MediaValidationIssue, MediaValidationStatus } from '../types';
import { ACCEPTED_VIDEO_EXTENSIONS, ACCEPTED_VIDEO_MIME_TYPES, MAX_INLINE_VIDEO_UPLOAD_BYTES, MAX_VIDEO_DURATION_SECONDS, getFileExtension } from './videoFormat';
import { readVideoMetadata } from './videoMetadata';

export interface VideoValidationResult {
  status: MediaValidationStatus;
  errors: MediaValidationIssue[];
  warnings: MediaValidationIssue[];
  metadata: MediaMetadata;
}

function createIssue(code:string, message:string): MediaValidationIssue {
  return { code, message };
}

export async function validateVideoFile(file: File): Promise<VideoValidationResult> {
  const errors: MediaValidationIssue[] = [];
  const warnings: MediaValidationIssue[] = [];

  const extension = getFileExtension(file.name);
  const metadata: MediaMetadata = {
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    source: 'browser',
  };

  if (!file.type.startsWith('video/')) {
    errors.push(createIssue('NOT_A_VIDEO', 'O arquivo selecionado nao e um video valido.'));
  }

  if (!ACCEPTED_VIDEO_MIME_TYPES.includes(file.type as (typeof ACCEPTED_VIDEO_MIME_TYPES)[number])) {
    errors.push(createIssue('VIDEO_MIME_UNSUPPORTED', 'Use um arquivo MP4, MOV ou M4V para este fluxo.'));
  }

  if (!ACCEPTED_VIDEO_EXTENSIONS.includes(extension as (typeof ACCEPTED_VIDEO_EXTENSIONS)[number])) {
    errors.push(createIssue('VIDEO_EXTENSION_UNSUPPORTED', 'A extensao do arquivo nao e suportada para este fluxo.'));
  }

  if (file.size > MAX_INLINE_VIDEO_UPLOAD_BYTES) {
    errors.push(createIssue('VIDEO_TOO_LARGE', `O arquivo excede o limite seguro de ${Math.round(MAX_INLINE_VIDEO_UPLOAD_BYTES / (1024 * 1024))} MB para o upload atual.`));
  } else if (file.size > MAX_INLINE_VIDEO_UPLOAD_BYTES * 0.8) {
    warnings.push(createIssue('VIDEO_SIZE_HIGH', 'O video esta perto do limite de upload. Considere compactar o arquivo.'));
  }

  try {
    const browserMetadata = await readVideoMetadata(file);
    Object.assign(metadata, browserMetadata);
  } catch {
    errors.push(createIssue('VIDEO_PREVIEW_FAILED', 'Nao foi possivel carregar o video no navegador para validacao.'));
  }

  if (!metadata.duration_seconds) {
    errors.push(createIssue('VIDEO_DURATION_MISSING', 'A duracao do video nao pode ser detectada.'));
  } else {
    if (metadata.duration_seconds > MAX_VIDEO_DURATION_SECONDS) {
      errors.push(createIssue('VIDEO_DURATION_EXCEEDED', `O video tem mais de ${MAX_VIDEO_DURATION_SECONDS / 60} minutos.`));
    } else if (metadata.duration_seconds > MAX_VIDEO_DURATION_SECONDS - 15) {
      warnings.push(createIssue('VIDEO_DURATION_NEAR_LIMIT', 'A duracao do video esta muito proxima do limite maximo.'));
    }
  }

  if (!metadata.width || !metadata.height) {
    errors.push(createIssue('VIDEO_DIMENSIONS_MISSING', 'Nao foi possivel identificar a largura e a altura do video.'));
  } else {
    if (metadata.orientation === 'horizontal') {
      warnings.push(createIssue('VIDEO_HORIZONTAL', 'O video esta horizontal. Para Reels, o recomendado e vertical 9:16.'));
    }

    if (metadata.orientation === 'vertical' && (metadata.width < 720 || metadata.height < 1280)) {
      warnings.push(createIssue('VIDEO_LOW_RESOLUTION', 'A resolucao do video esta abaixo do recomendado para conteudo vertical.'));
    }

    if (metadata.orientation === 'horizontal' && (metadata.width < 1280 || metadata.height < 720)) {
      warnings.push(createIssue('VIDEO_LOW_RESOLUTION', 'A resolucao do video esta abaixo do recomendado para conteudo horizontal.'));
    }
  }

  const status: MediaValidationStatus =
    errors.length > 0 ? 'INVALID' : warnings.length > 0 ? 'VALID_WITH_WARNINGS' : 'VALID';

  return { status, errors, warnings, metadata };
}
