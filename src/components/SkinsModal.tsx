import React, { useState } from 'react';
import { X, Search, Sparkles, Package, ShieldCheck, Diamond, Flame, Trophy } from 'lucide-react';
import { LoLAccount, OwnedSkin, LootSkin } from '../types';

interface SkinsModalProps {
  account: LoLAccount | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SkinsModal: React.FC<SkinsModalProps> = ({ account, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'owned' | 'loot'>('owned');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || !account) return null;

  const ownedSkins: OwnedSkin[] = account.ownedSkins || [];
  const lootSkins: LootSkin[] = account.lootSkins || [];

  const filteredOwned = ownedSkins.filter(s =>
    (s.skin_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.champion_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLoot = lootSkins.filter(s =>
    (s.skin_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Inventário & Espólio
                <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono">
                  {account.gameName}#{account.tagLine}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Visualização detalhada de skins habilitadas, fragmentos e essências coletadas do cliente LoL.
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

        {/* Balance & Inventory Stats Header */}
        <div className="p-4 bg-black/40 border-b border-white/10 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 text-center">
          <div className="bg-[#161C24] border border-blue-500/20 p-2 rounded-xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Essência Azul</span>
            <div className="text-sm font-black text-white flex items-center gap-1 mt-0.5 font-mono">
              💎 {(account.blueEssence ?? 0).toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="bg-[#161C24] border border-orange-500/20 p-2 rounded-xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Essência Laranja</span>
            <div className="text-sm font-black text-white flex items-center gap-1 mt-0.5 font-mono">
              🟠 {(account.orangeEssence ?? 0).toLocaleString('pt-BR')}
            </div>
          </div>

          <div className="bg-[#161C24] border border-purple-500/20 p-2 rounded-xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider">Skins Hab.</span>
            <div className="text-sm font-black text-purple-300 mt-0.5 font-mono">
              ✨ {account.ownedSkinsCount || ownedSkins.length}
            </div>
          </div>

          <div className="bg-[#161C24] border border-pink-500/20 p-2 rounded-xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider">Frag. Skin</span>
            <div className="text-sm font-black text-pink-300 mt-0.5 font-mono">
              🎨 {account.skinShardsCount ?? lootSkins.length}
            </div>
          </div>

          <div className="bg-[#161C24] border border-cyan-500/20 p-2 rounded-xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">Frag. Champ</span>
            <div className="text-sm font-black text-cyan-300 mt-0.5 font-mono">
              🧩 {account.championShardsCount ?? 0}
            </div>
          </div>

          <div className="bg-[#161C24] border border-amber-500/20 p-2 rounded-xl flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Baús Hextech</span>
            <div className="text-sm font-black text-amber-300 mt-0.5 font-mono">
              📦 {account.chestsCount ?? 0}
            </div>
          </div>

          <div className="bg-[#161C24] border border-emerald-500/20 p-2 rounded-xl flex flex-col items-center col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Chaves</span>
            <div className="text-sm font-black text-emerald-300 mt-0.5 font-mono">
              🔑 {account.keysCount ?? 0} <span className="text-[10px] text-gray-400">({account.keyFragmentsCount ?? 0}f)</span>
            </div>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div className="px-5 pt-4 pb-2 bg-[#0F141B] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-white/5">
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('owned')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'owned'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Trophy size={14} />
              <span>Skins Habilitadas ({ownedSkins.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('loot')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'loot'
                  ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Package size={14} />
              <span>Espólio & Fragmentos ({lootSkins.length})</span>
            </button>
          </div>

          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus-within:border-cyan-500/50">
            <Search size={14} className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Buscar por skin ou campeão..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none w-full sm:w-48 text-white"
            />
          </div>
        </div>

        {/* Gallery Display */}
        <div className="p-5 overflow-y-auto max-h-[60vh] flex-1 bg-black/20">
          {activeTab === 'owned' ? (
            filteredOwned.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                <Sparkles size={32} className="text-gray-600" />
                <p>Nenhuma skin habilitada encontrada para esta conta.</p>
                {ownedSkins.length === 0 && (
                  <p className="text-[11px] text-gray-600">
                    Sincronize esta conta com o cliente League de Legends para importar todas as skins detalhadas.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredOwned.map((skin, idx) => (
                  <div
                    key={skin.skin_id || idx}
                    className="bg-[#161C24] border border-white/10 hover:border-cyan-500/50 rounded-xl overflow-hidden group transition-all relative flex flex-col"
                  >
                    <div className="h-32 bg-gray-900 relative overflow-hidden">
                      {skin.tile_url || skin.splash_url ? (
                        <img
                          src={skin.tile_url || skin.splash_url}
                          alt={skin.skin_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-cyan-950/30 text-cyan-500/40 font-bold text-xs">
                          {skin.champion_name || 'LoL Skin'}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161C24] via-transparent to-transparent" />
                    </div>
                    <div className="p-2.5 flex flex-col justify-between flex-1">
                      <div>
                        <span className="text-[10px] text-cyan-400 uppercase font-semibold tracking-wider">
                          {skin.champion_name || 'Campeão'}
                        </span>
                        <h4 className="text-xs font-bold text-white leading-snug line-clamp-2 mt-0.5">
                          {skin.skin_name}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredLoot.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                <Package size={32} className="text-gray-600" />
                <p>Nenhum fragmento de skin no espólio.</p>
                {account.lootSkinNames && account.lootSkinNames.length > 0 && (
                  <div className="mt-3 text-left w-full max-w-md bg-black/40 border border-white/10 p-3 rounded-xl">
                    <p className="text-[11px] font-bold text-cyan-400 mb-1">Fragmentos em Texto:</p>
                    <div className="flex flex-wrap gap-1">
                      {account.lootSkinNames.map((name, i) => (
                        <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-md">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredLoot.map((skin, idx) => (
                  <div
                    key={skin.skin_id || idx}
                    className="bg-[#161C24] border border-amber-500/20 hover:border-amber-500/60 rounded-xl overflow-hidden group transition-all relative flex flex-col"
                  >
                    <div className="h-32 bg-gray-900 relative overflow-hidden">
                      {skin.tile_url || skin.splash_url ? (
                        <img
                          src={skin.tile_url || skin.splash_url}
                          alt={skin.skin_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-950/30 text-amber-500/40 font-bold text-xs">
                          Fragmento
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/70 border border-amber-500/40 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {skin.is_permanent ? 'Permanente' : 'Fragmento'}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161C24] via-transparent to-transparent" />
                    </div>
                    <div className="p-2.5 flex flex-col justify-between flex-1">
                      <h4 className="text-xs font-bold text-amber-200 leading-snug line-clamp-2">
                        {skin.skin_name}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0F141B] flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            {account.lastSyncedAt ? (
              <>Sincronizado em {new Date(account.lastSyncedAt).toLocaleString('pt-BR')}</>
            ) : (
              <>Dados do Cliente LoL</>
            )}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
