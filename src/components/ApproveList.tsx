import React, { useEffect, useState } from 'react';
import { Post, Usuario } from '../types';
import { apiFetch } from '../lib/api';
import { AlertTriangle, ArrowRight, Calendar, ClipboardCheck, Clock, Edit3, Eye, Loader2, Send, User, X } from 'lucide-react';

interface ApproveListProps {
  onWorkflowComplete?: () => void;
  currentUser: Usuario;
}

interface MediaValidation {
  state: 'idle' | 'loading' | 'ready' | 'error';
  width: number;
  height: number;
  aspectRatio: number;
  displayAspectRatio: number;
  isFeedCompatible: boolean;
  blockingIssues: string[];
  warnings: string[];
  recommendedLabel: string;
  previewLabel: string;
}

const DEFAULT_MEDIA_VALIDATION: MediaValidation = {
  state: 'idle',
  width: 0,
  height: 0,
  aspectRatio: 1,
  displayAspectRatio: 1,
  isFeedCompatible: false,
  blockingIssues: [],
  warnings: [],
  recommendedLabel: '',
  previewLabel: 'Prévia do feed',
};

function roundAspectRatio(value: number): number {
  return Math.round(value * 100) / 100;
}

function getMediaMetadata(url: string, tipo: Post['tipo']): Promise<{ width: number; height: number }> {
  if (tipo === 'VIDEO' || tipo === 'REELS') {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
      video.onerror = () => reject(new Error('Não foi possível ler os metadados do vídeo.'));
      video.src = url;
    });
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error('Não foi possível ler os metadados da imagem.'));
    image.src = url;
  });
}

function buildMediaValidation(post: Post, width: number, height: number): MediaValidation {
  const aspectRatio = width / height;
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const isReel = post.tipo === 'REELS';

  if (!width || !height || !Number.isFinite(aspectRatio)) {
    return { ...DEFAULT_MEDIA_VALIDATION, state: 'error', blockingIssues: ['Não foi possível identificar o tamanho da mídia.'] };
  }

  if (isReel) {
    if (aspectRatio < 0.56 || aspectRatio > 0.8) {
      blockingIssues.push('Reels devem usar formato vertical entre 9:16 e 4:5.');
    }
    if (Math.abs(aspectRatio - 9 / 16) > 0.03) {
      warnings.push('O formato ideal para reel é 1080 x 1920 (9:16).');
    }
    if (width < 1080 || height < 1350) {
      warnings.push('A resolução está abaixo do ideal para reel.');
    }
  } else {
    if (aspectRatio < 0.8 || aspectRatio > 1.91) {
      blockingIssues.push('Posts de feed devem ficar entre 4:5 e 1.91:1.');
    }
    if (width < 1080) {
      warnings.push('A largura está abaixo de 1080 px.');
    }
    const nearestRecommended = Math.min(Math.abs(aspectRatio - 0.8), Math.abs(aspectRatio - 1), Math.abs(aspectRatio - 1.91));
    if (nearestRecommended > 0.08) {
      warnings.push('A proporção é aceita, mas não está em um formato padrão do Instagram.');
    }
  }

  return {
    state: 'ready',
    width,
    height,
    aspectRatio,
    displayAspectRatio: isReel ? 9 / 16 : Math.min(1.91, Math.max(0.8, aspectRatio)),
    isFeedCompatible: blockingIssues.length === 0,
    blockingIssues,
    warnings,
    recommendedLabel: isReel ? '1080 x 1920 (9:16)' : '1080 x 1350 (4:5), 1080 x 1080 (1:1) ou 1080 x 566 (1.91:1)',
    previewLabel: isReel ? 'Prévia de reel com área segura no feed' : 'Prévia realista do feed',
  };
}

function InstagramPreview({ post, legenda, hashtags, validation }: { post: Post; legenda: string; hashtags: string; validation: MediaValidation }) {
  return (
    <div className="w-full max-w-[316px] mx-auto rounded-[2.8rem] border-[10px] border-slate-950 bg-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.22)] overflow-hidden">
      <div className="mx-auto mt-0 h-6 w-28 rounded-b-[1.1rem] bg-slate-950" />
      <div className="px-3.5 py-2 flex items-center justify-between border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 flex items-center justify-center text-[8px] font-bold text-white uppercase">IG</div>
          <div className="leading-none text-left">
            <span className="text-[10px] font-bold text-slate-800 block">suamarca_oficial</span>
            <span className="text-[8px] text-slate-400">Patrocinado</span>
          </div>
        </div>
        <div className="flex gap-0.5"><span className="w-1 h-1 rounded-full bg-slate-400"></span><span className="w-1 h-1 rounded-full bg-slate-400"></span><span className="w-1 h-1 rounded-full bg-slate-400"></span></div>
      </div>
      <div className="relative bg-slate-950" style={{ aspectRatio: `${validation.displayAspectRatio || 1}` }}>
        {post.drive_url ? (
          post.tipo === 'VIDEO' || post.tipo === 'REELS' ? (
            <video src={post.drive_url} className="h-full w-full object-cover" muted loop autoPlay playsInline controls />
          ) : (
            <img src={post.drive_url} alt="Preview da publicação" className="h-full w-full object-cover" />
          )
        ) : (
          <div className="flex h-full items-center justify-center text-[11px] text-slate-400">Mídia não vinculada</div>
        )}
        {post.tipo === 'REELS' && validation.state === 'ready' && (
          <div className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto w-full -translate-y-1/2 border-y-2 border-dashed border-white/70 bg-white/10" style={{ aspectRatio: '4 / 5' }}>
            <div className="absolute -top-5 left-2 rounded bg-black/60 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-white">Área do feed</div>
          </div>
        )}
      </div>
      <div className="px-3 py-2 flex items-center justify-between bg-white text-slate-700">
        <div className="flex gap-3"><span>♡</span><span>◌</span><span>↗</span></div><span>⌑</span>
      </div>
      <div className="px-3.5 pb-4 pt-1 bg-white text-left text-[10px] leading-relaxed max-h-[90px] overflow-y-auto">
        <p className="text-slate-800"><span className="font-bold mr-1">suamarca_oficial</span><span className="text-slate-600">{legenda || 'Legenda em aprovação'}</span></p>
        <span className="text-brand-secondary block font-bold mt-1 truncate">{hashtags}</span>
      </div>
      <div className="mx-auto my-2 h-1.5 w-24 rounded-full bg-slate-300"></div>
    </div>
  );
}

export default function ApproveList({ onWorkflowComplete, currentUser }: ApproveListProps) {
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLegenda, setEditedLegenda] = useState('');
  const [editedHashtags, setEditedHashtags] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [mediaValidation, setMediaValidation] = useState<MediaValidation>(DEFAULT_MEDIA_VALIDATION);

  const fetchPending = async () => {
    try {
      const res = await apiFetch('/api/posts');
      const data = await res.json();
      const pending = (data.posts || []).filter((p: Post) => p.status === 'PENDENTE');
      setPendingPosts(pending);
      if (pending.length > 0) {
        const stillPending = pending.find((post: Post) => post.id === selectedPost?.id);
        if (!stillPending) {
          setSelectedPost(pending[0]);
          setEditedLegenda(pending[0].legenda || '');
          setEditedHashtags(pending[0].hashtags || '');
        }
      } else {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedPost?.drive_url) {
      setMediaValidation({
        ...DEFAULT_MEDIA_VALIDATION,
        state: selectedPost ? 'error' : 'idle',
        blockingIssues: selectedPost ? ['A postagem precisa ter mídia vinculada para ser validada.'] : [],
      });
      return () => {
        active = false;
      };
    }
    setMediaValidation({ ...DEFAULT_MEDIA_VALIDATION, state: 'loading', previewLabel: selectedPost.tipo === 'REELS' ? 'Prévia de reel com área segura no feed' : 'Prévia realista do feed' });
    getMediaMetadata(selectedPost.drive_url, selectedPost.tipo)
      .then(({ width, height }) => {
        if (active) setMediaValidation(buildMediaValidation(selectedPost, width, height));
      })
      .catch(() => {
        if (active) setMediaValidation({ ...DEFAULT_MEDIA_VALIDATION, state: 'error', blockingIssues: ['Não foi possível ler a largura e a altura da mídia.'] });
      });
    return () => {
      active = false;
    };
  }, [selectedPost]);

  const canProceed = mediaValidation.state === 'ready' && mediaValidation.isFeedCompatible && !loading;

  const handlePostSelection = (post: Post) => {
    setSelectedPost(post);
    setEditedLegenda(post.legenda || '');
    setEditedHashtags(post.hashtags || '');
    setIsEditing(false);
    setShowRejectModal(false);
    setShowScheduleForm(false);
  };

  const handleUpdateCaption = async () => {
    if (!selectedPost) return;
    try {
      const res = await apiFetch(`/api/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ legenda: editedLegenda, hashtags: editedHashtags }),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedPost(data.post);
        setIsEditing(false);
        fetchPending();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const approvalPayload = selectedPost ? {
    action: 'instant',
    mediaValidation: {
      width: mediaValidation.width,
      height: mediaValidation.height,
      aspectRatio: mediaValidation.aspectRatio,
      isFeedCompatible: mediaValidation.isFeedCompatible,
    },
  } : null;

  const handlePublishNow = async () => {
    if (!selectedPost || !approvalPayload) return;
    if (!canProceed) {
      alert('A mídia ainda não passou na validação para feed do Instagram.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/posts/${selectedPost.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(approvalPayload),
      });
      if (res.ok) {
        fetchPending();
        onWorkflowComplete?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedulePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost || !scheduleDateTime) return;
    if (!canProceed) {
      alert('A mídia ainda não passou na validação para feed do Instagram.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/posts/${selectedPost.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'schedule',
          appointmentTime: new Date(scheduleDateTime).toISOString(),
          mediaValidation: {
            width: mediaValidation.width,
            height: mediaValidation.height,
            aspectRatio: mediaValidation.aspectRatio,
            isFeedCompatible: mediaValidation.isFeedCompatible,
          },
        }),
      });
      if (res.ok) {
        setShowScheduleForm(false);
        fetchPending();
        onWorkflowComplete?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPost = async () => {
    if (!selectedPost || !rejectReason.trim()) {
      alert('Favor informar o motivo da reprovação.');
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/posts/${selectedPost.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: rejectReason }),
      });
      if (res.ok) {
        setShowRejectModal(false);
        setRejectReason('');
        fetchPending();
        onWorkflowComplete?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Moderação e Aprovação de Posts</h2>
          <p className="text-xs text-slate-500 mt-1">Agora a tela valida tamanho e proporção reais antes de permitir publicação ou agendamento.</p>
        </div>
        <ClipboardCheck className="w-5 h-5 text-brand-secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-1">Fila de Espera ({pendingPosts.length})</h3>
          {pendingPosts.length === 0 ? (
            <div className="bg-white border border-slate-205 p-8 text-center rounded-xl space-y-2">
              <ClipboardCheck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Tudo em dia</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
              {pendingPosts.map((post) => (
                <button key={post.id} onClick={() => handlePostSelection(post)} className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 ${selectedPost?.id === post.id ? 'border-brand-secondary bg-brand-light shadow-sm ring-2 ring-brand-primary/10' : 'border-slate-250 bg-white hover:bg-slate-50'}`}>
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-[10px] font-bold text-brand-secondary uppercase bg-brand-light border border-brand-primary/20 px-2 py-0.5 rounded">{post.tipo === 'VIDEO' ? 'Vídeo' : post.tipo === 'REELS' ? 'Reel' : 'Imagem'}</span>
                    <span className="text-[10px] text-slate-400">{new Date(post.criado_em).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{post.titulo}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{post.legenda}</p>
                  </div>
                  <div className="border-t border-slate-100/80 pt-2 flex items-center justify-between w-full text-[10px] text-slate-400">
                    <span className="truncate max-w-[120px] flex items-center gap-1"><User className="w-3 h-3" /> {post.criado_por_nome || 'Equipe'}</span>
                    <span className="font-semibold text-slate-600 flex items-center gap-0.5">Revisar <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-8" id="detalhes-moderar">
          {selectedPost ? (
            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">Pendente Homologação</span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {selectedPost.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mt-1.5">{selectedPost.titulo}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10.5px] text-slate-500">
                    <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-400" /> Cadastrado por: <strong className="text-slate-700 font-medium">{selectedPost.criado_por_nome || currentUser.nome}</strong></span>
                    <span className="text-slate-300">•</span>
                    <span>Criado em: {new Date(selectedPost.criado_em).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <button onClick={() => setIsEditing(!isEditing)} className="p-2 sm:px-3 text-xs font-semibold text-slate-700 bg-slate-55 border border-slate-200 rounded-lg flex items-center gap-1.5 shrink-0">
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">{isEditing ? 'Cancelar Edição' : 'Editar Legenda'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                <div className="md:col-span-5 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{mediaValidation.previewLabel}</span>
                  <InstagramPreview post={selectedPost} legenda={isEditing ? editedLegenda : selectedPost.legenda} hashtags={isEditing ? editedHashtags : (selectedPost.hashtags || '')} validation={mediaValidation} />
                  <div className={`rounded-xl border p-3 text-xs ${mediaValidation.isFeedCompatible && mediaValidation.state === 'ready' ? 'border-emerald-200 bg-emerald-50/80' : 'border-amber-200 bg-amber-50/80'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold uppercase tracking-wide text-[10px] text-slate-500">Validação Instagram</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${mediaValidation.isFeedCompatible && mediaValidation.state === 'ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {mediaValidation.state === 'loading' ? 'Lendo mídia' : mediaValidation.isFeedCompatible && mediaValidation.state === 'ready' ? 'Apta para publicar' : 'Ajuste necessário'}
                      </span>
                    </div>
                    {mediaValidation.state === 'ready' && (
                      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-700">
                        <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-slate-200"><span className="block text-[10px] uppercase tracking-wide text-slate-400">Tamanho real</span><strong>{mediaValidation.width} x {mediaValidation.height}px</strong></div>
                        <div className="rounded-lg bg-white/80 px-2.5 py-2 border border-slate-200"><span className="block text-[10px] uppercase tracking-wide text-slate-400">Proporção</span><strong>{roundAspectRatio(mediaValidation.aspectRatio)}:1</strong></div>
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-slate-600">Formatos recomendados: <strong>{mediaValidation.recommendedLabel || '1080 x 1350, 1080 x 1080 ou 1080 x 566'}</strong></p>
                    {mediaValidation.blockingIssues.map((issue) => <p key={issue} className="mt-1 text-[11px] text-rose-700">• {issue}</p>)}
                    {mediaValidation.warnings.map((warning) => <p key={warning} className="mt-1 text-[11px] text-amber-700">• {warning}</p>)}
                  </div>
                </div>

                <div className="md:col-span-7 space-y-4">
                  {isEditing ? (
                    <div className="space-y-3 bg-slate-50 p-4 border border-slate-150 rounded-xl">
                      <span className="text-[10px] font-bold text-brand-secondary uppercase block tracking-wider">Editor de Legenda / Hashtags</span>
                      <textarea rows={4} value={editedLegenda} onChange={(e) => setEditedLegenda(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white leading-normal" />
                      <input type="text" value={editedHashtags} onChange={(e) => setEditedHashtags(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white" />
                      <button type="button" onClick={handleUpdateCaption} className="px-3 py-1.5 bg-brand-secondary text-brand-darker rounded text-xs font-bold">Salvar Alterações</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Texto de Legenda</span><div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedPost.legenda || <span className="italic text-slate-400">Nenhuma legenda cadastrada.</span>}</div></div>
                      {selectedPost.hashtags && <div><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hashtags Estratégicas</span><p className="text-xs text-indigo-600 font-semibold tracking-wide bg-indigo-50/30 p-2.5 rounded-lg border border-indigo-100/30">{selectedPost.hashtags}</p></div>}
                    </div>
                  )}
                </div>
              </div>

              {!showRejectModal && !showScheduleForm && (
                <div className="border-t border-slate-100 pt-5 flex flex-wrap gap-3">
                  <button onClick={() => setShowRejectModal(true)} className="flex-1 min-w-[130px] py-2.5 border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"><X className="w-4 h-4" /> Reprovar / Solicitar Ajustes</button>
                  <button onClick={() => { if (!canProceed) return; setShowScheduleForm(true); const inOneHour = new Date(Date.now() + 60 * 60 * 1000); const year = inOneHour.getFullYear(); const month = String(inOneHour.getMonth() + 1).padStart(2, '0'); const day = String(inOneHour.getDate()).padStart(2, '0'); const hours = String(inOneHour.getHours()).padStart(2, '0'); const minutes = String(inOneHour.getMinutes()).padStart(2, '0'); setScheduleDateTime(`${year}-${month}-${day}T${hours}:${minutes}`); }} disabled={!canProceed} className="flex-1 min-w-[130px] py-2.5 border border-slate-200 bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5"><Calendar className="w-4 h-4" /> Agendar Publicação</button>
                  <button onClick={handlePublishNow} disabled={!canProceed} className="flex-1 min-w-[150px] py-2.5 bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed text-brand-darker text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 border border-brand-primary/15">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-300" />} Aprovar e Publicar Agora</button>
                </div>
              )}

              {showRejectModal && (
                <div className="border-t-2 border-rose-100 bg-rose-50/20 p-4 sm:p-5 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-1.5"><AlertTriangle className="w-5 h-5 text-rose-600" /><span className="text-xs font-semibold text-rose-850">Informação de Ajustes ao Redator</span></div>
                  <textarea rows={3} required placeholder="Explique o que precisa ser ajustado antes da publicação." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full text-xs p-2.5 border border-rose-200 rounded-lg bg-white" />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowRejectModal(false)} className="px-3.5 py-1.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">Cancelar</button>
                    <button type="button" onClick={handleRejectPost} className="px-3.5 py-1.5 bg-rose-600 text-white rounded text-xs font-semibold">Enviar Rejeição</button>
                  </div>
                </div>
              )}

              {showScheduleForm && (
                <form onSubmit={handleSchedulePost} className="border-t-2 border-brand-primary/30 bg-brand-light/30 p-4 sm:p-5 rounded-xl space-y-4">
                  <div className="flex items-center gap-1.5"><Clock className="w-5 h-5 text-brand-secondary" /><span className="text-xs font-bold text-brand-darker">Agendar Data e Hora de Disparo</span></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-1">Escolha Data e Hora</label>
                      <input type="datetime-local" required value={scheduleDateTime} onChange={(e) => setScheduleDateTime(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setShowScheduleForm(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">Cancelar</button>
                      <button type="submit" disabled={!canProceed} className="flex-1 py-2.5 bg-brand-secondary disabled:opacity-50 disabled:cursor-not-allowed text-brand-darker rounded-lg text-xs font-bold">Confirmar Agenda</button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 h-[480px] rounded-xl flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Eye className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">Selecione uma publicação à esquerda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
