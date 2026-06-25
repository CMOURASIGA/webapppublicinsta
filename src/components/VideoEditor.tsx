import React, { useMemo, useRef, useState } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Loader2, Scissors, Video } from 'lucide-react';
import { VideoValidationResult } from '../lib/videoValidator';
import { captureVideoFrame } from '../lib/videoThumbnail';
import { formatDurationLabel } from '../lib/videoFormat';

export interface VideoEditorOutput {
  finalFile: File;
  thumbnailFile?: File;
  trimStartSec: number;
  trimEndSec: number;
  thumbnailTimeSec?: number;
  originalDurationSec: number;
  finalDurationSec: number;
  editMetadata: {
    edited: boolean;
    tool: 'ffmpeg.wasm';
    created_in_browser: boolean;
    original_filename: string;
    final_filename: string;
  };
}

interface VideoEditorProps {
  file: File;
  validation: VideoValidationResult;
  onPrepared: (output: VideoEditorOutput) => Promise<void> | void;
  onCancel: () => void;
}

export default function VideoEditor({ file, validation, onPrepared, onCancel }: VideoEditorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [trimStartSec, setTrimStartSec] = useState(0);
  const [trimEndSec, setTrimEndSec] = useState(validation.metadata.duration_seconds || 0);
  const [thumbnailTimeSec, setThumbnailTimeSec] = useState(Math.min(1, validation.metadata.duration_seconds || 0));
  const [processing, setProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [error, setError] = useState('');
  const [previewTime, setPreviewTime] = useState(0);

  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const duration = validation.metadata.duration_seconds || 0;

  const loadFFmpeg = async () => {
    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }

    if (!ffmpegRef.current.loaded) {
      await ffmpegRef.current.load();
    }

    return ffmpegRef.current;
  };

  const handleGenerate = async () => {
    setProcessing(true);
    setError('');

    try {
      const finalDurationSec = Math.max(0, trimEndSec - trimStartSec);
      const needsTrim = trimStartSec > 0.01 || trimEndSec < duration - 0.01;
      let finalFile = file;

      if (needsTrim) {
        setProcessingMessage('Preparando video no navegador...');
        const ffmpeg = await loadFFmpeg();
        const inputExtension = file.name.toLowerCase().endsWith('.mov') ? 'mov' : file.name.toLowerCase().endsWith('.m4v') ? 'm4v' : 'mp4';
        const inputName = `input.${inputExtension}`;
        const outputName = 'output.mp4';
        await ffmpeg.writeFile(inputName, await fetchFile(file));
        const exitCode = await ffmpeg.exec([
          '-i', inputName,
          '-ss', trimStartSec.toFixed(2),
          '-to', trimEndSec.toFixed(2),
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-c:a', 'aac',
          '-movflags', 'faststart',
          outputName,
        ]);
        if (exitCode !== 0) {
          throw new Error('Nao foi possivel gerar o video final no navegador.');
        }
        const output = await ffmpeg.readFile(outputName);
        finalFile = new File([output], `${file.name.replace(/\.[^.]+$/, '')}-final.mp4`, { type: 'video/mp4' });
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      }

      setProcessingMessage('Gerando capa do video...');
      const thumbnailFile = await captureVideoFrame(finalFile, Math.max(0, Math.min(thumbnailTimeSec - trimStartSec, finalDurationSec || duration)), file.name.replace(/\.[^.]+$/, ''));

      await onPrepared({
        finalFile,
        thumbnailFile,
        trimStartSec,
        trimEndSec,
        thumbnailTimeSec,
        originalDurationSec: duration,
        finalDurationSec: needsTrim ? finalDurationSec : duration,
        editMetadata: {
          edited: needsTrim,
          tool: 'ffmpeg.wasm',
          created_in_browser: true,
          original_filename: file.name,
          final_filename: finalFile.name,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao preparar o video.');
    } finally {
      setProcessing(false);
      setProcessingMessage('');
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <div className="rounded-lg bg-slate-900 p-2 text-white">
          <Video className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800">Preparador de Video para Instagram</h4>
          <p className="text-[11px] text-slate-500">Defina o corte inicial/final e escolha a capa antes do upload.</p>
        </div>
      </div>

      <video
        ref={videoRef}
        src={objectUrl}
        className="aspect-video w-full rounded-xl border border-slate-200 bg-slate-950 object-contain"
        controls
        onTimeUpdate={() => setPreviewTime(videoRef.current?.currentTime || 0)}
      />

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="block text-[10px] uppercase tracking-wide text-slate-500">Duracao original</span>
          <strong className="text-sm text-slate-800">{formatDurationLabel(duration)}</strong>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="block text-[10px] uppercase tracking-wide text-slate-500">Frame atual</span>
          <strong className="text-sm text-slate-800">{formatDurationLabel(previewTime)}</strong>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <span className="block text-[10px] uppercase tracking-wide text-slate-500">Capa selecionada</span>
          <strong className="text-sm text-slate-800">{formatDurationLabel(thumbnailTimeSec)}</strong>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-xs font-semibold text-slate-700">
          Inicio do corte
          <input type="number" min={0} max={Math.max(0, trimEndSec - 1)} step="0.1" value={trimStartSec} onChange={(e) => setTrimStartSec(Math.max(0, Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Fim do corte
          <input type="number" min={trimStartSec + 1} max={duration} step="0.1" value={trimEndSec} onChange={(e) => setTrimEndSec(Math.min(duration, Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
        </label>
        <label className="text-xs font-semibold text-slate-700">
          Tempo da capa
          <input type="number" min={trimStartSec} max={trimEndSec} step="0.1" value={thumbnailTimeSec} onChange={(e) => setThumbnailTimeSec(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-200 p-2" />
        </label>
      </div>

      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}
      {processing && <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">{processingMessage || 'Processando video...'}</div>}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onCancel} disabled={processing} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
          Trocar arquivo
        </button>
        <button type="button" onClick={() => setThumbnailTimeSec(previewTime)} disabled={processing} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700">
          Usar frame atual como capa
        </button>
        <button type="button" onClick={() => void handleGenerate()} disabled={processing || trimEndSec <= trimStartSec} className="inline-flex items-center gap-2 rounded-lg bg-brand-secondary px-4 py-2 text-xs font-bold text-brand-darker disabled:opacity-50">
          {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scissors className="h-4 w-4" />}
          Gerar video final
        </button>
      </div>
    </div>
  );
}
