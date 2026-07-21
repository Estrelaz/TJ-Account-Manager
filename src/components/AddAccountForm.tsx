import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { LoLAccount } from '../types';

interface AddAccountFormProps {
  onAdd: (account: Omit<LoLAccount, 'id' | 'createdAt' | 'tags'>) => void;
}

export function AddAccountForm({ onAdd }: AddAccountFormProps) {
  const [riotId, setRiotId] = useState('');
  const [platform, setPlatform] = useState('br1');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parts = riotId.split('#');
    if (parts.length < 2) {
      setError('Formato inválido. Use Nome#Tag');
      return;
    }
    
    const gameNameStr = parts[0].trim();
    const tagLineStr = parts.slice(1).join('#').trim();

    if (!gameNameStr || !tagLineStr) {
      setError('Nome e Tag são obrigatórios (Nome#Tag)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Determine region based on platform
      const region = ['br1', 'la1', 'la2', 'na1'].includes(platform) ? 'americas' :
                     ['eun1', 'euw1', 'tr1', 'ru'].includes(platform) ? 'europe' : 'asia';

      let riotData: any = null;
      try {
        const res = await fetch(`/api/riot/account?gameName=${encodeURIComponent(gameNameStr)}&tagLine=${encodeURIComponent(tagLineStr)}&region=${region}&platform=${platform}`);
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            riotData = await res.json();
          }
        }
      } catch (err) {
        console.warn('Riot API não disponível no ambiente atual, adicionando com valores padrão:', err);
      }

      onAdd({
        gameName: gameNameStr,
        tagLine: tagLineStr,
        region,
        platform,
        profileIconUrl: riotData?.profileIconUrl || 'https://ddragon.leagueoflegends.com/cdn/14.8.1/img/profileicon/29.png',
        summonerLevel: riotData?.summonerLevel || 30,
        tier: riotData?.tier || 'UNRANKED',
        rank: riotData?.rank || '',
        leaguePoints: riotData?.leaguePoints ?? 0,
        wins: riotData?.wins ?? 0,
        losses: riotData?.losses ?? 0,
        login: login.trim() || undefined,
        password: password || undefined,
      });

      setRiotId('');
      setLogin('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar conta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#161C24] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-xl relative">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
        <div className="flex-1 w-full">
          <label className="block text-[10px] uppercase text-gray-500 mb-1.5 tracking-widest font-semibold">Riot ID</label>
          <div className="flex items-center bg-black/40 border border-white/10 rounded-lg overflow-hidden focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
            <input
              type="text"
              value={riotId}
              onChange={e => setRiotId(e.target.value)}
              placeholder="Name#Tag"
              className="bg-transparent text-gray-100 px-3 py-2 outline-none w-full text-sm"
              required
            />
          </div>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-[10px] uppercase text-gray-500 mb-1.5 tracking-widest font-semibold">Login (Opcional)</label>
          <input
            type="text"
            value={login}
            onChange={e => setLogin(e.target.value)}
            placeholder="Username"
            className="w-full bg-black/40 border border-white/10 text-gray-100 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all"
          />
        </div>

        <div className="flex-1 w-full">
          <label className="block text-[10px] uppercase text-gray-500 mb-1.5 tracking-widest font-semibold">Senha (Opcional)</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-black/40 border border-white/10 text-gray-100 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 text-sm transition-all"
          />
        </div>
        
        <div className="w-full sm:w-auto">
          <label className="block text-[10px] uppercase text-gray-500 mb-1.5 tracking-widest font-semibold">Server</label>
          <select
            value={platform}
            onChange={e => setPlatform(e.target.value)}
            className="w-full bg-black/40 border border-white/10 text-gray-100 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 appearance-none text-sm"
          >
            <option value="br1">BR (Brasil)</option>
            <option value="na1">NA (América do Norte)</option>
            <option value="euw1">EUW (Europa Oeste)</option>
            <option value="kr">KR (Coreia)</option>
            <option value="la1">LAS (Latam Sul)</option>
            <option value="la2">LAN (Latam Norte)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full sm:w-auto h-10 px-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <span className="text-lg leading-none">+</span>}
          Add Account
        </button>
      </div>
      
      {error && (
        <div className="text-red-400 text-sm">
          {error}
        </div>
      )}
    </form>
  );
}
