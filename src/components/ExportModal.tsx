import React, { useState } from 'react';
import { Download, X, Check, Copy, FileText, CheckSquare, Square, Layers } from 'lucide-react';
import { LoLAccount, Folder } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  accounts: LoLAccount[];
  folders: Folder[];
  activeFolderId: string | null;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  accounts,
  folders,
  activeFolderId,
  onClose,
}) => {
  const [includeElo, setIncludeElo] = useState(true);
  const [includeFolder, setIncludeFolder] = useState(true);
  const [includeTags, setIncludeTags] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [exportScope, setExportScope] = useState<'all' | 'folder'>('all');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const targetFolder = folders.find(f => f.id === activeFolderId);
  const filteredAccounts = (exportScope === 'folder' && activeFolderId) 
    ? accounts.filter(a => a.folderId === activeFolderId)
    : accounts;

  // Generate txt lines
  const generateTxtContent = (): string => {
    return filteredAccounts.map(acc => {
      const parts: string[] = [];

      // 1. Nick#Tag (Mandatory)
      const nickTag = `${acc.gameName || 'Invocador'}#${acc.tagLine || 'BR1'}`;
      parts.push(nickTag);

      // 2. Login:Senha (Mandatory)
      const loginPass = `${acc.login || ''}:${acc.password || ''}`;
      parts.push(loginPass);

      // 3. Elo (Optional)
      if (includeElo) {
        let eloStr = 'UNRANKED';
        if (acc.tier && acc.tier !== 'UNRANKED') {
          eloStr = `${acc.tier} ${acc.rank || ''} (${acc.leaguePoints ?? 0} LP)`.trim();
        }
        parts.push(eloStr);
      }

      // 4. Pasta (Optional)
      if (includeFolder) {
        const folderObj = folders.find(f => f.id === acc.folderId);
        const folderName = folderObj ? folderObj.name : 'Sem Pasta';
        parts.push(folderName);
      }

      // 5. Tags (Optional)
      if (includeTags) {
        const tagsStr = acc.tags && acc.tags.length > 0 
          ? acc.tags.map(t => t.text).join(', ') 
          : 'Sem Tags';
        parts.push(tagsStr);
      }

      // 6. Anotações (Optional)
      if (includeNotes) {
        const notesStr = acc.notes && acc.notes.trim() ? acc.notes.trim() : 'Sem Anotações';
        parts.push(notesStr);
      }

      return parts.join(' | ');
    }).join('\n');
  };

  const txtContent = generateTxtContent();

  const handleDownloadTxt = () => {
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.download = `TJ_Accounts_Export_${dateStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(txtContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const previewLines = txtContent.split('\n').slice(0, 5);

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#161C24] border border-cyan-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0F141B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Download size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Exportar Contas (.txt)
                <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono">
                  {filteredAccounts.length} {filteredAccounts.length === 1 ? 'conta' : 'contas'}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Escolha os campos que deseja incluir no arquivo de texto exportado.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Scope Selector */}
          {activeFolderId && targetFolder && (
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                <Layers size={16} className="text-cyan-400" />
                Escopo da Exportação:
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExportScope('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    exportScope === 'all'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Todas as Contas ({accounts.length})
                </button>
                <button
                  onClick={() => setExportScope('folder')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    exportScope === 'folder'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Apenas Pasta "{targetFolder.name}" ({filteredAccounts.length})
                </button>
              </div>
            </div>
          )}

          {/* Fields Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              Campos Incluídos no Arquivo:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mandatory: Nick#Tag & Login:Senha */}
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3 opacity-80 cursor-not-allowed">
                <CheckSquare size={18} className="text-cyan-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-white block">Nick#Tag & Login:Senha</span>
                  <span className="text-[10px] text-gray-400">Obrigatório (Padrão)</span>
                </div>
              </div>

              {/* Checkbox: Elo */}
              <button
                onClick={() => setIncludeElo(!includeElo)}
                className={`p-3 border rounded-xl flex items-center gap-3 text-left transition-all ${
                  includeElo 
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white' 
                    : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {includeElo ? <CheckSquare size={18} className="text-cyan-400 shrink-0" /> : <Square size={18} className="shrink-0" />}
                <div>
                  <span className="text-xs font-bold block">Elo (Tier, Rank, LP)</span>
                  <span className="text-[10px] text-gray-400">Ex: GOLD IV (50 LP)</span>
                </div>
              </button>

              {/* Checkbox: Pasta */}
              <button
                onClick={() => setIncludeFolder(!includeFolder)}
                className={`p-3 border rounded-xl flex items-center gap-3 text-left transition-all ${
                  includeFolder 
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white' 
                    : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {includeFolder ? <CheckSquare size={18} className="text-cyan-400 shrink-0" /> : <Square size={18} className="shrink-0" />}
                <div>
                  <span className="text-xs font-bold block">Nome da Pasta</span>
                  <span className="text-[10px] text-gray-400">Ex: Main Accounts</span>
                </div>
              </button>

              {/* Checkbox: Tags */}
              <button
                onClick={() => setIncludeTags(!includeTags)}
                className={`p-3 border rounded-xl flex items-center gap-3 text-left transition-all ${
                  includeTags 
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white' 
                    : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {includeTags ? <CheckSquare size={18} className="text-cyan-400 shrink-0" /> : <Square size={18} className="shrink-0" />}
                <div>
                  <span className="text-xs font-bold block">Tags da Conta</span>
                  <span className="text-[10px] text-gray-400">Ex: Smurf, ADC</span>
                </div>
              </button>

              {/* Checkbox: Anotações */}
              <button
                onClick={() => setIncludeNotes(!includeNotes)}
                className={`p-3 border rounded-xl flex items-center gap-3 text-left transition-all ${
                  includeNotes 
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-white' 
                    : 'bg-black/30 border-white/10 text-gray-400 hover:border-white/20'
                }`}
              >
                {includeNotes ? <CheckSquare size={18} className="text-cyan-400 shrink-0" /> : <Square size={18} className="shrink-0" />}
                <div>
                  <span className="text-xs font-bold block">Anotações</span>
                  <span className="text-[10px] text-gray-400">Ex: Conta com skins da Vayne</span>
                </div>
              </button>
            </div>
          </div>

          {/* Format Legend & Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Pré-visualização do Formato:
              </label>
              <button
                onClick={handleCopyClipboard}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>

            <div className="p-3 bg-black/70 border border-white/10 rounded-xl font-mono text-[11px] text-cyan-300/90 overflow-x-auto space-y-1">
              {filteredAccounts.length === 0 ? (
                <span className="text-gray-500 italic">Nenhuma conta para exportar.</span>
              ) : (
                <>
                  {previewLines.map((line, idx) => (
                    <div key={idx} className="whitespace-nowrap">{line}</div>
                  ))}
                  {filteredAccounts.length > 5 && (
                    <div className="text-gray-500 italic pt-1 border-t border-white/5">
                      ... e mais {filteredAccounts.length - 5} linhas.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0F141B] flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Formato: <code className="text-cyan-400 font-mono text-[11px]">Nick#tag | login:senha | ...</code>
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>

            <button
              onClick={handleDownloadTxt}
              disabled={filteredAccounts.length === 0}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              <span>Exportar .TXT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
