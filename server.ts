import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

function getRegionalCluster(platform: string): string {
  const p = platform.toLowerCase();
  if (['br1', 'na1', 'la1', 'la2'].includes(p)) return 'americas';
  if (['kr', 'jp1'].includes(p)) return 'asia';
  if (['euw1', 'eun1', 'tr1', 'ru'].includes(p)) return 'europe';
  if (['oce', 'ph2', 'sg2', 'th2', 'tw2', 'vn2'].includes(p)) return 'sea';
  return 'americas';
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Cache DDragon version
  let ddragonVersion = '14.8.1';
  try {
    const versionRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    if (versionRes.ok) {
      const versions = await versionRes.json();
      if (versions && versions[0]) ddragonVersion = versions[0];
    }
  } catch (e) {
    console.error('Failed to fetch ddragon version, using default 14.8.1');
  }

  // API Route for Riot API proxy
  app.get('/api/riot/account', async (req, res) => {
    const { gameName, tagLine, region, platform = 'br1' } = req.query;
    const apiKey = process.env.RIOT_API_KEY;

    if (!gameName || !tagLine) {
      return res.status(400).json({ error: 'Parâmetros "gameName" e "tagLine" são obrigatórios (ex: Nick#BR1).' });
    }

    const plat = String(platform).toLowerCase();
    const cluster = region ? String(region).toLowerCase() : getRegionalCluster(plat);

    if (!apiKey) {
      // Return simulation mock data with warning flag if no RIOT_API_KEY configured
      return res.json({
        puuid: 'mock-puuid-' + Math.random(),
        profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${Math.floor(Math.random() * 50)}.png`,
        summonerLevel: Math.floor(Math.random() * 500) + 30,
        tier: 'GOLD',
        rank: 'III',
        leaguePoints: 75,
        wins: 120,
        losses: 105,
        isMock: true,
        warning: 'RIOT_API_KEY não configurada na .env. Exibindo dados simulados.'
      });
    }

    try {
      // 1. Get PUUID by Riot ID (Account-v1)
      const accountUrl = `https://${cluster}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(String(gameName))}/${encodeURIComponent(String(tagLine))}`;
      const accountRes = await fetch(accountUrl, {
        headers: { 'X-Riot-Token': apiKey }
      });

      if (!accountRes.ok) {
        if (accountRes.status === 404) {
          return res.status(404).json({ error: `Invocador "${gameName}#${tagLine}" não foi encontrado na Riot API (${cluster.toUpperCase()}). Verifique o Nick e a Tag.` });
        }
        if (accountRes.status === 401 || accountRes.status === 403) {
          return res.status(403).json({ error: 'RIOT_API_KEY inválida, não autorizada ou expirada.' });
        }
        if (accountRes.status === 429) {
          return res.status(429).json({ error: 'Limite de requisições excedido na Riot API (Rate Limit). Tente novamente em instantes.' });
        }
        return res.status(accountRes.status).json({ error: `Erro ao buscar conta na Riot API (${accountRes.status}): ${accountRes.statusText}` });
      }

      const accountData = await accountRes.json();

      // 2. Get Summoner Data by PUUID (Summoner-v4)
      const summonerUrl = `https://${plat}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${accountData.puuid}`;
      const summonerRes = await fetch(summonerUrl, {
        headers: { 'X-Riot-Token': apiKey }
      });

      if (!summonerRes.ok) {
        if (summonerRes.status === 404) {
          return res.status(404).json({ error: `Invocador "${gameName}#${tagLine}" existe na Riot, mas não possui perfil ativo na região ${plat.toUpperCase()}.` });
        }
        return res.status(summonerRes.status).json({ error: `Erro ao buscar dados do Invocador na região ${plat.toUpperCase()} (${summonerRes.status}).` });
      }

      const summonerData = await summonerRes.json();

      // 3. Get Ranked Entries (League-v4)
      let rankedData = {
        tier: 'UNRANKED',
        rank: '',
        leaguePoints: 0,
        wins: 0,
        losses: 0,
        queueType: 'UNRANKED'
      };

      try {
        // Try modern by-puuid endpoint first
        let leagueRes = await fetch(
          `https://${plat}.api.riotgames.com/lol/league/v4/entries/by-puuid/${accountData.puuid}`,
          { headers: { 'X-Riot-Token': apiKey } }
        );

        // Fallback to by-summoner endpoint if by-puuid is not supported
        if (!leagueRes.ok && summonerData.id) {
          leagueRes = await fetch(
            `https://${plat}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerData.id}`,
            { headers: { 'X-Riot-Token': apiKey } }
          );
        }

        if (leagueRes.ok) {
          const leagues = await leagueRes.json();
          // Priority: Solo Queue, then Flex Queue
          const soloQueue = leagues.find((q: any) => q.queueType === 'RANKED_SOLO_5x5');
          const flexQueue = leagues.find((q: any) => q.queueType === 'RANKED_FLEX_SR');
          const targetQueue = soloQueue || flexQueue;

          if (targetQueue) {
            rankedData = {
              tier: targetQueue.tier || 'UNRANKED',
              rank: targetQueue.rank || '',
              leaguePoints: targetQueue.leaguePoints ?? 0,
              wins: targetQueue.wins ?? 0,
              losses: targetQueue.losses ?? 0,
              queueType: targetQueue.queueType || 'RANKED_SOLO_5x5'
            };
          }
        } else {
          console.error(`League API warning (${leagueRes.status}): ${leagueRes.statusText}`);
        }
      } catch (err: any) {
        console.error('Error fetching ranked data:', err?.message || err);
      }

      res.json({
        puuid: accountData.puuid,
        gameName: accountData.gameName || gameName,
        tagLine: accountData.tagLine || tagLine,
        profileIconUrl: `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${summonerData.profileIconId}.png`,
        summonerLevel: summonerData.summonerLevel,
        ...rankedData
      });
    } catch (error: any) {
      console.error('Riot API Server Error:', error);
      res.status(500).json({ error: error.message || 'Erro interno no servidor de integração da Riot.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
