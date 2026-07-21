import React, { useState } from 'react';
import { LogIn, LogOut, Database, Copy, Check, X, ExternalLink, ShieldCheck, HelpCircle, Code, AlertTriangle } from 'lucide-react';
import { supabase, isSupabaseConfigured, signInWithDiscord, signOut, SUPABASE_SQL_SETUP } from '../lib/supabase';

interface SupabaseAuthModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onRefreshData?: () => void;
}

export const SupabaseAuthModal: React.FC<SupabaseAuthModalProps> = ({
  user,
  isOpen,
  onClose,
  onRefreshData
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'auth' | 'sql' | 'discord_guide'>('auth');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDiscordLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg(null);
    try {
      await signInWithDiscord();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao iniciar autenticação com Discord.');
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#161C24] border border-cyan-500/30 rounded-2xl max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                Integração Supabase & Auth Discord
              </h2>
              <p className="text-xs text-gray-400">
                Sincronize suas contas na nuvem e faça login com Discord
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-black/40 px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('auth')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'auth' 
                ? 'border-cyan-400 text-cyan-400 bg-white/5' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <LogIn size={14} />
            <span>Autenticação</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'sql' 
                ? 'border-cyan-400 text-cyan-400 bg-white/5' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Code size={14} />
            <span>Script SQL (Editor)</span>
          </button>
          <button
            onClick={() => setActiveTab('discord_guide')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'discord_guide' 
                ? 'border-cyan-400 text-cyan-400 bg-white/5' 
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <HelpCircle size={14} />
            <span>Guia do Discord OAuth</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-300">
          {!isSupabaseConfigured && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-200 text-xs flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-300 block mb-1">Chaves do Supabase Pendentes</span>
                Para habilitar o login real com Discord e banco na nuvem, configure as variáveis no painel de configurações ou ambiente:
                <div className="mt-2 font-mono text-[11px] bg-black/40 p-2 rounded border border-amber-500/20 text-amber-300">
                  VITE_SUPABASE_URL="https://sua-url.supabase.co"<br />
                  VITE_SUPABASE_ANON_KEY="sua-chave-anon"
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-4">
              {user ? (
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="" className="w-12 h-12 rounded-full border-2 border-cyan-400" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-lg border border-cyan-500/30">
                        {user.email?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{user.user_metadata?.full_name || user.user_metadata?.custom_claims?.global_name || user.email}</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                          Autenticado
                        </span>
                      </div>
                      <span className="text-xs text-gray-400 block mt-0.5">
                        ID: {user.id}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-semibold text-xs transition-colors flex items-center gap-2"
                  >
                    <LogOut size={14} />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <div className="p-6 bg-black/40 border border-white/10 rounded-2xl text-center flex flex-col items-center gap-4">
                  <div className="p-4 bg-[#5865F2]/20 border border-[#5865F2]/40 rounded-full text-[#5865F2]">
                    <LogIn size={32} />
                  </div>
                  <div className="max-w-md">
                    <h3 className="font-bold text-lg text-white">Login com Discord</h3>
                    <p className="text-xs text-gray-400 mt-1">
                      Conecte sua conta do Discord para armazenar suas contas de LoL e pastas com segurança na nuvem do Supabase.
                    </p>
                  </div>

                  <button
                    onClick={handleDiscordLogin}
                    disabled={isLoggingIn || !isSupabaseConfigured}
                    className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold rounded-xl shadow-lg shadow-[#5865F2]/20 transition-all flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogIn size={18} />
                    <span>{isLoggingIn ? 'Redirecionando...' : 'Entrar com Discord'}</span>
                  </button>
                </div>
              )}

              <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <div className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck size={14} className="text-cyan-400" />
                  Status da Conexão Supabase
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                  <span>Modo do Banco:</span>
                  <span className={isSupabaseConfigured ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {isSupabaseConfigured ? 'Supabase Cloud (Ativo)' : 'Modo Local (LocalStorage)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Instruções para o SQL Editor</h4>
                  <p className="text-xs text-gray-400">
                    Execute o código abaixo no <strong>SQL Editor</strong> do seu painel Supabase para criar as tabelas <code className="text-cyan-400">folders</code> e <code className="text-cyan-400">accounts</code> com segurança RLS.
                  </p>
                </div>

                <button
                  onClick={handleCopySQL}
                  className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0"
                >
                  {copiedSql ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="bg-black/70 border border-white/10 rounded-xl p-4 text-[11px] font-mono text-cyan-300/90 overflow-x-auto max-h-[300px] leading-relaxed">
                  {SUPABASE_SQL_SETUP}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'discord_guide' && (
            <div className="space-y-4 text-xs">
              <h4 className="font-bold text-white text-sm">Como configurar o login do Discord no Supabase:</h4>

              <ol className="list-decimal list-inside space-y-3 text-gray-300">
                <li className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <strong>Acesse o Discord Developer Portal:</strong><br />
                  Vá até <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-1">discord.com/developers/applications <ExternalLink size={10} /></a> e crie uma nova aplicação.
                </li>

                <li className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <strong>Copie as Credenciais OAuth2:</strong><br />
                  No menu lateral em <strong>OAuth2</strong>, copie o <code className="text-cyan-300">CLIENT ID</code> e gere um <code className="text-cyan-300">CLIENT SECRET</code>.
                </li>

                <li className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <strong>Ative o Provedor no Supabase:</strong><br />
                  No seu projeto Supabase, acesse <strong>Authentication &gt; Providers &gt; Discord</strong>.<br />
                  Ative a chave (Enabled) e cole o <strong>Client ID</strong> e <strong>Client Secret</strong>.
                </li>

                <li className="p-3 bg-white/5 border border-white/10 rounded-xl">
                  <strong>Configure o Redirect URL no Discord:</strong><br />
                  No Supabase, copie a <strong>Callback URL</strong> (ex: <code className="text-cyan-300">https://xxxx.supabase.co/auth/v1/callback</code>) e adicione em <strong>Redirects</strong> no Portal do Discord.
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
