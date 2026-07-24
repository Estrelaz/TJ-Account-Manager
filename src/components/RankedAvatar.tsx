import React, { useState, useEffect } from 'react';
import { UserCircle2 } from 'lucide-react';

export function getRankedEmblemCandidates(tier?: string): string[] {
  const firstWord = tier ? tier.trim().split(' ')[0].toLowerCase() : 'iron';
  const validTiers = [
    'iron', 'bronze', 'silver', 'gold', 'platinum', 
    'emerald', 'diamond', 'master', 'grandmaster', 'challenger'
  ];
  const tierKey = validTiers.includes(firstWord) ? firstWord : 'iron';

  const basePaths = [
    `raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/wings/wings_${tierKey}.png`,
    `raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/wings_${tierKey}.png`,
    `raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/${tierKey}.png`,
  ];

  const candidates: string[] = [];
  for (const path of basePaths) {
    candidates.push(`https://wsrv.nl/?url=${encodeURIComponent(path)}&output=webp`);
    candidates.push(`https://${path}`);
  }

  return candidates;
}

export function getRankedEmblemUrl(tier?: string): string {
  return getRankedEmblemCandidates(tier)[0];
}

export function getCachedProfileIconUrl(url?: string): string {
  if (!url) return '';
  if (url.includes('wsrv.nl')) return url;
  const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
  return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&output=webp&w=120`;
}

interface RankedAvatarProps {
  iconUrl?: string;
  tier?: string;
  summonerLevel?: number;
  size?: 'sm' | 'md' | 'lg';
  showLevel?: boolean;
  showFrame?: boolean;
  className?: string;
}

export const RankedAvatar: React.FC<RankedAvatarProps> = ({
  iconUrl,
  tier,
  summonerLevel,
  size = 'md',
  showLevel = true,
  showFrame = true,
  className = '',
}) => {
  const candidates = getRankedEmblemCandidates(tier);
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [emblemError, setEmblemError] = useState(false);

  useEffect(() => {
    setCandidateIndex(0);
    setEmblemError(false);
  }, [tier]);

  const handleEmblemError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex(prev => prev + 1);
    } else {
      setEmblemError(true);
    }
  };

  const emblemSrc = candidates[candidateIndex] || candidates[0];

  const cachedIconUrl = iconUrl ? getCachedProfileIconUrl(iconUrl) : '';

  // Dimension presets with and without frame overlay
  const sizeMapWithFrame = {
    sm: {
      container: 'w-12 h-12',
      avatar: 'w-8 h-8',
      emblem: 'w-[112px] h-[112px] max-w-none',
      level: 'text-[8px] -bottom-1.5 px-1 py-0',
    },
    md: {
      container: 'w-16 h-16',
      avatar: 'w-10 h-10',
      emblem: 'w-[144px] h-[144px] max-w-none',
      level: 'text-[9px] -bottom-1.5 px-1.5 py-0.2',
    },
    lg: {
      container: 'w-20 h-20',
      avatar: 'w-14 h-14',
      emblem: 'w-[196px] h-[196px] max-w-none',
      level: 'text-[10px] -bottom-1.5 px-2 py-0.5',
    },
  };

  const sizeMapNoFrame = {
    sm: {
      container: 'w-10 h-10',
      avatar: 'w-10 h-10',
      emblem: '',
      level: 'text-[8px] -bottom-1 px-1 py-0',
    },
    md: {
      container: 'w-12 h-12',
      avatar: 'w-12 h-12',
      emblem: '',
      level: 'text-[9px] -bottom-1 px-1.5 py-0.2',
    },
    lg: {
      container: 'w-16 h-16',
      avatar: 'w-16 h-16',
      emblem: '',
      level: 'text-[10px] -bottom-1 px-2 py-0.5',
    },
  };

  const config = showFrame ? sizeMapWithFrame[size] : sizeMapNoFrame[size];

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${config.container} ${className}`}>
      {/* Profile Icon in center (Circular) */}
      <div className={`${config.avatar} rounded-full overflow-hidden bg-[#121820] ${showFrame ? 'shadow-md' : 'border border-cyan-500/30 shadow-inner'} flex items-center justify-center relative z-0`}>
        {cachedIconUrl ? (
          <img
            src={cachedIconUrl}
            alt="Profile Icon"
            className="w-full h-full object-cover rounded-full"
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (iconUrl && e.currentTarget.src !== iconUrl) {
                e.currentTarget.src = iconUrl;
              }
            }}
          />
        ) : (
          <UserCircle2 className="w-2/3 h-2/3 text-gray-500" />
        )}
      </div>

      {/* Ranked Emblem Frame Overlay */}
      {showFrame && !emblemError && (
        <img
          src={emblemSrc}
          alt={tier || 'Ranked Emblem'}
          className={`absolute top-1/2 left-1/2 pointer-events-none select-none z-10 object-contain ${config.emblem}`}
          style={{ transform: 'translate(-50%, -60%)' }}
          onError={handleEmblemError}
        />
      )}

      {/* Level Badge */}
{showLevel && summonerLevel !== undefined && summonerLevel !== null && summonerLevel > 0 && (
  <div className={`absolute left-1/2 -translate-x-1/2 -translate-y-2.5 bg-[#0F141B] border border-cyan-500/50 rounded-full font-mono text-cyan-300 font-bold shadow-lg z-20 whitespace-nowrap ${config.level}`}>
    {summonerLevel}
  </div>
)}
    </div>
  );
};
