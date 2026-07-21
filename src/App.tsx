import React, { useState, useEffect, useRef } from 'react';
import { Search, Gamepad2, Inbox, Folder as FolderIcon, Plus, ChevronRight, Hash, Trash2, Edit2, Shield, Star, Zap, Activity, Award, Flame, Target, Sparkles, Sword, Crown, Ghost, Upload, X, RefreshCw, AlertTriangle, Database, LogIn } from 'lucide-react';
import { read, utils } from 'xlsx';
import { LoLAccount, Tag, Folder } from './types';
import { AccountCard } from './components/AccountCard';
import { AddAccountForm } from './components/AddAccountForm';
import { SupabaseAuthModal } from './components/SupabaseAuthModal';
import { LoginScreen } from './components/LoginScreen';
import { supabase, isSupabaseConfigured, dbToAppAccount, dbToAppFolder, appToDBAccount, appToDBFolder, getUserProfile, signOut } from './lib/supabase';

export const FOLDER_COLORS = [
  { id: 'cyan', classes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', bg: 'bg-cyan-500', border: 'border-cyan-500/50' },
  { id: 'blue', classes: 'bg-blue-500/10 text-blue-400 border-blue-500/20', bg: 'bg-blue-500', border: 'border-blue-500/50' },
  { id: 'purple', classes: 'bg-purple-500/10 text-purple-400 border-purple-500/20', bg: 'bg-purple-500', border: 'border-purple-500/50' },
  { id: 'fuchsia', classes: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20', bg: 'bg-fuchsia-500', border: 'border-fuchsia-500/50' },
  { id: 'pink', classes: 'bg-pink-500/10 text-pink-400 border-pink-500/20', bg: 'bg-pink-500', border: 'border-pink-500/50' },
  { id: 'red', classes: 'bg-red-500/10 text-red-400 border-red-500/20', bg: 'bg-red-500', border: 'border-red-500/50' },
  { id: 'orange', classes: 'bg-orange-500/10 text-orange-400 border-orange-500/20', bg: 'bg-orange-500', border: 'border-orange-500/50' },
  { id: 'yellow', classes: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', bg: 'bg-yellow-500', border: 'border-yellow-500/50' },
  { id: 'lime', classes: 'bg-lime-500/10 text-lime-400 border-lime-500/20', bg: 'bg-lime-500', border: 'border-lime-500/50' },
  { id: 'green', classes: 'bg-green-500/10 text-green-400 border-green-500/20', bg: 'bg-green-500', border: 'border-green-500/50' },
  { id: 'emerald', classes: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', bg: 'bg-emerald-500', border: 'border-emerald-500/50' },
  { id: 'teal', classes: 'bg-teal-500/10 text-teal-400 border-teal-500/20', bg: 'bg-teal-500', border: 'border-teal-500/50' },
  { id: 'gray', classes: 'bg-gray-500/10 text-gray-400 border-gray-500/20', bg: 'bg-gray-500', border: 'border-gray-500/50' }
];

export const PRESET_ICONS = [
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

export const IconMapper: Record<string, React.ElementType> = {
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

export default function App() {
  const [accounts, setAccounts] = useState<LoLAccount[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editFolderColor, setEditFolderColor] = useState('cyan');
  const [editFolderIcon, setEditFolderIcon] = useState('folder');
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [showRefreshAllConfirm, setShowRefreshAllConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [pendingImports, setPendingImports] = useState<LoLAccount[]>([]);
  const [authUser, setAuthUser] = useState<any>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase Auth and Data Sync Effect
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user) {
        loadCloudData(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setAuthUser(user);
      if (user) {
        loadCloudData(user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCloudData = async (userId: string) => {
    if (!supabase) return;
    try {
      const { data: dbFolders, error: folderErr } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userId);

      if (!folderErr && dbFolders && dbFolders.length > 0) {
        setFolders(dbFolders.map(dbToAppFolder));
      }

      const { data: dbAccounts, error: accErr } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!accErr && dbAccounts && dbAccounts.length > 0) {
        setAccounts(dbAccounts.map(dbToAppAccount));
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Supabase:', err);
    }
  };

  const syncAccountToCloud = async (account: LoLAccount) => {
    if (!supabase || !authUser) return;
    try {
      await supabase.from('accounts').upsert(appToDBAccount(account, authUser.id));
    } catch (err) {
      console.error('Erro ao salvar conta no Supabase:', err);
    }
  };

  const deleteAccountFromCloud = async (accountId: string) => {
    if (!supabase || !authUser) return;
    try {
      await supabase.from('accounts').delete().eq('id', accountId);
    } catch (err) {
      console.error('Erro ao remover conta do Supabase:', err);
    }
  };

  const syncFolderToCloud = async (folder: Folder) => {
    if (!supabase || !authUser) return;
    try {
      await supabase.from('folders').upsert(appToDBFolder(folder, authUser.id));
    } catch (err) {
      console.error('Erro ao salvar pasta no Supabase:', err);
    }
  };

  const deleteFolderFromCloud = async (folderId: string) => {
    if (!supabase || !authUser) return;
    try {
      await supabase.from('folders').delete().eq('id', folderId);
    } catch (err) {
      console.error('Erro ao remover pasta do Supabase:', err);
    }
  };

  // Load initial data (LocalStorage fallback)
  useEffect(() => {
    const savedAccounts = localStorage.getItem('lol-accounts');
    if (savedAccounts) {
      try {
        setAccounts(JSON.parse(savedAccounts));
      } catch (e) {
        console.error('Error parsing accounts:', e);
      }
    }
    const savedFolders = localStorage.getItem('lol-folders');
    if (savedFolders) {
      try {
        setFolders(JSON.parse(savedFolders));
      } catch (e) {}
    }
  }, []);

  // Save on change to LocalStorage
  useEffect(() => {
    localStorage.setItem('lol-accounts', JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem('lol-folders', JSON.stringify(folders));
  }, [folders]);

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const newFolder: Folder = { id: crypto.randomUUID(), name: newFolderName.trim() };
    setFolders([...folders, newFolder]);
    syncFolderToCloud(newFolder);
    setNewFolderName('');
    setIsAddingFolder(false);
  };

  const handleMoveToFolder = (accountId: string, folderId: string | null) => {
    setAccounts(prev => {
      const updated = prev.map(acc => {
        if (acc.id === accountId) {
          const accUpdated = { ...acc, folderId };
          syncAccountToCloud(accUpdated);
          return accUpdated;
        }
        return acc;
      });
      return updated;
    });
  };

  const handleAddAccount = (data: Omit<LoLAccount, 'id' | 'createdAt' | 'tags'>) => {
    const newAccount: LoLAccount = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      tags: []
    };
    setAccounts(prev => [newAccount, ...prev]);
    syncAccountToCloud(newAccount);
  };

  const handleDeleteAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
    deleteAccountFromCloud(id);
  };

  const handleAddTag = (accountId: string, tagData: Omit<Tag, 'id'>) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        const newTag: Tag = { ...tagData, id: crypto.randomUUID() };
        const updated = { ...acc, tags: [...acc.tags, newTag] };
        syncAccountToCloud(updated);
        return updated;
      }
      return acc;
    }));
  };

  const handleRemoveTag = (accountId: string, tagId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        const updated = { ...acc, tags: acc.tags.filter(t => t.id !== tagId) };
        syncAccountToCloud(updated);
        return updated;
      }
      return acc;
    }));
  };

  const handleReorderTags = (accountId: string, fromTagId: string, toTagId: string) => {
    setAccounts(prev => prev.map(acc => {
      if (acc.id === accountId) {
        const fromIndex = acc.tags.findIndex(t => t.id === fromTagId);
        const toIndex = acc.tags.findIndex(t => t.id === toTagId);
        if (fromIndex === -1 || toIndex === -1) return acc;
        
        const newTags = [...acc.tags];
        const [movedTag] = newTags.splice(fromIndex, 1);
        newTags.splice(toIndex, 0, movedTag);
        const updated = { ...acc, tags: newTags };
        syncAccountToCloud(updated);
        return updated;
      }
      return acc;
    }));
  };


  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const handleRefreshAccount = async (accountId: string): Promise<{ success: boolean; error?: string }> => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return { success: false, error: 'Conta não encontrada localmente.' };
    
    try {
      const res = await fetch(`/api/riot/account?gameName=${encodeURIComponent(acc.gameName)}&tagLine=${encodeURIComponent(acc.tagLine)}&region=${acc.region || 'americas'}&platform=${acc.platform || 'br1'}`);
      
      const contentType = res.headers.get('content-type');
      if (!res.ok || !contentType || !contentType.includes('application/json')) {
        return { success: false, error: 'Servidor da Riot API indisponível no momento.' };
      }

      const data = await res.json();
      
      setAccounts(prev => prev.map(a => {
        if (a.id === accountId) {
          const updated = {
            ...a,
            profileIconUrl: data.profileIconUrl || a.profileIconUrl,
            summonerLevel: data.summonerLevel ?? a.summonerLevel,
            tier: data.tier,
            rank: data.rank,
            leaguePoints: data.leaguePoints,
            wins: data.wins,
            losses: data.losses
          };
          syncAccountToCloud(updated);
          return updated;
        }
        return a;
      }));

      if (data.isMock && data.warning) {
        return { success: true, error: data.warning };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Failed to refresh account', err);
      return { success: false, error: err.message || 'Erro ao conectar ao servidor de dados.' };
    }
  };

  const handleRefreshAll = async () => {
    if (isRefreshingAll || accounts.length === 0) return;
    setIsRefreshingAll(true);
    for (const acc of accounts) {
      await handleRefreshAccount(acc.id);
    }
    setIsRefreshingAll(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = utils.sheet_to_json<any>(worksheet);

      const newAccounts: LoLAccount[] = [];

      for (const row of jsonData) {
        const findValue = (keys: string[]) => {
          for (const key of Object.keys(row)) {
             if (keys.some(k => key.toLowerCase().includes(k))) {
               return row[key]?.toString();
             }
          }
          return undefined;
        };

        const nickRaw = findValue(['nick', 'name', 'jogo', 'conta']);
        const login = findValue(['login', 'user']);
        const password = findValue(['senha', 'pass', 'pw']);

        if (nickRaw || login) {
           let gameName = nickRaw || 'Imported Account';
           let tagLine = 'BR1';
           
           if (gameName.includes('#')) {
             const parts = gameName.split('#');
             gameName = parts[0];
             tagLine = parts[1] || 'BR1';
           }

           newAccounts.push({
              id: crypto.randomUUID(),
              gameName: gameName.trim(),
              tagLine: tagLine.trim(),
              login: login?.trim(),
              password: password?.trim(),
              region: 'americas',
              platform: 'br1',
              tags: [],
              createdAt: Date.now()
           });
        }
      }

      if (newAccounts.length > 0) {
        setPendingImports(newAccounts);
      }
    } catch (err) {
       console.error("Error importing file", err);
    }
    
    if (e.target) {
      e.target.value = '';
    }
  };

  const filteredAccounts = accounts.filter(acc => {
    if (activeFolderId && acc.folderId !== activeFolderId) return false;
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      acc.gameName.toLowerCase().includes(query) ||
      acc.tagLine.toLowerCase().includes(query) ||
      acc.tags.some(t => t.text.toLowerCase().includes(query))
    );
  });

  // If user is not authenticated and has not chosen guest mode, render full-screen Login view
  if (!authUser && !isGuestMode) {
    return <LoginScreen onGuestLogin={() => setIsGuestMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-[#0A0E13] text-gray-100 font-sans selection:bg-cyan-500/30 flex flex-col">
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-[#0F141B] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
            <Gamepad2 size={18} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            LoL<span className="text-cyan-400">Manager</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 hidden sm:flex">
          <input 
            type="file" 
            accept=".ods,.xlsx,.xls,.csv" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#161C24] border border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 rounded-lg text-sm text-gray-400 transition-colors"
          >
            <Upload size={16} />
            <span>Importar</span>
          </button>

          <button
            onClick={() => setShowRefreshAllConfirm(true)}
            disabled={isRefreshingAll || accounts.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#161C24] border border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 rounded-lg text-sm text-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Atualizar dados de todas as contas cadastradas"
          >
            <RefreshCw size={16} className={isRefreshingAll ? 'animate-spin text-cyan-400' : ''} />
            <span>{isRefreshingAll ? 'Atualizando...' : 'Atualizar Todas'}</span>
          </button>
          
          {/* Badge do Perfil do Usuário (Discord / Supabase) */}
          {authUser ? (() => {
            const profile = getUserProfile(authUser);
            return (
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2.5 px-3 py-1.5 bg-[#161C24] border border-cyan-500/30 hover:border-cyan-400 rounded-xl text-sm transition-all group shadow-md"
                >
                  {profile?.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt={profile.name} 
                      className="w-7 h-7 rounded-full object-cover border-2 border-cyan-400/80 group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-300 font-bold text-xs">
                      {profile?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-gray-100 group-hover:text-cyan-300 transition-colors max-w-[120px] truncate leading-tight">
                      {profile?.name}
                    </span>
                    <span className="text-[10px] text-cyan-400/80 flex items-center gap-1 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Discord
                    </span>
                  </div>
                  <ChevronRight size={14} className={`text-gray-400 transition-transform ${showProfileMenu ? 'rotate-90' : ''}`} />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-64 bg-[#161C24] border border-white/10 rounded-2xl shadow-2xl z-50 p-3 space-y-3 animate-in fade-in duration-150"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                      {profile?.avatar ? (
                        <img src={profile.avatar} alt={profile.name} className="w-10 h-10 rounded-full border border-cyan-400/60 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold text-sm border border-cyan-500/30">
                          {profile?.name?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="font-bold text-sm text-white truncate">{profile?.name}</div>
                        {profile?.email && (
                          <div className="text-[11px] text-gray-400 truncate">{profile.email}</div>
                        )}
                        <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Conectado via Discord
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-white/5">
                      <button
                        onClick={() => {
                          setShowAuthModal(true);
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <Database size={14} className="text-cyan-400" />
                        <span>Ver Configuração do Supabase</span>
                      </button>

                      <button
                        onClick={async () => {
                          setShowProfileMenu(false);
                          await signOut();
                          setAuthUser(null);
                          setIsGuestMode(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                        <span>Sair da Conta (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })() : (
            <button
              onClick={() => setIsGuestMode(false)}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-xs text-white font-bold transition-all shadow-md shadow-[#5865F2]/20"
              title="Logar com o Discord"
            >
              <LogIn size={14} />
              <span>Logar com o Discord</span>
            </button>
          )}

          <div className="flex items-center bg-black/40 border border-white/10 rounded-full px-4 py-1.5 w-80">
            <Search className="w-4 h-4 text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search nicknames, ranks, or tags..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-600 text-gray-100"
            />
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar Folders */}
        <aside className="w-64 border-r border-white/5 bg-[#0A0E13] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Organização</h2>
            
            <button
              onClick={() => setActiveFolderId(null)}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => {
                e.preventDefault();
                const type = e.dataTransfer.getData('type');
                if (type !== 'account') return;
                const accountId = e.dataTransfer.getData('accountId');
                if (accountId) handleMoveToFolder(accountId, null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors mb-2 ${
                activeFolderId === null ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <Hash size={16} />
                <span className="font-medium">Todas as Contas</span>
              </div>
              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full">{accounts.length}</span>
            </button>

            <div className="space-y-1 mb-4">
              {folders.map(folder => {
                const count = accounts.filter(a => a.folderId === folder.id).length;
                const folderColor = FOLDER_COLORS.find(c => c.id === (folder.color || 'cyan')) || FOLDER_COLORS[0];
                const IconComp = IconMapper[folder.icon || 'folder'] || FolderIcon;
                
                if (editingFolderId === folder.id) {
                  return (
                    <div key={folder.id} className="bg-black/20 border border-white/10 rounded-lg p-2 flex flex-col gap-2">
                      <input
                        type="text"
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sm text-gray-100 outline-none w-full"
                      />
                      <div className="flex flex-wrap gap-1">
                        {FOLDER_COLORS.map(c => (
                          <button
                            key={c.id}
                            onClick={() => setEditFolderColor(c.id)}
                            className={`w-4 h-4 rounded-full ${c.bg} ${editFolderColor === c.id ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0A0E13]' : ''}`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_ICONS.map(pi => {
                          const PIcon = pi.icon;
                          return (
                            <button
                              key={pi.name}
                              onClick={() => setEditFolderIcon(pi.name)}
                              className={`p-1 rounded ${editFolderIcon === pi.name ? 'bg-white/20' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                              <PIcon size={14} />
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-end gap-2 mt-1">
                        <button onClick={() => setEditingFolderId(null)} className="text-xs text-gray-400 hover:text-white">Cancelar</button>
                        <button 
                          onClick={() => {
                            const updatedFolder: Folder = { ...folder, name: editFolderName, color: editFolderColor, icon: editFolderIcon };
                            setFolders(prev => prev.map(f => f.id === folder.id ? updatedFolder : f));
                            syncFolderToCloud(updatedFolder);
                            setEditingFolderId(null);
                          }} 
                          className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-2 py-1 rounded"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolderId(folder.id)}
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const type = e.dataTransfer.getData('type');
                      if (type !== 'account') return;
                      const accountId = e.dataTransfer.getData('accountId');
                      if (accountId) handleMoveToFolder(accountId, folder.id);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group ${
                      activeFolderId === folder.id ? folderColor.classes : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <IconComp size={16} className="shrink-0" />
                      <span className="font-medium truncate">{folder.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditFolderName(folder.name);
                          setEditFolderColor(folder.color || 'cyan');
                          setEditFolderIcon(folder.icon || 'folder');
                          setEditingFolderId(folder.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-cyan-400 transition-opacity"
                        title="Edit folder"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderToDelete(folder);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                        title="Excluir pasta"
                      >
                        <Trash2 size={12} />
                      </button>
                      <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full">{count}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {isAddingFolder ? (
              <form onSubmit={handleAddFolder} className="mt-2">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Nome da pasta..."
                  className="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                  autoFocus
                  onBlur={() => { if (!newFolderName.trim()) setIsAddingFolder(false); }}
                />
              </form>
            ) : (
              <button
                onClick={() => setIsAddingFolder(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors border border-dashed border-white/10"
              >
                <Plus size={16} />
                <span className="font-medium">Nova Pasta</span>
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">
          {/* Mobile Search - Only visible on small screens */}
          <div className="sm:hidden mb-6">
            <div className="flex items-center bg-black/40 border border-white/10 rounded-full px-4 py-1.5 w-full">
              <Search className="w-4 h-4 text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-600 text-gray-100"
              />
            </div>
          </div>

          {/* Quick Stats Header (Mock implementation to match sleek style) */}
          <header className="py-6 bg-gradient-to-b from-transparent to-transparent flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
            <div className="flex gap-8">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Total Accounts</p>
                <p className="text-2xl font-bold font-mono text-gray-100">{accounts.length}</p>
              </div>
              <div className="w-px h-10 bg-white/10"></div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Visible</p>
                <p className="text-2xl font-bold font-mono text-cyan-400">{filteredAccounts.length}</p>
              </div>
            </div>
          </header>

          {/* Add Account Section */}
          <section className="mb-8">
            <AddAccountForm onAdd={handleAddAccount} />
          </section>

          {/* Account Grid */}
          <section>
            {accounts.length === 0 ? (
              <div className="w-full h-32 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-600 transition-all">
                <div className="w-8 h-8 rounded-full border border-current flex items-center justify-center mb-2">
                  <span className="text-xl">+</span>
                </div>
                <span className="text-sm font-medium">Add your first account above</span>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="w-full h-32 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-600 transition-all">
                <span className="text-sm font-medium">Nenhum resultado para "{search}"</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAccounts.map(account => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    folders={folders}
                    onDelete={handleDeleteAccount}
                    onAddTag={handleAddTag}
                    onRemoveTag={handleRemoveTag}
                    onReorderTags={handleReorderTags}
                    onMoveToFolder={handleMoveToFolder}
                    onRefresh={handleRefreshAccount}
                    onEdit={(id, updates) => {
                      setAccounts(prev => prev.map(a => {
                        if (a.id === id) {
                          const updated = { ...a, ...updates };
                          syncAccountToCloud(updated);
                          return updated;
                        }
                        return a;
                      }));
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      </div>
      
      {pendingImports.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#161C24] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                <Upload size={20} className="text-cyan-400" />
                Revisar Contas Importadas ({pendingImports.length})
              </h2>
              <button onClick={() => setPendingImports([])} className="text-gray-500 hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex flex-col gap-3 flex-1">
              {pendingImports.map((acc, index) => (
                <div key={acc.id} className="bg-black/20 border border-white/5 rounded-lg p-3 flex gap-3 items-center">
                  <div className="text-gray-500 text-xs w-6 text-center">{index + 1}</div>
                  <input 
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-cyan-500/50"
                    value={acc.gameName}
                    onChange={e => setPendingImports(prev => prev.map(p => p.id === acc.id ? { ...p, gameName: e.target.value } : p))}
                    placeholder="Nome"
                  />
                  <span className="text-gray-500 text-sm">#</span>
                  <input 
                    className="w-20 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-cyan-500/50"
                    value={acc.tagLine}
                    onChange={e => setPendingImports(prev => prev.map(p => p.id === acc.id ? { ...p, tagLine: e.target.value } : p))}
                    placeholder="Tag"
                  />
                  <select
                    className="w-24 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-cyan-500/50"
                    value={acc.platform}
                    onChange={e => setPendingImports(prev => prev.map(p => p.id === acc.id ? { ...p, platform: e.target.value } : p))}
                  >
                    <option value="br1">BR1</option>
                    <option value="na1">NA1</option>
                    <option value="euw1">EUW1</option>
                    <option value="kr">KR</option>
                    <option value="la1">LA1</option>
                    <option value="la2">LA2</option>
                  </select>
                  <input 
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-cyan-500/50"
                    value={acc.login || ''}
                    onChange={e => setPendingImports(prev => prev.map(p => p.id === acc.id ? { ...p, login: e.target.value } : p))}
                    placeholder="Login"
                  />
                  <input 
                    className="flex-1 bg-black/40 border border-white/10 rounded px-2 py-1.5 text-sm text-gray-100 outline-none focus:border-cyan-500/50"
                    value={acc.password || ''}
                    onChange={e => setPendingImports(prev => prev.map(p => p.id === acc.id ? { ...p, password: e.target.value } : p))}
                    placeholder="Senha"
                  />
                  <button 
                    onClick={() => setPendingImports(prev => prev.filter(p => p.id !== acc.id))}
                    className="text-gray-500 hover:text-red-400 p-1.5"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-[#11171E] rounded-b-2xl">
              <button 
                onClick={() => setPendingImports([])}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  setAccounts(prev => [...pendingImports, ...prev]);
                  setPendingImports([]);
                }}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Salvar Contas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão de Pasta */}
      {folderToDelete && (() => {
        const accountsInFolder = accounts.filter(a => a.folderId === folderToDelete.id);
        const count = accountsInFolder.length;

        return (
          <div 
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setFolderToDelete(null)}
          >
            <div 
              className="bg-[#161C24] border border-white/10 rounded-2xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-5 relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400 shrink-0">
                    <FolderIcon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-100">Excluir Pasta</h3>
                    <p className="text-xs text-cyan-400 font-medium mt-0.5">
                      "{folderToDelete.name}" • {count} {count === 1 ? 'conta vinculada' : 'contas vinculadas'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setFolderToDelete(null)} 
                  className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
                >
                  <X size={18} />
                </button>
              </div>

              {count === 0 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    Esta pasta está vazia. Tem certeza que deseja excluí-la? Nenhuma conta será afetada.
                  </p>
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                    <button
                      onClick={() => setFolderToDelete(null)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
                        if (activeFolderId === folderToDelete.id) setActiveFolderId(null);
                        setFolderToDelete(null);
                      }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      <span>Excluir Pasta</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    A pasta <span className="font-semibold text-white">"{folderToDelete.name}"</span> contém <strong className="text-cyan-400">{count} {count === 1 ? 'conta' : 'contas'}</strong>. Como deseja proceder?
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        // Move accounts to root (folderId: null) and delete folder
                        setAccounts(prev => prev.map(a => {
                          if (a.folderId === folderToDelete.id) {
                            const updated = { ...a, folderId: null };
                            syncAccountToCloud(updated);
                            return updated;
                          }
                          return a;
                        }));
                        setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
                        deleteFolderFromCloud(folderToDelete.id);
                        if (activeFolderId === folderToDelete.id) setActiveFolderId(null);
                        setFolderToDelete(null);
                      }}
                      className="flex items-start gap-3 p-3.5 bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/40 rounded-xl transition-all text-left group"
                    >
                      <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <Hash size={18} />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-gray-100 block group-hover:text-cyan-300">
                          Mover contas para a Raiz (Todas as Contas)
                        </span>
                        <span className="text-xs text-gray-400 block mt-0.5">
                          A pasta é removida, mas as {count} {count === 1 ? 'conta continua salva' : 'contas continuam salvas'} em "Todas as Contas".
                        </span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        // Delete all accounts in folder and delete folder
                        accounts.filter(a => a.folderId === folderToDelete.id).forEach(a => deleteAccountFromCloud(a.id));
                        setAccounts(prev => prev.filter(a => a.folderId !== folderToDelete.id));
                        setFolders(prev => prev.filter(f => f.id !== folderToDelete.id));
                        deleteFolderFromCloud(folderToDelete.id);
                        if (activeFolderId === folderToDelete.id) setActiveFolderId(null);
                        setFolderToDelete(null);
                      }}
                      className="flex items-start gap-3 p-3.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/20 hover:border-red-500/50 rounded-xl transition-all text-left group"
                    >
                      <div className="p-2 bg-red-500/10 rounded-lg text-red-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        <Trash2 size={18} />
                      </div>
                      <div>
                        <span className="font-semibold text-sm text-red-300 block group-hover:text-red-200">
                          Excluir pasta E todas as {count} {count === 1 ? 'conta' : 'contas'}
                        </span>
                        <span className="text-xs text-red-400/80 block mt-0.5">
                          A pasta e as {count} {count === 1 ? 'conta associada serão excluídas' : 'contas associadas serão excluídas'} permanentemente.
                        </span>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-white/5">
                    <button
                      onClick={() => setFolderToDelete(null)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal de Aviso do "Atualizar Todas" */}
      {showRefreshAllConfirm && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowRefreshAllConfirm(false)}
        >
          <div 
            className="bg-[#161C24] border border-amber-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-5 relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 shrink-0">
                  <RefreshCw size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-100">Atualizar Todas as Contas</h3>
                  <p className="text-xs text-amber-400 font-medium mt-0.5">
                    {accounts.length} {accounts.length === 1 ? 'conta cadastrada' : 'contas cadastradas'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowRefreshAllConfirm(false)} 
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200 leading-relaxed">
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-amber-300 mb-1">Aviso de taxa e limite da API:</span>
                Dependendo da quantidade de contas, a sincronização pode levar mais tempo e exceder o limite de requisições por minuto (rate limit) da Riot API.
              </div>
            </div>

            <p className="text-sm text-gray-300">
              Deseja prosseguir e sincronizar os dados de todas as <strong>{accounts.length}</strong> contas?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
              <button
                onClick={() => setShowRefreshAllConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowRefreshAllConfirm(false);
                  handleRefreshAll();
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                <span>Confirmar e Atualizar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Autenticação Supabase / Discord */}
      <SupabaseAuthModal
        user={authUser}
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onRefreshData={() => {
          if (authUser) loadCloudData(authUser.id);
        }}
      />

      {/* Footer Area */}
      <footer className="h-10 px-8 border-t border-white/5 flex items-center justify-between bg-[#0F141B]/50 shrink-0">
        <div className="flex gap-4 text-[10px] text-gray-500 uppercase tracking-widest">
          <span>Connected to Riot API</span>
          <span>Status: <span className="text-emerald-500">Operational</span></span>
        </div>
      </footer>
    </div>
  );
}
