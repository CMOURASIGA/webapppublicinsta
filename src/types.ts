export type PerfilPublicacao = 'CRIADOR' | 'APROVADOR' | 'ADMIN';

export interface Usuario {
  id: string; // UUID or string
  auth_user_id?: string;
  nome: string;
  email: string;
  perfil: 'USUARIO' | 'ADMINISTRADOR';
  perfil_publicacao?: PerfilPublicacao;
  ativo: boolean;
  criado_em: string;
}

export type PostStatus = 'RASCUNHO' | 'PENDENTE' | 'APROVADA' | 'REJEITADA' | 'AGENDADA' | 'PUBLICADA' | 'ERRO';
export type MediaValidationStatus = 'VALID' | 'VALID_WITH_WARNINGS' | 'INVALID';

export interface MediaValidationIssue {
  code: string;
  message: string;
}

export interface MediaMetadata {
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  width?: number;
  height?: number;
  duration_seconds?: number;
  aspect_ratio?: number;
  orientation?: 'vertical' | 'horizontal' | 'square' | 'unknown';
  has_audio?: boolean;
  source?: 'browser' | 'backend' | 'external';
}

export interface VideoEditMetadata {
  edited?: boolean;
  tool?: string;
  trim_start_sec?: number;
  trim_end_sec?: number;
  thumbnail_time_sec?: number;
  created_in_browser?: boolean;
  original_filename?: string;
  final_filename?: string;
}

export interface Post {
  id: string; // UUID
  titulo: string;
  legenda: string;
  tipo: 'IMAGEM' | 'VIDEO' | 'REELS';
  drive_file_id?: string;
  drive_url?: string;
  creation_id?: string;
  status: PostStatus;
  instagram_post_id?: string;
  data_agendamento?: string; // ISO String
  data_publicacao?: string; // ISO String
  criado_em: string;
  atualizado_em: string;
  hashtags?: string; // separated by spaces/commas
  criado_por_nome?: string;
  erro_detalhe?: string;
  media_validation_status?: MediaValidationStatus | null;
  media_validation_errors?: MediaValidationIssue[];
  media_validation_warnings?: MediaValidationIssue[];
  media_metadata?: MediaMetadata;
  video_original_drive_file_id?: string | null;
  video_original_drive_url?: string | null;
  video_editado_drive_file_id?: string | null;
  video_editado_drive_url?: string | null;
  trim_start_sec?: number | null;
  trim_end_sec?: number | null;
  video_original_duration_sec?: number | null;
  video_final_duration_sec?: number | null;
  thumbnail_drive_file_id?: string | null;
  thumbnail_drive_url?: string | null;
  thumbnail_time_sec?: number | null;
  video_edit_metadata?: VideoEditMetadata;
}

export interface HistoricoPost {
  id: string;
  post_id: string;
  post_titulo?: string;
  usuario: string; // Name of person who did the action
  acao: string; // e.g. "Criação de Post", "Edição de legenda", "Envio para Aprovação", "Rejeitado", "Aprovado", "Publicado"
  observacao?: string;
  criado_em: string;
}

export interface SettingsConfig {
  mode: 'SIMULATOR' | 'REAL';
  operationalMode: 'SIMULATOR' | 'REAL';
  appUrl: string;
  supabaseUrl: string;
  supabaseConfigured: boolean;
  supabaseSchemaReady: boolean;
  missingSupabaseTables: string[];
  googleDriveFolderId: string;
  googleConfigured: boolean;
  instagramBusinessId: string;
  instagramGraphBaseUrl?: string;
  facebookPageId: string;
  instagramConfigured: boolean;
  geminiModel: string;
  geminiConfigured: boolean;
  graphApiVersion: string;
  secretsStoredInBackend: boolean;
  readOnly: boolean;
  missingEnv: string[];
}

export interface LogMessage {
  id: string;
  timestamp: string;
  service: 'Google Drive' | 'Instagram API' | 'Scheduler' | 'Gemini AI' | 'Database';
  type: 'info' | 'success' | 'warn' | 'error';
  message: string;
  payload?: string;
}
