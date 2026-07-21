import React, { useState } from 'react';
import { Trash2, UserCircle2, Eye, EyeOff, Copy, Check, FolderInput, Edit2, Shield, Star, Zap, Activity, Award, Flame, Target, Sparkles, Sword, Crown, Ghost, StickyNote, RefreshCw, AlertCircle, X } from 'lucide-react';
import { LoLAccount, Tag, Folder } from '../types';
import { TagEditor } from './TagEditor';

interface AccountCardProps {
  account: LoLAccount;
  folders: Folder[];
  permanentTags?: Tag[];
  onDelete: (id: string) => void;
  onAddTag: (accountId: string, tag: Omit<Tag, 'id'>) => void;
  onRemoveTag: (accountId: string, tagId: string) => void;
  onReorderTags: (accountId: string, fromTagId: string, toTagId: string) => void;
  onMoveToFolder: (accountId: string, folderId: string | null) => void;
  onEdit: (accountId: string, updates: Partial<LoLAccount>) => void;
  onRefresh?: (accountId: string) => Promise<{ success: boolean; error?: string }>;
  onReorderAccounts?: (draggedAccountId: string, targetAccountId: string) => void;
  onOpenPermanentTagsModal?: () => void;
}

const IconMapper: Record<string, React.ElementType> = {
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

const FOLDER_HOVER_BORDERS: Record<string, string> = {
  cyan: 'hover:border-cyan-500/50',
  blue: 'hover:border-blue-500/50',
  purple: 'hover:border-purple-500/50',
  fuchsia: 'hover:border-fuchsia-500/50',
  pink: 'hover:border-pink-500/50',
  red: 'hover:border-red-500/50',
  orange: 'hover:border-orange-500/50',
  yellow: 'hover:border-yellow-500/50',
  lime: 'hover:border-lime-500/50',
  green: 'hover:border-green-500/50',
  emerald: 'hover:border-emerald-500/50',
  teal: 'hover:border-teal-500/50',
  gray: 'hover:border-gray-500/50',
};

const FOLDER_TEXT_COLORS: Record<string, string> = {
  cyan: 'text-cyan-400',
  blue: 'text-blue-400',
  purple: 'text-purple-400',
  fuchsia: 'text-fuchsia-400',
  pink: 'text-pink-400',
  red: 'text-red-400',
  orange: 'text-orange-400',
  yellow: 'text-yellow-400',
  lime: 'text-lime-400',
  green: 'text-green-400',
  emerald: 'text-emerald-400',
  teal: 'text-teal-400',
  gray: 'text-gray-400',
};

export function AccountCard({ 
  account, 
  folders, 
  permanentTags = [], 
  onDelete, 
  onAddTag, 
  onRemoveTag, 
  onReorderTags, 
  onMoveToFolder, 
  onEdit, 
  onRefresh, 
  onReorderAccounts, 
  onOpenPermanentTagsModal 
}: AccountCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedLogin, setCopiedLogin] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [editData, setEditData] = useState({
    gameName: account.gameName,
    tagLine: account.tagLine,
    login: account.login || '',
    password: account.password || '',
    platform: account.platform || 'br1'
  });
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(account.notes || '');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);

  const folder = account.folderId ? folders.find(f => f.id === account.folderId) : null;
  const FolderIconComp = folder ? IconMapper[folder.icon || 'folder'] || FolderInput : null;
  const hoverBorder = folder ? FOLDER_HOVER_BORDERS[folder.color || 'cyan'] || 'hover:border-cyan-500/50' : 'hover:border-cyan-500/50';
  const folderTextColor = folder ? FOLDER_TEXT_COLORS[folder.color || 'cyan'] || 'text-cyan-400' : 'text-cyan-400';

  const nickTag = `${account.gameName}-${account.tagLine}`;
  const platform = account.platform?.toLowerCase() || 'br1';

  const getSiteRegion = (plat: string) => {
    const map: Record<string, string> = {
      'br1': 'br',
      'na1': 'na',
      'euw1': 'euw',
      'eun1': 'eune',
      'kr': 'kr',
      'la1': 'lan',
      'la2': 'las',
      'ru': 'ru',
      'tr1': 'tr'
    };
    return map[plat] || plat;
  };
  const siteRegion = getSiteRegion(platform);

  const links = {
    opgg: `https://op.gg/pt/lol/summoners/${siteRegion}/${nickTag}`,
    porofessor: `https://porofessor.gg/live/${siteRegion}/${nickTag}`,
    ugg: `https://u.gg/lol/profile/${platform}/${nickTag.toLowerCase()}/overview`,
    log: `https://www.leagueofgraphs.com/summoner/${siteRegion}/${nickTag}`,
  };

  const copyToClipboard = (text: string, isLogin: boolean) => {
    navigator.clipboard.writeText(text);
    if (isLogin) {
      setCopiedLogin(true);
      setTimeout(() => setCopiedLogin(false), 2000);
    } else {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  };

  const handleTriggerRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    setErrorMessage(null);
    setSuccessNotice(false);

    try {
      const result = await onRefresh(account.id);
      if (result && !result.success) {
        setErrorMessage(result.error || 'Não foi possível buscar as estatísticas da conta.');
      } else {
        setSuccessNotice(true);
        setTimeout(() => setSuccessNotice(false), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado de comunicação.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveEdit = () => {
    const updates: Partial<LoLAccount> = {
      gameName: editData.gameName.trim(),
      tagLine: editData.tagLine.trim().replace('#', ''),
      login: editData.login.trim() || undefined,
      password: editData.password || undefined,
      platform: editData.platform
    };
    onEdit(account.id, updates);
    setIsEditing(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  if (isEditing) {
    return (
      <div className="bg-[#161C24] border border-cyan-500/50 rounded-2xl p-5 shadow-xl flex flex-col gap-4 relative">
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <input type="text" value={editData.gameName} onChange={e => setEditData({...editData, gameName: e.target.value})} placeholder="Nome" className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-gray-100 outline-none focus:border-cyan-500/50" />
            <span className="text-gray-500 self-center">#</span>
            <input type="text" value={editData.tagLine} onChange={e => setEditData({...editData, tagLine: e.target.value})} placeholder="Tag" className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-gray-100 outline-none focus:border-cyan-500/50" />
          </div>
          
          <select value={editData.platform} onChange={e => setEditData({...editData, platform: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-gray-100 outline-none focus:border-cyan-500/50">
            <option value="br1">BR1</option>
            <option value="na1">NA1</option>
            <option value="euw1">EUW1</option>
            <option value="kr">KR</option>
            <option value="la1">LA1</option>
            <option value="la2">LA2</option>
          </select>

          <input type="text" value={editData.login} onChange={e => setEditData({...editData, login: e.target.value})} placeholder="Login" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-gray-100 outline-none focus:border-cyan-500/50" />
          <input type="text" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} placeholder="Senha" className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-gray-100 outline-none focus:border-cyan-500/50" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition-colors">Cancelar</button>
          <button onClick={handleSaveEdit} className="px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors">Salvar</button>
        </div>
      </div>
    );
  }

  const isRanked = account.tier && account.tier.toUpperCase() !== 'UNRANKED';
  const totalGames = (account.wins || 0) + (account.losses || 0);
  const winRate = totalGames > 0 ? Math.round(((account.wins || 0) / totalGames) * 100) : 0;

  return (
    <>
      {contextMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setContextMenu(null);
            setShowFolderMenu(false);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu(null);
            setShowFolderMenu(false);
          }}
        />
      )}
      
      {contextMenu && (
        <div 
          className="fixed z-50 bg-[#161C24] border border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[180px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {onRefresh && (
            <button
              onClick={() => {
                setContextMenu(null);
                handleTriggerRefresh();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-emerald-400 transition-colors disabled:opacity-50"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              <span>Atualizar Dados</span>
            </button>
          )}

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFolderMenu(!showFolderMenu);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-cyan-400 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderInput size={14} />
                <span>Mover para pasta</span>
              </div>
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
          
          <button
            onClick={() => {
              setShowNotes(true);
              setNotesDraft(account.notes || '');
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-yellow-400 transition-colors"
          >
            <StickyNote size={14} />
            <span>{account.notes ? 'Editar Anotações' : 'Adicionar Anotação'}</span>
          </button>

          {account.notes && (
            <button
              onClick={() => {
                onEdit(account.id, { notes: '' });
                setNotesDraft('');
                setShowNotes(false);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
              <span>Remover Anotação</span>
            </button>
          )}

          <div className="h-[1px] bg-white/5 my-1" />

          <button
            onClick={() => {
              setIsEditing(true);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-cyan-400 transition-colors"
          >
            <Edit2 size={14} />
            <span>Editar Conta</span>
          </button>

          <button
            onClick={() => {
              setContextMenu(null);
              setShowDeleteConfirm(true);
            }}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
            <span>Excluir Conta</span>
          </button>
        </div>
      )}

      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" 
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
          }}
        >
          <div 
            className="bg-[#161C24] border border-red-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 shrink-0">
                <Trash2 size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-100">Excluir Conta</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Tem certeza que deseja excluir esta conta do gerenciador?
                </p>
              </div>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 flex items-center gap-3">
              {account.profileIconUrl ? (
                <img src={account.profileIconUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400">
                  <UserCircle2 size={24} />
                </div>
              )}
              <div className="overflow-hidden">
                <div className="font-bold text-sm text-gray-100 truncate">
                  {account.gameName} <span className="text-gray-500 font-normal">#{account.tagLine}</span>
                </div>
                <div className="text-[11px] text-gray-400 flex items-center gap-2 mt-0.5">
                  <span className="uppercase font-semibold text-cyan-400">{account.platform}</span>
                  {account.tier && (
                    <>
                      <span>•</span>
                      <span>{account.tier} {account.rank}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300">
              ⚠️ Esta ação removerá a conta permanentemente da sua lista.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(account.id);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2"
              >
                <Trash2 size={16} />
                <span>Excluir Conta</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div 
        className={`bg-[#161C24] border ${isDragOver ? 'border-cyan-400 ring-2 ring-cyan-500/50 scale-[1.01]' : 'border-white/5'} rounded-2xl p-5 ${hoverBorder} transition-all shadow-xl flex flex-col gap-4 cursor-grab active:cursor-grabbing relative group`}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('accountId', account.id);
          e.dataTransfer.setData('type', 'account');
          e.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer.types.includes('type') || e.dataTransfer.types.includes('accountid')) {
            e.dataTransfer.dropEffect = 'move';
            if (!isDragOver) setIsDragOver(true);
          }
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const type = e.dataTransfer.getData('type');
          if (type === 'account') {
            const draggedId = e.dataTransfer.getData('accountId');
            if (draggedId && draggedId !== account.id && onReorderAccounts) {
              onReorderAccounts(draggedId, account.id);
            }
          }
        }}
        onContextMenu={handleContextMenu}
      >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {account.profileIconUrl ? (
              <img
                src={account.profileIconUrl}
                alt="Profile"
                className="w-16 h-16 rounded-xl border-2 border-cyan-500/30 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#2A3441] border-2 border-cyan-500/30 flex items-center justify-center text-gray-500">
                <UserCircle2 size={32} />
              </div>
            )}
            {account.summonerLevel && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 min-w-max px-1 bg-cyan-500 rounded-full border-2 border-[#161C24] flex items-center justify-center text-[10px] font-bold text-black">
                {account.summonerLevel}
              </div>
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-100 leading-tight">
              {account.gameName}
              <span className="text-gray-500 text-sm font-medium ml-1">#{account.tagLine}</span>
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-[10px] text-gray-400 bg-black/40 px-2 py-0.5 rounded border border-white/10 uppercase tracking-widest font-semibold">
                {account.platform}
              </div>
              {folder && FolderIconComp && (
                <div className={`text-[10px] font-bold ${folderTextColor} bg-black/40 px-2 py-0.5 rounded border border-white/10 flex items-center gap-1 uppercase tracking-widest`}>
                  <FolderIconComp size={10} /> {folder.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={handleTriggerRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed group/btn shrink-0"
            title="Atualizar estatísticas e ranked da Riot API"
          >
            <RefreshCw size={16} className={`transition-transform ${isRefreshing ? 'animate-spin text-cyan-400' : 'group-hover/btn:rotate-180'}`} />
          </button>
        )}
      </div>

      {isRefreshing && (
        <div className="flex items-center gap-2 p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 animate-pulse">
          <RefreshCw size={14} className="animate-spin text-cyan-400 shrink-0" />
          <span>Consultando Riot API...</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-start justify-between gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-300">
          <div className="flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 text-red-400 mt-0.5" />
            <div>
              <span className="font-semibold block text-red-400">Erro na Atualização:</span>
              <span className="text-red-300/90">{errorMessage}</span>
            </div>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200 p-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {successNotice && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
          <Check size={14} className="text-emerald-400 shrink-0" />
          <span>Dados atualizados com sucesso!</span>
        </div>
      )}

      <div className="flex items-center gap-2 p-2.5 bg-white/5 rounded-2xl border border-white/10 shadow-[inset_0_1px_8px_rgba(255,255,255,0.05)] backdrop-blur-lg">
         <div className="text-[7px] font-black text-gray-500 uppercase tracking-tighter w-8 leading-none mr-1">Links Rápidos</div>
         <div className="flex flex-1 justify-around items-center">
            <a href={links.opgg} target="_blank" rel="noreferrer" title="OP.GG" className="hover:scale-110 transition-transform active:scale-95 grayscale hover:grayscale-0">
              <img src="https://op.gg/assets/images/about/opgg_app.png" className="w-7 h-7 rounded-lg shadow-sm" alt="OP.GG" />
            </a>
            <a href={links.porofessor} target="_blank" rel="noreferrer" title="Porofessor" className="hover:scale-110 transition-transform active:scale-95 grayscale hover:grayscale-0">
              <img src="https://cdn2.porofessor.gg/img/porofessor-200.png" className="w-7 h-7 rounded-lg shadow-sm" alt="Porofessor" />
            </a>
            <a href={links.ugg} target="_blank" rel="noreferrer" title="U.GG" className="hover:scale-110 transition-transform active:scale-95 grayscale hover:grayscale-0">
              <img src="https://pbs.twimg.com/profile_images/1841544879639560192/6isnQg8G.jpg" className="w-7 h-7 rounded-lg shadow-sm" alt="U.GG" />
            </a>
            <a href={links.log} target="_blank" rel="noreferrer" title="League of Graphs" className="hover:scale-110 transition-transform active:scale-95 grayscale hover:grayscale-0">
              <img src="https://i.postimg.cc/YqpK2skW/league-of-graphs.webp" className="w-7 h-7 rounded-lg shadow-sm" alt="League of Graphs" />
            </a>
         </div>
      </div>

      {isRanked ? (
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-0.5">Ranked Solo</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-100">{account.tier} {account.rank}</span>
              <span className="text-xs text-cyan-300 font-medium">{account.leaguePoints ?? 0} PDL</span>
            </div>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">
              {account.wins ?? 0}V {account.losses ?? 0}D
            </span>
            <span className={`text-xs font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
              {winRate}% Win Rate
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-0.5">Ranked Solo</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-400">Unranked</span>
            </div>
          </div>
          {totalGames > 0 && (
            <div className="text-xs text-gray-500">
              {account.wins}V {account.losses}D
            </div>
          )}
        </div>
      )}

      {(account.login || account.password) && (
        <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col gap-2 text-sm">
           <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mb-1">Credenciais</div>
           <div className="flex items-center justify-between bg-black/40 border border-white/5 rounded pl-2 pr-1 py-1 group">
             <div className="flex items-center gap-1 font-mono text-xs truncate">
               <span className="text-gray-300">{account.login || ''}</span>
               <span className="text-gray-500">:</span>
               <span className="text-gray-400">{showPassword ? (account.password || '') : '••••••••'}</span>
             </div>
             <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-cyan-400 p-1">
                 {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
               </button>
               <button onClick={() => copyToClipboard(`${account.login || ''}:${account.password || ''}`, true)} className="text-gray-500 hover:text-cyan-400 p-1" title="Copiar login:senha">
                 {copiedLogin ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
               </button>
             </div>
           </div>
        </div>
      )}

      {(showNotes || account.notes) && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-yellow-500/70 uppercase tracking-widest font-bold flex items-center gap-1.5">
              <StickyNote size={12} className="text-yellow-500" />
              Anotações
            </span>

            <div className="flex items-center gap-1.5">
              {showNotes ? (
                <>
                  {notesDraft !== (account.notes || '') && (
                    <button 
                      onClick={() => {
                        onEdit(account.id, { notes: notesDraft.trim() });
                        setShowNotes(false);
                      }}
                      className="text-[10px] bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-2 py-0.5 rounded font-bold transition-colors"
                    >
                      Salvar
                    </button>
                  )}
                  {(account.notes || notesDraft) && (
                    <button
                      onClick={() => {
                        onEdit(account.id, { notes: '' });
                        setNotesDraft('');
                        setShowNotes(false);
                      }}
                      className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded transition-colors flex items-center gap-1"
                      title="Remover anotação"
                    >
                      <Trash2 size={12} />
                      <span className="sr-only">Remover</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowNotes(false);
                      setNotesDraft(account.notes || '');
                    }}
                    className="text-gray-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
                    title="Fechar edição"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setShowNotes(true);
                      setNotesDraft(account.notes || '');
                    }}
                    className="text-[10px] text-yellow-500/80 hover:text-yellow-400 hover:bg-yellow-500/10 px-1.5 py-0.5 rounded font-semibold transition-colors flex items-center gap-1"
                  >
                    <Edit2 size={10} />
                    Editar
                  </button>
                  <button
                    onClick={() => {
                      onEdit(account.id, { notes: '' });
                      setNotesDraft('');
                      setShowNotes(false);
                    }}
                    className="text-gray-400 hover:text-red-400 hover:bg-red-500/10 p-1 rounded transition-colors"
                    title="Remover anotação"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>

          {showNotes ? (
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Escreva suas anotações aqui..."
              className="w-full bg-black/40 border border-yellow-500/20 rounded-lg p-2 text-sm text-gray-200 outline-none focus:border-yellow-500/50 min-h-[60px] resize-y"
              autoFocus
            />
          ) : (
            <div 
              className="text-sm text-gray-300 whitespace-pre-wrap cursor-pointer hover:bg-black/20 p-1.5 -m-0.5 rounded-lg transition-colors"
              onClick={() => {
                setShowNotes(true);
                setNotesDraft(account.notes || '');
              }}
              title="Clique para editar"
            >
              {account.notes}
            </div>
          )}
        </div>
      )}

      <div className="flex-1 relative border-t border-white/5 pt-3 mt-1">
        <div className="text-[10px] uppercase text-gray-500 mb-2 tracking-wide">Tags</div>
        <div className="flex flex-wrap gap-1.5 items-center">
          {account.tags.map(tag => {
            const IconComp = tag.icon ? IconMapper[tag.icon] : null;
            return (
            <span
              key={tag.id}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium cursor-grab active:cursor-grabbing ${tag.color}`}
              draggable
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData('tagId', tag.id);
                e.dataTransfer.setData('accountId', account.id);
                e.dataTransfer.setData('type', 'tag');
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const fromTagId = e.dataTransfer.getData('tagId');
                const fromAccountId = e.dataTransfer.getData('accountId');
                if (fromAccountId === account.id && fromTagId !== tag.id) {
                  onReorderTags(account.id, fromTagId, tag.id);
                }
              }}
            >
              {IconComp && <IconComp size={10} />}
              {tag.text}
              <button
                onClick={() => onRemoveTag(account.id, tag.id)}
                className="hover:opacity-75 focus:outline-none opacity-50 hover:opacity-100 transition-opacity"
                title="Remover tag"
              >
                <Trash2 size={10} />
              </button>
            </span>
          )})}
          <div className="relative">
            <TagEditor 
              accountTags={account.tags}
              permanentTags={permanentTags}
              onAddTag={(tag) => onAddTag(account.id, tag)} 
              onOpenPermanentTagsModal={onOpenPermanentTagsModal}
            />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
