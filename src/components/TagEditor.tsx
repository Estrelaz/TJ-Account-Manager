import React, { useState } from 'react';
import { Plus, X, Check, Shield, Star, Zap, Activity, Award, Flame, Target, Sparkles, Sword, Crown, Ghost } from 'lucide-react';
import { Tag } from '../types';

interface TagEditorProps {
  onAddTag: (tag: Omit<Tag, 'id'>) => void;
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

export function TagEditor({ onAddTag }: TagEditorProps) {
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

  return (
    <div className="flex flex-col gap-2 p-3 bg-[#161C24] border border-white/10 rounded-lg absolute z-10 w-56 shadow-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-300">Nova Tag</span>
        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X size={14} />
        </button>
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        placeholder="Nome da tag..."
        className="bg-black/40 border border-white/10 rounded p-1.5 text-sm text-gray-100 focus:outline-none focus:border-cyan-500/50"
        autoFocus
      />
      
      <div>
        <span className="text-[10px] text-gray-500 uppercase font-semibold mb-1 block">Cor</span>
        <div className="flex flex-wrap gap-1">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded border ${c} ${color === c ? 'ring-1 ring-offset-1 ring-offset-[#161C24] ring-white' : ''}`}
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
                onClick={() => setIconName(pi.name)}
                className={`w-6 h-6 flex items-center justify-center rounded border ${iconName === pi.name ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-black/40 border-white/10 text-gray-400 hover:text-gray-200'}`}
                title={pi.name}
              >
                {IconComp ? <IconComp size={12} /> : <span className="text-[10px]">🚫</span>}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={!text.trim()}
        className="mt-2 w-full flex items-center justify-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded py-1.5 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Check size={14} /> Adicionar
      </button>
    </div>
  );
}
