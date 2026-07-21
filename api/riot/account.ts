// Vercel Serverless Function for Riot API Proxy

function getRegionalCluster(platform: string): string {
  const p = platform.toLowerCase();
  if (['br1', 'na1', 'la1', 'la2'].includes(p)) return 'americas';
  if (['kr', 'jp1'].includes(p)) return 'asia';
  if (['euw1', 'eun1', 'tr1', 'ru'].includes(p)) return 'europe';
  if (['oce', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'].includes(p)) return 'sea';
  return 'americas';
}

export default async function handler(req: any, res: any) {
  const { gameName, tagLine, region, platform = 'br1' } = req.query;
  const apiKey = process.env.RIOT_API_KEY;

  if (!gameName || !tagLine) {
    return res.status(400).json({ error: 'Parâmetros "gameName" e "tagLine" são obrigatórios.' });
  }

  const plat = String(platform).toLowerCase();
  const cluster = region ? String(region).toLowerCase() : getRegionalCluster(plat);

  let ddragonVersion = '14.8.1';
  try {
    const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    if (versionRes.ok) {
      const versions = await versionRes.json();
      if (versions && versions[0]) ddragonVersion = versions[0];
    }
  } catch (e) {
    console.error('Failed to fetch ddragon version');
  }

  if (!apiKey) {
    return res.status(200).json({
      puuid: 'mock-puuid-' + Math.random(),
      profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/29.png`,
      summonerLevel: 30,
      tier: 'UNRANKED',
      rank: '',
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      isMock: true,
      warning: 'RIOT_API_KEY não configurada na Vercel. Exibindo dados padrão.'
    });
  }

  try {
    const accountUrl = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(String(gameName))}/${encodeURIComponent(String(tagLine))}`;
    const accountRes = await fetch(accountUrl, { headers: { 'X-Riot-Token': apiKey } });

    if (!accountRes.ok) {
      return res.status(accountRes.status).json({ error: `Invocador não encontrado na Riot API (${accountRes.status}).` });
    }

    const accountData = await accountRes.json();

    const summonerUrl = `https://${plat}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountData.puuid}`;
    const summonerRes = await fetch(summonerUrl, { headers: { 'X-Riot-Token': apiKey } });

    if (!summonerRes.ok) {
      return res.status(summonerRes.status).json({ error: `Invocador não tem perfil na região ${plat}.` });
    }

    const summonerData = await summonerRes.json();

    let rankedData = {
      tier: 'UNRANKED',
      rank: '',
      leaguePoints: 0,
      wins: 0,
      losses: 0
    };

    try {
      let leagueRes = await fetch(
        `https://${plat}.api.riotgames.com/lol/league/v4/entries/by-puuid/${accountData.puuid}`,
        { headers: { 'X-Riot-Token': apiKey } }
      );

      if (!leagueRes.ok && summonerData.id) {
        leagueRes = await fetch(
          `https://${plat}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`,
          { headers: { 'X-Riot-Token': apiKey } }
        );
      }

      if (leagueRes.ok) {
        const leagues = await leagueRes.json();
        const solo = leagues.find((q: any) => q.queueType === 'RANKED_SOLO_5x5');
        const flex = leagues.find((q: any) => q.queueType === 'RANKED_FLEX_SR');
        const target = solo || flex;
        if (target) {
          rankedData = {
            tier: target.tier || 'UNRANKED',
            rank: target.rank || '',
            leaguePoints: target.leaguePoints ?? 0,
            wins: target.wins ?? 0,
            losses: target.losses ?? 0
          };
        }
      }
    } catch (e) {
      console.error(e);
    }

    return res.status(200).json({
      puuid: accountData.puuid,
      gameName: accountData.gameName || gameName,
      tagLine: accountData.tagLine || tagLine,
      profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${summonerData.profileIconId}.png`,
      summonerLevel: summonerData.summonerLevel,
      ...rankedData
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao conectar à API da Riot.' });
  }
}
