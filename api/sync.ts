import { createClient } from '@supabase/supabase-js';

// Vercel Serverless Function for LCU Sync Endpoint
export default async function handler(req: any, res: any) {
  // CORS setup for Python scripts or external POST
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    const payload = req.body;
    if (!payload) {
      return res.status(400).json({ error: 'Nenhum dado enviado no corpo da requisição.' });
    }

    let items: any[] = [];
    if (Array.isArray(payload)) {
      items = payload;
    } else if (payload.dados_conta) {
      items = [payload.dados_conta];
    } else {
      items = [payload];
    }

    const normalizedList = items.map((item: any) => {
      let gameName = 'Invocador';
      let tagLine = 'BR1';

      const accountStr = item.conta || item.account || item.gameName || '';
      if (accountStr.includes('#')) {
        const parts = accountStr.split('#');
        gameName = parts[0].trim();
        tagLine = parts.slice(1).join('#').trim() || 'BR1';
      } else if (item.gameName) {
        gameName = item.gameName;
        tagLine = item.tagLine || 'BR1';
      } else if (accountStr) {
        gameName = accountStr;
      }

      const ownedSkins = item.skins_habilitadas_detalhadas || item.ownedSkins || [];
      const lootSkins = item.skins_espolio_detalhadas || item.lootSkins || [];
      const ownedSkinsIds = item.skins_permanentes_conta_ids || [];

      return {
        gameName,
        tagLine,
        blueEssence: item.essencia_azul ?? item.blueEssence ?? 0,
        orangeEssence: item.essencia_laranja ?? item.orangeEssence ?? 0,
        skinShardsCount: item.fragmentos_skin_count ?? item.skinShardsCount ?? 0,
        championShardsCount: item.fragmentos_campeao_count ?? item.championShardsCount ?? 0,
        chestsCount: item.baus_hextech_count ?? item.chestsCount ?? item['Baús Hextech'] ?? 0,
        keysCount: item.chaves_completas_count ?? item.keysCount ?? 0,
        keyFragmentsCount: item.fragmentos_chave_count ?? item.keyFragmentsCount ?? 0,
        ownedSkinsCount: ownedSkins.length || ownedSkinsIds.length || item.Total_Skins_Habilitadas || 0,
        ownedSkins: Array.isArray(ownedSkins) ? ownedSkins : [],
        lootSkins: Array.isArray(lootSkins) ? lootSkins : [],
        lootSkinNames: Array.isArray(item.nomes_fragmentos_skin) ? item.nomes_fragmentos_skin : (item.lootSkinNames || []),
        lastSyncedAt: Date.now()
      };
    });

    // Option to sync directly with Supabase if service key or public url is present in environment variables
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    let updatedInDb = false;
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        for (const item of normalizedList) {
          // Find existing account by game_name & tag_line
          const { data: existing } = await supabase
            .from('lol_accounts')
            .select('*')
            .ilike('game_name', item.gameName)
            .ilike('tag_line', item.tagLine)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('lol_accounts')
              .update({
                blue_essence: item.blueEssence,
                orange_essence: item.orangeEssence,
                skin_shards_count: item.skinShardsCount,
                champion_shards_count: item.championShardsCount,
                chests_count: item.chestsCount,
                keys_count: item.keysCount,
                key_fragments_count: item.keyFragmentsCount,
                owned_skins_count: item.ownedSkinsCount,
                owned_skins: item.ownedSkins,
                loot_skins: item.lootSkins,
                loot_skin_names: item.lootSkinNames,
                last_synced_at: item.lastSyncedAt
              })
              .eq('id', existing.id);
            updatedInDb = true;
          }
        }
      } catch (dbErr) {
        console.error('Supabase auto update error:', dbErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: `${normalizedList.length} conta(s) sincronizada(s) com sucesso!`,
      updatedInDb,
      syncedAccounts: normalizedList,
      receivedAt: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Error in /api/sync handler:', err);
    return res.status(500).json({ error: 'Erro ao processar sincronização: ' + (err.message || err) });
  }
}
