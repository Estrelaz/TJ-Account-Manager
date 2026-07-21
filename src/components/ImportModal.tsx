import React, { useState } from 'react';
import { Upload, X, Check, AlertTriangle, Trash2, Plus, FileText, Folder as FolderIcon, CheckCircle2, Edit3 } from 'lucide-react';
import { LoLAccount, Folder } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  importedAccounts: LoLAccount[];
  importError: string | null;
  folders: Folder[];
  onClose: () => void;
  onConfirmImport: (accountsToImport: LoLAccount[]) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  importedAccounts,
  importError,
  folders,
  onClose,
  onConfirmImport
}) => {
  const [editableAccounts, setEditableAccounts] = useState<LoLAccount[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Sync state when modal opens or importedAccounts change
  React.useEffect(() => {
    setEditableAccounts(importedAccounts.map(acc => ({ ...acc })));
  }, [importedAccounts]);

  if (!isOpen) return null;

  const handleUpdateAccount = (id: string, field: keyof LoLAccount, value: any) => {
    setEditableAccounts(prev => prev.map(acc => {
      if (acc.id === id) {
        return { ...acc, [field]: value };
      }
      return acc;
    }));
  };

  const handleRemoveRow = (id: string) => {
    setEditableAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const handleAddEmptyRow = () => {
    const newAcc: LoLAccount = {
      id: crypto.randomUUID(),
      gameName: 'Novo Invocador',
      tagLine: 'BR1',
      region: 'americas',
      platform: 'br1',
      tags: [],
      createdAt: Date.now()
    };
    setEditableAccounts(prev => [...prev, newAcc]);
  };

  const handleConfirm = () => {
    // Filter out completely empty accounts
    const valid = editableAccounts.filter(acc => acc.gameName.trim().length > 0);
    const withFolder = valid.map(acc => ({
      ...acc,
      folderId: selectedFolderId || acc.folderId
    }));
    onConfirmImport(withFolder);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#161C24] border border-cyan-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0F141B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <FileText size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Importação de Contas
                {editableAccounts.length > 0 && (
                  <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono">
                    {editableAccounts.length} {editableAccounts.length === 1 ? 'conta encontrada' : 'contas encontradas'}
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Revise, edite ou ajuste os dados das contas importadas antes de salvar no painel.
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
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {importError ? (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl space-y-2 text-red-200">
              <div className="flex items-center gap-2 font-bold text-red-300 text-sm">
                <AlertTriangle size={18} />
                <span>Erro na Leitura do Arquivo</span>
              </div>
              <p className="text-xs text-red-200/90 leading-relaxed">
                {importError}
              </p>
              <div className="pt-2 text-[11px] text-gray-400 border-t border-red-500/20 space-y-1">
                <p className="font-semibold text-gray-300">Formatos aceitos:</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-400">
                  <li>Planilhas Excel (<code className="text-cyan-400">.xlsx</code>, <code className="text-cyan-400">.xls</code>) com colunas: <strong>Nick / Name, Tag, Login, Senha</strong></li>
                  <li>Arquivos de texto (<code className="text-cyan-400">.txt</code>, <code className="text-cyan-400">.csv</code>) com linhas no formato: <code className="text-cyan-300">Nick#Tag:Login:Senha</code> ou <code className="text-cyan-300">Login:Senha</code></li>
                </ul>
              </div>
            </div>
          ) : editableAccounts.length === 0 ? (
            <div className="p-8 text-center bg-black/30 border border-dashed border-white/10 rounded-2xl space-y-3">
              <AlertTriangle className="mx-auto text-amber-400" size={32} />
              <p className="text-sm font-semibold text-gray-300">Nenhuma conta válida identificada no arquivo.</p>
              <p className="text-xs text-gray-500">
                Certifique-se de que o arquivo contém colunas como Nick, Login e Senha ou dados estruturados por linha.
              </p>
            </div>
          ) : (
            <>
              {/* Folder Selection for Batch Import */}
              <div className="p-4 bg-black/40 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FolderIcon size={18} className="text-cyan-400" />
                  <span className="text-xs font-semibold text-gray-200">Atribuir todas as contas a uma Pasta:</span>
                </div>
                <select
                  value={selectedFolderId || ''}
                  onChange={e => setSelectedFolderId(e.target.value || null)}
                  className="bg-[#161C24] border border-white/15 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-cyan-400 transition-colors"
                >
                  <option value="">Nenhuma (Raiz - Todas as Contas)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Editable Table */}
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-black/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0F141B] text-gray-400 font-semibold border-b border-white/10 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-3 px-3">Nick</th>
                        <th className="py-3 px-2 w-20">TAG</th>
                        <th className="py-3 px-3">Login</th>
                        <th className="py-3 px-3">Senha</th>
                        <th className="py-3 px-2 w-24">Plataforma</th>
                        <th className="py-3 px-2 text-center w-12">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {editableAccounts.map((acc, index) => {
                        const isInvalid = !acc.gameName.trim();
                        return (
                          <tr key={acc.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-2">
                              <input
                                type="text"
                                value={acc.gameName}
                                onChange={e => handleUpdateAccount(acc.id, 'gameName', e.target.value)}
                                placeholder="Nome no Jogo"
                                className={`w-full bg-[#161C24] border ${isInvalid ? 'border-red-500/60 text-red-300' : 'border-white/10 focus:border-cyan-400'} rounded-lg px-2.5 py-1.5 text-white outline-none font-medium`}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={acc.tagLine}
                                onChange={e => handleUpdateAccount(acc.id, 'tagLine', e.target.value)}
                                placeholder="BR1"
                                className="w-full bg-[#161C24] border border-white/10 focus:border-cyan-400 rounded-lg px-2 py-1.5 text-gray-300 outline-none uppercase font-mono text-center"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={acc.login || ''}
                                onChange={e => handleUpdateAccount(acc.id, 'login', e.target.value)}
                                placeholder="Usuário"
                                className="w-full bg-[#161C24] border border-white/10 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-gray-300 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={acc.password || ''}
                                onChange={e => handleUpdateAccount(acc.id, 'password', e.target.value)}
                                placeholder="Senha"
                                className="w-full bg-[#161C24] border border-white/10 focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-gray-300 outline-none font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={acc.platform || 'br1'}
                                onChange={e => handleUpdateAccount(acc.id, 'platform', e.target.value)}
                                className="w-full bg-[#161C24] border border-white/10 text-gray-300 rounded-lg px-1.5 py-1.5 text-xs outline-none uppercase"
                              >
                                <option value="br1">BR1</option>
                                <option value="na1">NA1</option>
                                <option value="euw1">EUW</option>
                                <option value="eun1">EUNE</option>
                                <option value="la1">LAN</option>
                                <option value="la2">LAS</option>
                                <option value="kr">KR</option>
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => handleRemoveRow(acc.id)}
                                title="Remover esta linha"
                                className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-[#0F141B] border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={handleAddEmptyRow}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-colors"
                  >
                    <Plus size={14} />
                    <span>Adicionar Linha Manual</span>
                  </button>
                  <span className="text-[11px] text-gray-500">
                    Clique nos campos acima para editar os dados.
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0F141B] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          
          {editableAccounts.length > 0 && !importError && (
            <button
              onClick={handleConfirm}
              className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>Importar {editableAccounts.filter(a => a.gameName.trim()).length} Contas</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
