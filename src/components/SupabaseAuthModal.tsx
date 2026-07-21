import React, { useState } from 'react';
import { LogIn, LogOut, Database, X, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, signInWithDiscord, signOut } from '../lib/supabase';

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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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
                TJ Manager - Autenticação Discord
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-gray-300">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

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
                  disabled={isLoggingIn}
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
                Status da Conexão TJ Manager
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>Modo de Armazenamento:</span>
                <span className={isSupabaseConfigured ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                  {isSupabaseConfigured ? 'TJ Manager Cloud' : 'Modo Convidado (Local)'}
                </span>
              </div>
            </div>
          </div>
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
