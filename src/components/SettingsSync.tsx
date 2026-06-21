import React, { useState, useEffect } from 'react';
import { SettingsConfig } from '../types';
import { Settings, Save, Sparkles, FolderOpen, Key, Link2, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

interface SettingsSyncProps {
  onSettingsSaved?: () => void;
}

export default function SettingsSync({ onSettingsSaved }: SettingsSyncProps) {
  const [settings, setSettings] = useState<SettingsConfig>({
    mode: 'SIMULATOR',
    supabaseUrl: '',
    supabaseKey: '',
    googleDriveFolderId: '',
    instagramAccessToken: '',
    instagramBusinessId: '',
    geminiModel: 'gemini-3.5-flash'
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        if (onSettingsSaved) onSettingsSaved();
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
          <h2 className="text-xl font-bold font-sans text-slate-800">Parâmetros e Integrações</h2>
          <p className="text-xs text-slate-500 mt-1">
            Alterne entre o Simulador Sandbox de Produção e conexões reais do Google Drive e Instagram Graph API.
          </p>
        </div>
        <Settings className="w-5 h-5 text-brand-secondary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Info Block */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gradient-to-br from-brand-secondary to-brand-primary text-brand-darker rounded-xl p-5 shadow-md space-y-4 font-semibold">
            <h3 className="font-bold text-sm tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-darker" /> Modo Simulator Sandbox Ativo
            </h3>
            <p className="text-xs leading-relaxed text-brand-darker/90">
              Por padrão, o WebApp é carregado em modo <strong>Simulado (Sandbox)</strong>. Isso permite que você teste o fluxo inteiro (Criação, Aprovação, agendamentos automáticos e postagens imediatas) sem custos ou chave-físicas reais.
            </p>
            <div className="border-t border-brand-primary/20 pt-3 text-xs text-brand-darker/90 space-y-2">
              <p className="font-bold">• Estruturas salvam localmente</p>
              <p className="font-bold">• Uploads ao Drive geram IDs simulados</p>
              <p className="font-bold">• Geração de legenda real via Gemini!</p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-xs space-y-2">
            <div className="flex gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Como conectar as redes reais?</p>
                <p className="mt-1 leading-relaxed text-amber-800">
                  Insira as credenciais oficiais ao lado e alterne o modo para "REAL (Modo Produção)". O middleware redirecionará os disparos para a api oficial do Instagram e enviará as mídias para a pasta cadastrada do Google Drive.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Forms */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5 bg-white p-6 border border-slate-200 rounded-xl shadow-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Modo de Operação
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, mode: 'SIMULATOR' })}
                className={`py-3 px-4 rounded-lg font-bold text-xs border text-center transition-all ${
                  settings.mode === 'SIMULATOR'
                    ? 'border-brand-secondary bg-brand-light text-brand-secondary ring-2 ring-brand-secondary/10'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                Simulador / Sandbox UI
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, mode: 'REAL' })}
                className={`py-3 px-4 rounded-lg font-medium text-xs border text-center transition-all ${
                  settings.mode === 'REAL'
                    ? 'border-emerald-600 bg-emerald-50/50 text-emerald-800 ring-2 ring-emerald-600/10'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                REAL (Modo Produção)
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-semibold text-sm text-slate-800 border-b border-slate-100 pb-2">
              Configurações de Credenciais
            </h3>

            {/* Google Drive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <FolderOpen className="w-3.5 h-3.5 text-yellow-500" /> ID Pasta Raiz Google Drive
                </label>
                <input
                  type="text"
                  required={settings.mode === 'REAL'}
                  placeholder="e.g. 1a2b3c4d5e6f7g..."
                  value={settings.googleDriveFolderId}
                  onChange={(e) => setSettings({ ...settings, googleDriveFolderId: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-brand-primary"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">A estrutura criará as subpastas /Imagens e /Videos</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-secondary" /> Modelo do Gemini AI
                </label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-brand-primary bg-white"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (Ideal para Textos)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Altíssima Qualidade)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Configurado de forma segura no backend Express</span>
              </div>
            </div>

            {/* Instagram Web Graph */}
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-pink-500" /> Instagram Business Account ID
                  </label>
                  <input
                    type="text"
                    required={settings.mode === 'REAL'}
                    placeholder="e.g. 17841405342901324"
                    value={settings.instagramBusinessId}
                    onChange={(e) => setSettings({ ...settings, instagramBusinessId: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-blue-500" /> Token de Acesso Duradouro (Meta)
                  </label>
                  <input
                    type="password"
                    required={settings.mode === 'REAL'}
                    placeholder="EAAM77vT7..."
                    value={settings.instagramAccessToken}
                    onChange={(e) => setSettings({ ...settings, instagramAccessToken: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>

            {/* Supabase Core */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Configuração do Supabase (Opcional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://yourproject.supabase.co"
                    value={settings.supabaseUrl}
                    onChange={(e) => setSettings({ ...settings, supabaseUrl: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-brand-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Supabase Public Anon Key
                  </label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOi..."
                    value={settings.supabaseKey}
                    onChange={(e) => setSettings({ ...settings, supabaseKey: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-brand-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            {success ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <CheckCircle2 className="w-4 h-4" /> Parâmetros salvos e sincronizados com sucesso!
              </span>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                {settings.mode === 'REAL' ? (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Atenção: Modo Produção Real Requer Chaves Ativas
                  </span>
                ) : (
                  <span>Modo Simulador de Postagens Ativado</span>
                )}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-brand-secondary hover:bg-brand-primary text-brand-darker rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md transition-all duration-150 shrink-0 border border-brand-primary/10"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Sincronizando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
