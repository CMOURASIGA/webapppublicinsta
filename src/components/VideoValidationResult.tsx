import React from 'react';
import { AlertTriangle, CheckCircle2, Film, Info } from 'lucide-react';
import { VideoValidationResult } from '../lib/videoValidator';
import { formatBytes, formatDurationLabel } from '../lib/videoFormat';

interface VideoValidationResultProps {
  result: VideoValidationResult | null;
}

function statusStyles(status: VideoValidationResult['status']) {
  if (status === 'VALID') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'VALID_WITH_WARNINGS') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-rose-200 bg-rose-50 text-rose-800';
}

export default function VideoValidationResultPanel({ result }: VideoValidationResultProps) {
  if (!result) return null;

  const statusIcon =
    result.status === 'VALID' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> :
    result.status === 'VALID_WITH_WARNINGS' ? <Info className="h-4 w-4 text-amber-600" /> :
    <AlertTriangle className="h-4 w-4 text-rose-600" />;

  return (
    <div className={`rounded-xl border p-4 ${statusStyles(result.status)}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
            {statusIcon}
            <span>Validacao Tecnica do Video</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed">
            {result.status === 'VALID' && 'Video validado com sucesso. Voce pode seguir para o corte e definicao da capa.'}
            {result.status === 'VALID_WITH_WARNINGS' && 'O video pode seguir, mas encontramos pontos de atencao. Revise os avisos antes de continuar.'}
            {result.status === 'INVALID' && 'Este video nao pode seguir para aprovacao. Corrija os pontos indicados e envie o arquivo novamente.'}
          </p>
        </div>
        <Film className="h-5 w-5 shrink-0 opacity-70" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div className="rounded-lg border border-white/70 bg-white/70 px-3 py-2">
          <span className="block uppercase tracking-wide opacity-70">Arquivo</span>
          <strong>{result.metadata.filename || 'Video selecionado'}</strong>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/70 px-3 py-2">
          <span className="block uppercase tracking-wide opacity-70">Tamanho</span>
          <strong>{formatBytes(result.metadata.size_bytes || 0)}</strong>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/70 px-3 py-2">
          <span className="block uppercase tracking-wide opacity-70">Duracao</span>
          <strong>{formatDurationLabel(result.metadata.duration_seconds || 0)}</strong>
        </div>
        <div className="rounded-lg border border-white/70 bg-white/70 px-3 py-2">
          <span className="block uppercase tracking-wide opacity-70">Resolucao</span>
          <strong>{result.metadata.width || 0} x {result.metadata.height || 0}</strong>
        </div>
      </div>

      {result.errors.length > 0 && (
        <div className="mt-3 space-y-1 text-[11px]">
          <p className="font-bold">Problemas bloqueantes</p>
          {result.errors.map((issue) => <p key={issue.code}>- {issue.message}</p>)}
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="mt-3 space-y-1 text-[11px]">
          <p className="font-bold">Avisos</p>
          {result.warnings.map((issue) => <p key={issue.code}>- {issue.message}</p>)}
        </div>
      )}
    </div>
  );
}
