import React, { useState } from 'react';
import { X, Plus, Trash2, Tag as TagIcon, Shield, Star, Zap, Activity, Award, Flame, Target, Sparkles, Sword, Crown, Ghost, Check } from 'lucide-react';
import { Tag } from '../types';

interface PermanentTagsModalProps {
  isOpen: boolean;
  permanentTags: Tag[];
  onClose: () => void;
  onAddPermanentTag: (tag: Omit<Tag, 'id'>) => void;
  onDeletePermanentTag: (tagId: string) => void;
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

const PRESET_COLORS = [
  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'bg-red-500/10 text-red-400 border-red-500/20',
  'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'bg-lime-500/10 text-lime-400 border-lime-500/20',
  'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
];

const PRESET_ICONS = [
  { name: 'none', icon: null },
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

export const PermanentTagsModal: React.FC<PermanentTagsModalProps> = ({
  isOpen,
  permanentTags,
  onClose,
  onAddPermanentTag,
  onDeletePermanentTag,
}) => {
  const [text, setText] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [iconName, setIconName] = useState('none');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddPermanentTag({
      text: text.trim(),
      color,
      icon: iconName !== 'none' ? iconName : undefined,
    });
    setText('');
    setIconName('none');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-[#161C24] border border-cyan-500/30 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0F141B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <TagIcon size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Tags Permanentes
                <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-mono">
                  {permanentTags.length}
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Crie e gerencie tags compartilhadas para aplicar rapidamente a qualquer conta.
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
          {/* Create Form */}
          <form onSubmit={handleCreate} className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Plus size={14} /> Criar Nova Tag Permanente
            </h4>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1">Nome da Tag</label>
              <input
                type="text"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Ex: Main Account, Smurf, Vendido, SoloQ..."
                className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-100 outline-none focus:border-cyan-500/50"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1.5">Cor do Destaque</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-lg border ${c} ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#161C24]' : ''}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-400 block mb-1.5">Ícone (Opcional)</label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_ICONS.map(pi => {
                  const IconComp = pi.icon;
                  return (
                    <button
                      key={pi.name}
                      type="button"
                      onClick={() => setIconName(pi.name)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg border text-xs transition-colors ${
                        iconName === pi.name 
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 font-bold' 
                          : 'bg-black/30 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {IconComp ? <IconComp size={14} /> : <span className="text-[10px]">🚫</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!text.trim()}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={16} />
              <span>Salvar Tag Permanente</span>
            </button>
          </form>

          {/* List of Permanent Tags */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Tags Cadastradas ({permanentTags.length}):
            </h4>

            {permanentTags.length === 0 ? (
              <p className="text-xs text-gray-500 italic p-4 bg-white/5 border border-white/5 rounded-xl text-center">
                Nenhuma tag permanente cadastrada ainda.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {permanentTags.map(pt => {
                  const IconComp = pt.icon ? IconMapper[pt.icon] : null;
                  return (
                    <div 
                      key={pt.id}
                      className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-2 group hover:border-white/20 transition-all"
                    >
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${pt.color}`}>
                        {IconComp && <IconComp size={12} />}
                        <span>{pt.text}</span>
                      </span>

                      <button
                        onClick={() => onDeletePermanentTag(pt.id)}
                        className="p-1 text-gray-500 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors"
                        title="Excluir tag permanente"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0F141B] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
