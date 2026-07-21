import React, { useState } from 'react';
import { Plus, X, Check, Shield, Star, Zap, Activity, Award, Flame, Target, Sparkles, Sword, Crown, Ghost, Tag as TagIcon, Settings } from 'lucide-react';
import { Tag } from '../types';

interface TagEditorProps {
  accountTags?: Tag[];
  permanentTags?: Tag[];
  onAddTag: (tag: Omit<Tag, 'id'>) => void;
  onOpenPermanentTagsModal?: () => void;
}

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

export function TagEditor({ accountTags = [], permanentTags = [], onAddTag, onOpenPermanentTagsModal }: TagEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [iconName, setIconName] = useState<string>('none');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-6 h-5 flex items-center justify-center bg-white/5 border border-dashed border-white/20 rounded hover:bg-white/10 transition-colors"
        title="Adicionar Tag"
      >
        <Plus size={14} className="text-gray-400" />
      </button>
    );
  }

  const handleAdd = () => {
    if (text.trim()) {
      onAddTag({ text: text.trim(), color, icon: iconName !== 'none' ? iconName : undefined });
      setText('');
      setIconName('none');
      setIsOpen(false);
    }
  };

  const handleAddPermanent = (pTag: Tag) => {
    onAddTag({ text: pTag.text, color: pTag.color, icon: pTag.icon });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-[#161C24] border border-cyan-500/40 rounded-xl absolute z-30 w-64 shadow-2xl animate-in fade-in duration-150">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
          <TagIcon size={12} className="text-cyan-400" />
          Adicionar Tag
        </span>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Quick Select Permanent Tags */}
      {permanentTags.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">
              Tags Permanentes
            </span>
            {onOpenPermanentTagsModal && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPermanentTagsModal();
                }}
                className="text-[10px] text-gray-400 hover:text-cyan-300 flex items-center gap-0.5"
                title="Gerenciar Tags"
              >
                <Settings size={10} />
                <span>Gerenciar</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
            {permanentTags.map(pt => {
              const IconComp = pt.icon ? IconMapper[pt.icon] : null;
              const isAlreadyAdded = accountTags.some(t => t.text.toLowerCase() === pt.text.toLowerCase());

              return (
                <button
                  key={pt.id}
                  onClick={() => handleAddPermanent(pt)}
                  disabled={isAlreadyAdded}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border transition-all ${pt.color} ${
                    isAlreadyAdded 
                      ? 'opacity-40 cursor-not-allowed' 
                      : 'hover:scale-105 active:scale-95 hover:shadow-md'
                  }`}
                  title={isAlreadyAdded ? 'Já adicionada nesta conta' : `Clique para adicionar ${pt.text}`}
                >
                  {IconComp && <IconComp size={10} />}
                  <span>{pt.text}</span>
                  {isAlreadyAdded && <Check size={10} className="text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Tag Input */}
      <div className="space-y-2 border-t border-white/5 pt-2">
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">
          Criar Tag Personalizada
        </span>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Nome da tag..."
          className="w-full bg-black/40 border border-white/10 rounded-lg p-1.5 text-xs text-gray-100 focus:outline-none focus:border-cyan-500/50"
        />
        
        <div>
          <span className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Cor</span>
          <div className="flex flex-wrap gap-1">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-4 h-4 rounded border ${c} ${color === c ? 'ring-1 ring-offset-1 ring-offset-[#161C24] ring-white' : ''}`}
              />
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Ícone</span>
          <div className="flex flex-wrap gap-1">
            {PRESET_ICONS.map(pi => {
              const IconComp = pi.icon;
              return (
                <button
                  key={pi.name}
                  type="button"
                  onClick={() => setIconName(pi.name)}
                  className={`w-5 h-5 flex items-center justify-center rounded border ${iconName === pi.name ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-black/40 border-white/10 text-gray-400 hover:text-gray-200'}`}
                  title={pi.name}
                >
                  {IconComp ? <IconComp size={10} /> : <span className="text-[9px]">🚫</span>}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!text.trim()}
          className="w-full flex items-center justify-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-1.5 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          <Check size={14} /> Adicionar Tag
        </button>
      </div>
    </div>
  );
}
