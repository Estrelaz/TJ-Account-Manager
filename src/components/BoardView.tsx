import React, { useState, useRef } from 'react';
import { 
  Folder as FolderIcon, Plus, Edit2, Trash2, UserCircle2, 
  GripVertical, Maximize2, X, Hash, ChevronDown, ChevronUp,
  Inbox, Tag as TagIcon, Shield, Star, Zap, Activity, Award, Flame,
  Target, Sparkles, Sword, Crown, Ghost, Award as TrophyIcon, Copy, ChevronRight, FolderInput
} from 'lucide-react';
import { LoLAccount, Folder, Tag } from '../types';
import { AccountCard } from './AccountCard';

interface BoardViewProps {
  accounts: LoLAccount[];
  folders: Folder[];
  permanentTags?: Tag[];
  searchQuery: string;
  onDeleteAccount: (id: string) => void;
  onAddTag: (accountId: string, tag: Omit<Tag, 'id'>) => void;
  onRemoveTag: (accountId: string, tagId: string) => void;
  onReorderTags: (accountId: string, fromTagId: string, toTagId: string) => void;
  onMoveToFolder: (accountId: string, folderId: string | null) => void;
  onEditAccount: (accountId: string, updates: Partial<LoLAccount>) => void;
  onRefreshAccount?: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  onReorderAccounts?: (draggedAccountId: string, targetAccountId: string) => void;
  onReorderFolders?: (draggedFolderId: string, targetFolderId: string) => void;
  onOpenPermanentTagsModal?: () => void;
  onAddFolder: (name: string, color?: string, icon?: string) => void;
  onEditFolder: (id: string, name: string, color?: string, icon?: string) => void;
  onDeleteFolder: (folder: Folder) => void;
}

const IconMapper: Record<string, React.ElementType> = {
  folder: FolderIcon,
  shield: Shield,
  star: Star,
  zap: Zap,
  activity: Activity,
  award: Award,
  flame: Flame,
  target: Target,
  sparkles: Sparkles,
  sword: Sword,
  crown: Crown,
  ghost: Ghost,
};

const PRESET_COLORS = [
  { id: 'cyan', bg: 'bg-cyan-500' },
  { id: 'blue', bg: 'bg-blue-500' },
  { id: 'purple', bg: 'bg-purple-500' },
  { id: 'fuchsia', bg: 'bg-fuchsia-500' },
  { id: 'pink', bg: 'bg-pink-500' },
  { id: 'red', bg: 'bg-red-500' },
  { id: 'orange', bg: 'bg-orange-500' },
  { id: 'yellow', bg: 'bg-yellow-500' },
  { id: 'lime', bg: 'bg-lime-500' },
  { id: 'green', bg: 'bg-green-500' },
  { id: 'emerald', bg: 'bg-emerald-500' },
  { id: 'teal', bg: 'bg-teal-500' },
  { id: 'gray', bg: 'bg-gray-500' },
];

const PRESET_ICONS_LIST = [
  { name: 'folder', icon: FolderIcon },
  { name: 'shield', icon: Shield },
  { name: 'star', icon: Star },
  { name: 'zap', icon: Zap },
  { name: 'activity', icon: Activity },
  { name: 'award', icon: Award },
  { name: 'flame', icon: Flame },
  { name: 'target', icon: Target },
  { name: 'sparkles', icon: Sparkles },
  { name: 'sword', icon: Sword },
  { name: 'crown', icon: Crown },
  { name: 'ghost', icon: Ghost },
];

const FOLDER_COLOR_CLASSES: Record<string, { bg: string; border: string; text: string; headerBg: string; hoverBorder: string; hoverBg: string }> = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', headerBg: 'border-t-2 border-t-cyan-400', hoverBorder: 'hover:border-cyan-400/80 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]', hoverBg: 'hover:bg-cyan-950/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', headerBg: 'border-t-2 border-t-blue-400', hoverBorder: 'hover:border-blue-400/80 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]', hoverBg: 'hover:bg-blue-950/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', headerBg: 'border-t-2 border-t-purple-400', hoverBorder: 'hover:border-purple-400/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]', hoverBg: 'hover:bg-purple-950/20' },
  fuchsia: { bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/30', text: 'text-fuchsia-400', headerBg: 'border-t-2 border-t-fuchsia-400', hoverBorder: 'hover:border-fuchsia-400/80 hover:shadow-[0_0_20px_rgba(217,70,239,0.15)]', hoverBg: 'hover:bg-fuchsia-950/20' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400', headerBg: 'border-t-2 border-t-pink-400', hoverBorder: 'hover:border-pink-400/80 hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]', hoverBg: 'hover:bg-pink-950/20' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', headerBg: 'border-t-2 border-t-red-400', hoverBorder: 'hover:border-red-400/80 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]', hoverBg: 'hover:bg-red-950/20' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', headerBg: 'border-t-2 border-t-orange-400', hoverBorder: 'hover:border-orange-400/80 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)]', hoverBg: 'hover:bg-orange-950/20' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', headerBg: 'border-t-2 border-t-yellow-400', hoverBorder: 'hover:border-yellow-400/80 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)]', hoverBg: 'hover:bg-yellow-950/20' },
  lime: { bg: 'bg-lime-500/10', border: 'border-lime-500/30', text: 'text-lime-400', headerBg: 'border-t-2 border-t-lime-400', hoverBorder: 'hover:border-lime-400/80 hover:shadow-[0_0_20px_rgba(132,204,22,0.15)]', hoverBg: 'hover:bg-lime-950/20' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', headerBg: 'border-t-2 border-t-green-400', hoverBorder: 'hover:border-green-400/80 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]', hoverBg: 'hover:bg-green-950/20' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', headerBg: 'border-t-2 border-t-emerald-400', hoverBorder: 'hover:border-emerald-400/80 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]', hoverBg: 'hover:bg-emerald-950/20' },
  teal: { bg: 'bg-teal-500/10', border: 'border-teal-500/30', text: 'text-teal-400', headerBg: 'border-t-2 border-t-teal-400', hoverBorder: 'hover:border-teal-400/80 hover:shadow-[0_0_20px_rgba(20,184,166,0.15)]', hoverBg: 'hover:bg-teal-950/20' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-400', headerBg: 'border-t-2 border-t-gray-400', hoverBorder: 'hover:border-gray-400/80 hover:shadow-[0_0_20px_rgba(107,114,128,0.15)]', hoverBg: 'hover:bg-gray-950/20' },
};

const TIER_COLORS: Record<string, string> = {
  CHALLENGER: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  GRANDMASTER: 'bg-red-500/20 text-red-300 border-red-500/40',
  MASTER: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  DIAMOND: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  EMERALD: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  PLATINUM: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  GOLD: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  SILVER: 'bg-slate-400/20 text-slate-300 border-slate-400/40',
  BRONZE: 'bg-amber-800/20 text-amber-500 border-amber-800/40',
  IRON: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/40',
  UNRANKED: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
};

export const BoardView: React.FC<BoardViewProps> = ({
  accounts,
  folders,
  permanentTags = [],
  searchQuery,
  onDeleteAccount,
  onAddTag,
  onRemoveTag,
  onReorderTags,
  onMoveToFolder,
  onEditAccount,
  onRefreshAccount,
  onReorderAccounts,
  onReorderFolders,
  onOpenPermanentTagsModal,
  onAddFolder,
  onEditFolder,
  onDeleteFolder,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null | 'uncategorized'>(null);

  // Click & Drag horizontal scroll for board canvas
  const boardRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, input, form, select, a, [draggable="true"]')) return;
    if (!boardRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - boardRef.current.offsetLeft);
    setScrollLeft(boardRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !boardRef.current) return;
    e.preventDefault();
    const x = e.pageX - boardRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    boardRef.current.scrollLeft = scrollLeft - walk;
  };
  
  // New column creation inline state
  const [isAddingNewFolder, setIsAddingNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Edit folder inline state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('cyan');
  const [editIcon, setEditIcon] = useState('folder');

  // Filter accounts by search query
  const matchesSearch = (acc: LoLAccount) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      acc.gameName.toLowerCase().includes(q) ||
      acc.tagLine.toLowerCase().includes(q) ||
      acc.login.toLowerCase().includes(q) ||
      acc.tags.some(t => t.text.toLowerCase().includes(q))
    );
  };

  const uncategorizedAccounts = accounts.filter(a => (!a.folderId || !folders.some(f => f.id === a.folderId)) && matchesSearch(a));

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onAddFolder(newFolderName.trim(), 'cyan', 'folder');
    setNewFolderName('');
    setIsAddingNewFolder(false);
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Board Scroll Container with Drag-to-Scroll */}
      <div 
        ref={boardRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-6 pt-4 pb-2 custom-scrollbar h-full ${
          isMouseDown ? 'cursor-grabbing select-none' : 'cursor-grab'
        }`}
      >
        <div className="flex gap-5 items-stretch h-full min-w-max pb-2">

          {/* COLUMN 1: Uncategorized / Sem Pasta */}
          <div
            className={`w-80 shrink-0 bg-[#121820] border ${
              dragOverFolderId === 'uncategorized' ? 'border-cyan-400 ring-2 ring-cyan-500/40 bg-cyan-950/20' : 'border-white/10 hover:border-gray-400/80 hover:bg-gray-900/20 hover:shadow-[0_0_20px_rgba(107,114,128,0.15)]'
            } rounded-2xl flex flex-col h-full max-h-full shadow-2xl transition-all border-t-2 border-t-gray-500`}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverFolderId !== 'uncategorized') setDragOverFolderId('uncategorized');
            }}
            onDragLeave={() => setDragOverFolderId(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverFolderId(null);
              const type = e.dataTransfer.getData('type');
              if (type === 'account') {
                const draggedId = e.dataTransfer.getData('accountId');
                if (draggedId) {
                  onMoveToFolder(draggedId, null);
                }
              }
            }}
          >
            {/* Column Header */}
            <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#161C24]/80 rounded-t-2xl shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gray-500/10 border border-gray-500/20 rounded-lg text-gray-400">
                  <Inbox size={16} />
                </div>
                <h3 className="font-bold text-sm text-gray-200">Sem Pasta</h3>
              </div>
              <span className="text-xs font-mono bg-black/40 text-gray-400 border border-white/10 px-2 py-0.5 rounded-full font-bold">
                {uncategorizedAccounts.length}
              </span>
            </div>

            {/* Column Cards Area */}
            <div className="p-3 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar min-h-0">
              {uncategorizedAccounts.length === 0 ? (
                <div className="p-6 border border-dashed border-white/5 rounded-xl text-center text-xs text-gray-600">
                  Nenhuma conta aqui
                </div>
              ) : (
                uncategorizedAccounts.map(account => (
                  <CompactAccountCard
                    key={account.id}
                    account={account}
                    folders={folders}
                    onClick={() => setSelectedAccountId(account.id)}
                    onReorderAccounts={onReorderAccounts}
                    onMoveToFolder={onMoveToFolder}
                    onDeleteAccount={onDeleteAccount}
                  />
                ))
              )}
            </div>
          </div>

          {/* FOLDER COLUMNS */}
          {folders.map(folder => {
            const folderColor = FOLDER_COLOR_CLASSES[folder.color || 'cyan'] || FOLDER_COLOR_CLASSES.cyan;
            const IconComp = IconMapper[folder.icon || 'folder'] || FolderIcon;
            const folderAccounts = accounts.filter(a => a.folderId === folder.id && matchesSearch(a));
            const isEditingThis = editingFolderId === folder.id;

            return (
              <div
                key={folder.id}
                draggable={!isEditingThis}
                onDragStart={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('input, button, select') || target.closest('[data-account-card]')) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData('folderId', folder.id);
                  e.dataTransfer.setData('type', 'folder');
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className={`w-80 shrink-0 bg-[#121820] border ${
                  dragOverFolderId === folder.id 
                    ? 'border-cyan-400 ring-2 ring-cyan-500/40 bg-cyan-950/20' 
                    : `${folderColor.border} ${folderColor.hoverBorder} ${folderColor.hoverBg}`
                } rounded-2xl flex flex-col h-full max-h-full shadow-2xl transition-all ${folderColor.headerBg}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverFolderId !== folder.id) setDragOverFolderId(folder.id);
                }}
                onDragLeave={() => setDragOverFolderId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverFolderId(null);
                  const type = e.dataTransfer.getData('type');
                  if (type === 'folder') {
                    const draggedFolderId = e.dataTransfer.getData('folderId');
                    if (draggedFolderId && draggedFolderId !== folder.id && onReorderFolders) {
                      onReorderFolders(draggedFolderId, folder.id);
                    }
                  } else if (type === 'account') {
                    const draggedId = e.dataTransfer.getData('accountId');
                    if (draggedId) {
                      onMoveToFolder(draggedId, folder.id);
                    }
                  }
                }}
              >
                {/* Column Header */}
                <div className="p-3.5 border-b border-white/10 flex flex-col bg-[#161C24]/80 rounded-t-2xl shrink-0">
                  {isEditingThis ? (
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-300">Editar Pasta</span>
                        <button onClick={() => setEditingFolderId(null)} className="text-gray-500 hover:text-gray-300">
                          <X size={14} />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-black/60 border border-cyan-500/50 rounded px-2.5 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-cyan-400"
                        placeholder="Nome da pasta..."
                        autoFocus
                      />
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setEditColor(c.id)}
                            className={`w-4 h-4 rounded-full ${c.bg} ${editColor === c.id ? 'ring-2 ring-white ring-offset-1 ring-offset-[#121820]' : 'opacity-70 hover:opacity-100'}`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1 py-1">
                        {PRESET_ICONS_LIST.map(pi => {
                          const PIcon = pi.icon;
                          return (
                            <button
                              key={pi.name}
                              type="button"
                              onClick={() => setEditIcon(pi.name)}
                              className={`p-1 rounded ${editIcon === pi.name ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              <PIcon size={13} />
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setEditingFolderId(null)} className="text-xs text-gray-400 hover:text-white px-2 py-1">
                          Cancelar
                        </button>
                        <button 
                          onClick={() => {
                            if (editName.trim()) {
                              onEditFolder(folder.id, editName.trim(), editColor, editIcon);
                            }
                            setEditingFolderId(null);
                          }}
                          className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-3 py-1 rounded"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden pr-2">
                        <div className={`p-1.5 ${folderColor.bg} border ${folderColor.border} rounded-lg ${folderColor.text} shrink-0`}>
                          <IconComp size={16} />
                        </div>
                        <h3 className="font-bold text-sm text-gray-200 truncate">{folder.name}</h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className={`text-xs font-mono bg-black/40 ${folderColor.text} border ${folderColor.border} px-2 py-0.5 rounded-full font-bold mr-1`}>
                          {folderAccounts.length}
                        </span>
                        
                        <button
                          onClick={() => {
                            setEditingFolderId(folder.id);
                            setEditName(folder.name);
                            setEditColor(folder.color || 'cyan');
                            setEditIcon(folder.icon || 'folder');
                          }}
                          className="p-1 text-gray-500 hover:text-cyan-400 rounded transition-colors"
                          title="Editar Pasta"
                        >
                          <Edit2 size={13} />
                        </button>
                        
                        <button
                          onClick={() => onDeleteFolder(folder)}
                          className="p-1 text-gray-500 hover:text-red-400 rounded transition-colors"
                          title="Excluir Pasta"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Column Cards Container */}
                <div className="p-3 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar min-h-0">
                  {folderAccounts.length === 0 ? (
                    <div className="p-6 border border-dashed border-white/5 rounded-xl text-center text-xs text-gray-600">
                      Arraste contas para esta lista
                    </div>
                  ) : (
                    folderAccounts.map(account => (
                      <CompactAccountCard
                        key={account.id}
                        account={account}
                        folders={folders}
                        onClick={() => setSelectedAccountId(account.id)}
                        onReorderAccounts={onReorderAccounts}
                        onMoveToFolder={onMoveToFolder}
                        onDeleteAccount={onDeleteAccount}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* ADD NEW FOLDER LIST COLUMN */}
          <div className="w-72 shrink-0">
            {isAddingNewFolder ? (
              <form 
                onSubmit={handleCreateFolderSubmit} 
                className="bg-[#121820] border border-cyan-500/40 rounded-2xl p-4 shadow-xl space-y-3"
              >
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={14} /> Nova Lista / Pasta
                </div>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Nome da lista..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-100 outline-none focus:border-cyan-500/50"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="flex-1 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                  >
                    Adicionar Lista
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewFolder(false)}
                    className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X size={16} />
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsAddingNewFolder(true)}
                className="w-full py-4 bg-[#121820]/60 hover:bg-[#121820] border border-dashed border-white/10 hover:border-cyan-500/50 rounded-2xl text-gray-400 hover:text-cyan-400 font-bold text-sm flex items-center justify-center gap-2 transition-all group"
              >
                <Plus size={18} className="group-hover:scale-110 transition-transform" />
                <span>Adicionar Nova Lista</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* EXPANDED ACCOUNT MODAL DETAIL */}
      {selectedAccount && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedAccountId(null)}
        >
          <div 
            className="max-w-2xl w-full max-h-[92vh] overflow-y-auto relative animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedAccountId(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-black text-gray-300 hover:text-white rounded-full border border-white/10 transition-all shadow-xl"
              title="Fechar detalhe"
            >
              <X size={18} />
            </button>

            <AccountCard
              account={selectedAccount}
              folders={folders}
              permanentTags={permanentTags}
              onDelete={(id) => {
                onDeleteAccount(id);
                setSelectedAccountId(null);
              }}
              onAddTag={onAddTag}
              onRemoveTag={onRemoveTag}
              onReorderTags={onReorderTags}
              onMoveToFolder={onMoveToFolder}
              onEdit={onEditAccount}
              onRefresh={onRefreshAccount}
              onReorderAccounts={onReorderAccounts}
              onOpenPermanentTagsModal={onOpenPermanentTagsModal}
            />
          </div>
        </div>
      )}
    </div>
  );
};

/* COMPACT CARD COMPONENT FOR TRELLO BOARD WITH RIGHT-CLICK CONTEXT MENU */
interface CompactAccountCardProps {
  account: LoLAccount;
  folders: Folder[];
  onClick: () => void;
  onReorderAccounts?: (draggedId: string, targetId: string) => void;
  onMoveToFolder?: (accountId: string, folderId: string | null) => void;
  onDeleteAccount?: (id: string) => void;
}

const CompactAccountCard: React.FC<CompactAccountCardProps> = ({
  account,
  folders,
  onClick,
  onReorderAccounts,
  onMoveToFolder,
  onDeleteAccount,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  const folder = account.folderId ? folders.find(f => f.id === account.folderId) : null;
  const folderColor = folder ? FOLDER_COLOR_CLASSES[folder.color || 'cyan'] || FOLDER_COLOR_CLASSES.cyan : null;
  const hoverBorder = folderColor ? folderColor.hoverBorder : 'hover:border-cyan-500/40';

  const formattedTier = account.tier ? account.tier.toUpperCase() : 'UNRANKED';
  const tierStyle = TIER_COLORS[formattedTier] || TIER_COLORS.UNRANKED;
  const isRanked = account.tier && formattedTier !== 'UNRANKED';

  const totalGames = (account.wins || 0) + (account.losses || 0);
  const winRate = totalGames > 0 ? Math.round(((account.wins || 0) / totalGames) * 100) : null;

  const siteRegion = account.region || 'americas';
  const opggUrl = `https://op.gg/pt/lol/summoners/${siteRegion}/${encodeURIComponent(account.gameName)}-${encodeURIComponent(account.tagLine)}`;

  return (
    <>
      <div
        data-account-card="true"
        draggable
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData('accountId', account.id);
          e.dataTransfer.setData('type', 'account');
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          const draggedId = e.dataTransfer.getData('accountId');
          if (draggedId && draggedId !== account.id && onReorderAccounts) {
            onReorderAccounts(draggedId, account.id);
          }
        }}
        onClick={onClick}
        className={`bg-[#161C24] border ${
          isDragOver ? 'border-cyan-400 ring-2 ring-cyan-500/50 scale-[1.02]' : `border-white/10 ${hoverBorder}`
        } rounded-xl p-3 shadow-md hover:shadow-xl transition-all cursor-pointer group relative flex flex-col gap-2`}
      >
        {/* Top Header: Avatar + Nick/Tag + Rank/Elo Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Avatar Icon */}
            <div className="relative shrink-0">
              {account.profileIconUrl ? (
                <img 
                  src={account.profileIconUrl} 
                  alt={account.gameName}
                  className="w-10 h-10 rounded-lg object-cover border border-white/10 group-hover:border-cyan-400/50 transition-colors" 
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400/50 transition-colors">
                  <UserCircle2 size={22} />
                </div>
              )}
              {account.summonerLevel && (
                <span className="absolute -bottom-1 -right-1 bg-black/90 text-[9px] font-mono text-cyan-300 px-1 rounded border border-cyan-500/30">
                  {account.summonerLevel}
                </span>
              )}
            </div>

            {/* Nick and Tag */}
            <div className="overflow-hidden">
              <h4 className="font-bold text-xs text-gray-100 truncate group-hover:text-cyan-300 transition-colors leading-snug">
                {account.gameName}
              </h4>
              <p className="text-[11px] text-gray-400 font-mono truncate">
                #{account.tagLine}
              </p>
            </div>
          </div>

          {/* Prominent Elo Badge on Top Right */}
          <div className="shrink-0 flex flex-col items-end">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider font-mono shadow-sm ${tierStyle}`}>
              {isRanked ? `${account.tier} ${account.rank || ''}` : 'UNRANKED'}
            </span>
            {isRanked && account.leaguePoints !== undefined && (
              <span className="text-[9px] font-mono text-cyan-400 font-semibold mt-0.5">
                {account.leaguePoints} LP
              </span>
            )}
          </div>
        </div>

        {/* Winrate / Record & Tags Footer */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
          {/* Winrate pill if games exist */}
          {winRate !== null ? (
            <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
              <span className={winRate >= 50 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {winRate}% WR
              </span>
              <span className="text-[9px] text-gray-500">
                ({account.wins}V {account.losses}D)
              </span>
            </span>
          ) : (
            <span className="text-[9px] text-gray-600 font-mono">Sem partidas</span>
          )}

          {/* Tags */}
          {account.tags && account.tags.length > 0 && (
            <div className="flex items-center gap-1 max-w-[140px] overflow-hidden justify-end">
              {account.tags.slice(0, 2).map(tag => (
                <span key={tag.id} className={`text-[9px] font-medium px-1.5 py-0.5 rounded border truncate ${tag.color}`}>
                  {tag.text}
                </span>
              ))}
              {account.tags.length > 2 && (
                <span className="text-[9px] text-gray-500 font-mono shrink-0">
                  +{account.tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CLICK CONTEXT MENU */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => {
              setContextMenu(null);
              setShowCopyMenu(false);
              setShowFolderMenu(false);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
              setShowCopyMenu(false);
              setShowFolderMenu(false);
            }}
          />
          <div 
            className="fixed z-50 bg-[#161C24] border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[190px] animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {/* Copiar Menu */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCopyMenu(!showCopyMenu);
                  setShowFolderMenu(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-cyan-400 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Copy size={13} />
                  <span>Copiar Dados</span>
                </div>
                <ChevronRight size={13} className="text-gray-500" />
              </button>
              {showCopyMenu && (
                <div className="absolute left-[95%] top-0 ml-1 w-52 bg-[#161C24] border border-white/10 rounded-lg shadow-2xl py-1 z-50 flex flex-col">
                  {account.login && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(account.login || '');
                        setContextMenu(null);
                        setShowCopyMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-cyan-300 flex items-center justify-between"
                    >
                      <span>Copiar Login</span>
                      <span className="text-[10px] font-mono text-gray-500 truncate max-w-[80px]">{account.login}</span>
                    </button>
                  )}
                  {account.password && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(account.password || '');
                        setContextMenu(null);
                        setShowCopyMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-cyan-300 flex items-center justify-between"
                    >
                      <span>Copiar Senha</span>
                      <span className="text-[10px] font-mono text-gray-500">••••••••</span>
                    </button>
                  )}
                  {account.login && account.password && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${account.login}:${account.password}`);
                        setContextMenu(null);
                        setShowCopyMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-cyan-400 hover:bg-white/5 font-semibold"
                    >
                      Copiar Login:Senha
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${account.gameName}#${account.tagLine}`);
                      setContextMenu(null);
                      setShowCopyMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-cyan-300 flex items-center justify-between"
                  >
                    <span>Copiar Riot ID</span>
                    <span className="text-[10px] font-mono text-gray-500">{account.gameName}#{account.tagLine}</span>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(opggUrl);
                      setContextMenu(null);
                      setShowCopyMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-cyan-300"
                  >
                    Copiar Link OP.GG
                  </button>
                </div>
              )}
            </div>

            {/* Mover Para Pasta */}
            {onMoveToFolder && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFolderMenu(!showFolderMenu);
                    setShowCopyMenu(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-cyan-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderInput size={13} />
                    <span>Mover para pasta</span>
                  </div>
                  <ChevronRight size={13} className="text-gray-500" />
                </button>
                {showFolderMenu && (
                  <div className="absolute left-[95%] top-0 ml-1 w-48 bg-[#161C24] border border-white/10 rounded-lg shadow-2xl py-1 z-50">
                    <button
                      onClick={() => { onMoveToFolder(account.id, null); setContextMenu(null); setShowFolderMenu(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white"
                    >
                      Raiz (Remover da pasta)
                    </button>
                    {folders.map(f => (
                      <button
                        key={f.id}
                        onClick={() => { onMoveToFolder(account.id, f.id); setContextMenu(null); setShowFolderMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 hover:text-white truncate"
                      >
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="h-[1px] bg-white/5 my-1" />

            <button
              onClick={() => {
                setContextMenu(null);
                onClick();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-cyan-400 transition-colors"
            >
              <Maximize2 size={13} />
              <span>Ver Detalhes</span>
            </button>

            {onDeleteAccount && (
              <button
                onClick={() => {
                  setContextMenu(null);
                  onDeleteAccount(account.id);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-gray-300 hover:bg-white/5 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
                <span>Excluir Conta</span>
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
};
