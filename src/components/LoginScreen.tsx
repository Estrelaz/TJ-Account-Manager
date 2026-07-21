import React, { useState } from 'react';
import { Gamepad2, AlertTriangle, Code, Copy, Check, ExternalLink, HelpCircle, Shield, ArrowRight } from 'lucide-react';
import { signInWithDiscord, isSupabaseConfigured, SUPABASE_SQL_SETUP } from '../lib/supabase';

interface LoginScreenProps {
  onGuestLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGuestLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithDiscord();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao conectar com o Discord. Verifique a configuração do Supabase.');
      setIsLoading(false);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0A0E13] text-gray-100 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-cyan-500/30">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#5865F2]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full z-10 space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl shadow-xl shadow-cyan-500/20 text-white mb-2">
            <Gamepad2 size={36} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            LoL<span className="text-cyan-400">Manager</span>
          </h1>
          <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
            Gerencie suas contas do League of Legends, organize pastas e acompanhe elos com sincronização na nuvem.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-[#161C24] border border-white/10 rounded-3xl p-8 shadow-2xl space-y-6 relative backdrop-blur-xl">
          {!isSupabaseConfigured && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-300">
                <AlertTriangle size={16} />
                <span>Supabase Não Configurado</span>
              </div>
              <p className="text-amber-200/90 leading-relaxed">
                As variáveis <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> e <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> precisam ser definidas no projeto para o Discord Auth funcionar.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleDiscordLogin}
              disabled={isLoading || !isSupabaseConfigured}
              className="w-full py-4 px-6 bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.99] text-white font-bold rounded-2xl shadow-lg shadow-[#5865F2]/25 transition-all flex items-center justify-center gap-3 text-base disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <svg className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a73.57,73.57,0,0,0,64.3,0c.87.68,1.76,1.36,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.25,105.25,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.92-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53S36,40.3,42.45,40.3C48.92,40.3,54,46,53.9,53,53.9,60,48.83,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.07-12.7,11.44-12.7C91.17,40.3,96.25,46,96.15,53,96.15,60,91.09,65.69,84.69,65.69Z" />
              </svg>
              <span>{isLoading ? 'Conectando ao Discord...' : 'Logue com o Discord'}</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#161C24] px-3 text-[11px] uppercase tracking-wider text-gray-500 font-semibold absolute">
                ou
              </span>
            </div>

            <button
              onClick={onGuestLogin}
              className="w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-semibold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 group"
            >
              <span>Continuar em Modo Convidado (Local)</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Shield size={12} className="text-cyan-400" />
              Supabase Auth & RLS
            </span>
            <button
              onClick={() => setShowSqlModal(true)}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Code size={12} />
              <span>Ver Script SQL</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-gray-500">
          LoLManager &bull; Sincronização segura de dados de invocadores
        </p>
      </div>

      {/* Modal do Script SQL */}
      {showSqlModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowSqlModal(false)}
        >
          <div 
            className="bg-[#161C24] border border-cyan-500/30 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-white flex items-center gap-2 text-base">
                <Code size={18} className="text-cyan-400" />
                Script SQL para o Supabase Editor
              </h3>
              <button 
                onClick={() => setShowSqlModal(false)}
                className="text-gray-400 hover:text-white text-xs px-2 py-1 bg-white/5 rounded-lg"
              >
                Fechar
              </button>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed">
              Copie e cole este código no <strong>SQL Editor</strong> do Supabase para criar as tabelas <code className="text-cyan-400">folders</code> e <code className="text-cyan-400">accounts</code> com regras de permissão.
            </p>

            <pre className="bg-black/70 border border-white/10 rounded-xl p-4 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-[250px] leading-relaxed">
              {SUPABASE_SQL_SETUP}
            </pre>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopySql}
                className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-xl text-xs hover:bg-cyan-400 transition-colors flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedSql ? 'Copiado para a área de transferência!' : 'Copiar SQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
