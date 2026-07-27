import { read, utils } from 'xlsx';
import { LoLAccount } from '../types';

export async function parseAccountsFromFile(file: File): Promise<LoLAccount[]> {
  const fileName = file.name.toLowerCase();
  const accounts: LoLAccount[] = [];

  // 1. Try JSON format first if json
  if (fileName.endsWith('.json')) {
    try {
      const text = await file.text();
      const parsedJson = JSON.parse(text);
      return parseJsonData(parsedJson);
    } catch (e) {
      console.warn('Erro ao ler JSON:', e);
    }
  }

  // 2. Try parsing binary Excel / Spreadsheet
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods')) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      const firstSheetName = workbook.SheetNames[0];
      if (firstSheetName) {
        const worksheet = workbook.Sheets[firstSheetName];
        // Parse as objects to catch named columns from "minhas_contas_lol.xlsx"
        const jsonObjects = utils.sheet_to_json<any>(worksheet);

        if (jsonObjects.length > 0 && (jsonObjects[0]['Conta'] || jsonObjects[0]['Essência Azul'] || jsonObjects[0]['Nick'])) {
          for (const rowObj of jsonObjects) {
            const acc = parseExcelObject(rowObj);
            if (acc) accounts.push(acc);
          }
          if (accounts.length > 0) return accounts;
        }

        // Fallback: parse array of rows
        const rows = utils.sheet_to_json<any>(worksheet, { header: 1 });
        for (const row of rows) {
          if (!Array.isArray(row) || row.length === 0) continue;
          
          const lineStr = row.map(cell => String(cell || '').trim()).join(' ');
          if (lineStr.toLowerCase().includes('login') && lineStr.toLowerCase().includes('senha')) {
            continue;
          }

          const parsed = parseRowOrLine(row);
          if (parsed) accounts.push(parsed);
        }
      }
    } catch (e) {
      console.warn('Erro na leitura como Excel, tentando leitura como Texto:', e);
    }
  }

  // 3. Try plain text / JSON text fallback
  if (accounts.length === 0) {
    const textContent = await file.text();
    
    // Check if text is raw JSON string
    if (textContent.trim().startsWith('{') || textContent.trim().startsWith('[')) {
      try {
        const parsedJson = JSON.parse(textContent);
        const jsonAccs = parseJsonData(parsedJson);
        if (jsonAccs.length > 0) return jsonAccs;
      } catch (e) {
        // Not valid JSON, continue text lines
      }
    }

    const lines = textContent.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      
      const lower = line.toLowerCase();
      if ((lower.includes('nick') || lower.includes('login') || lower.includes('name')) && lower.includes('senha')) {
        continue;
      }

      const parsed = parseTextLine(line);
      if (parsed) accounts.push(parsed);
    }
  }

  return accounts;
}

export function parseJsonData(jsonData: any): LoLAccount[] {
  let items: any[] = [];
  if (Array.isArray(jsonData)) {
    items = jsonData;
  } else if (jsonData && typeof jsonData === 'object') {
    if (jsonData.dados_conta) items = [jsonData.dados_conta];
    else if (jsonData.syncedAccounts) items = jsonData.syncedAccounts;
    else items = [jsonData];
  }

  const results: LoLAccount[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    let gameName = item.gameName || 'Invocador';
    let tagLine = item.tagLine || 'BR1';

    const contaStr = item.conta || item.Conta || item.account || '';
    if (contaStr.includes('#')) {
      const parts = contaStr.split('#');
      gameName = parts[0].trim();
      tagLine = parts.slice(1).join('#').trim() || 'BR1';
    } else if (contaStr) {
      gameName = contaStr.trim();
    }

    results.push({
      id: item.id || crypto.randomUUID(),
      gameName,
      tagLine,
      region: item.region || 'americas',
      platform: item.platform || 'br1',
      login: item.login || item.Login,
      password: item.password || item.Senha,
      profileIconUrl: item.profileIconUrl,
      summonerLevel: item.summonerLevel || 30,
      tier: item.tier || 'UNRANKED',
      rank: item.rank || '',
      leaguePoints: item.leaguePoints || 0,
      wins: item.wins || 0,
      losses: item.losses || 0,
      tags: item.tags || [],
      createdAt: item.createdAt || Date.now(),

      blueEssence: item.essencia_azul ?? item.blueEssence ?? item['Essência Azul'] ?? 0,
      orangeEssence: item.essencia_laranja ?? item.orangeEssence ?? item['Essência Laranja'] ?? 0,
      skinShardsCount: item.fragmentos_skin_count ?? item.skinShardsCount ?? item['Frag. Skin'] ?? 0,
      championShardsCount: item.fragmentos_campeao_count ?? item.championShardsCount ?? item['Frag. Campeão'] ?? 0,
      chestsCount: item.baus_hextech_count ?? item.chestsCount ?? item['Baús Hextech'] ?? 0,
      keysCount: item.chaves_completas_count ?? item.keysCount ?? item['Chaves Completas'] ?? 0,
      keyFragmentsCount: item.fragmentos_chave_count ?? item.keyFragmentsCount ?? item['Frag. Chave'] ?? 0,
      ownedSkinsCount: item.skins_habilitadas_detalhadas?.length || item.ownedSkins?.length || item['Total Skins Habilitadas'] || 0,
      ownedSkins: item.skins_habilitadas_detalhadas || item.ownedSkins || [],
      lootSkins: item.skins_espolio_detalhadas || item.lootSkins || [],
      lootSkinNames: item.nomes_fragmentos_skin || item.lootSkinNames || [],
      lastSyncedAt: item.lastSyncedAt || Date.now()
    });
  }

  return results;
}

function parseExcelObject(rowObj: any): LoLAccount | null {
  const contaStr = String(rowObj['Conta'] || rowObj['Nick'] || rowObj['Name'] || rowObj['Invocador'] || '').trim();
  if (!contaStr) return null;

  let gameName = 'Invocador';
  let tagLine = 'BR1';

  if (contaStr.includes('#')) {
    const parts = contaStr.split('#');
    gameName = parts[0].trim();
    tagLine = parts.slice(1).join('#').trim() || 'BR1';
  } else {
    gameName = contaStr;
  }

  return {
    id: crypto.randomUUID(),
    gameName,
    tagLine,
    region: 'americas',
    platform: 'br1',
    login: rowObj['Login'] || rowObj['Usuario'] || rowObj['User'],
    password: rowObj['Senha'] || rowObj['Password'] || rowObj['Pass'],
    tags: [],
    createdAt: Date.now(),

    blueEssence: Number(rowObj['Essência Azul'] || rowObj['Essencia Azul'] || 0),
    orangeEssence: Number(rowObj['Essência Laranja'] || rowObj['Essencia Laranja'] || 0),
    skinShardsCount: Number(rowObj['Frag. Skin'] || rowObj['Fragmentos Skin'] || 0),
    championShardsCount: Number(rowObj['Frag. Campeão'] || rowObj['Fragmentos Campeao'] || 0),
    chestsCount: Number(rowObj['Baús Hextech'] || rowObj['Baus Hextech'] || 0),
    keysCount: Number(rowObj['Chaves Completas'] || 0),
    keyFragmentsCount: Number(rowObj['Frag. Chave'] || rowObj['Fragmentos Chave'] || 0),
    ownedSkinsCount: Number(rowObj['Total Skins Habilitadas'] || 0),
    lastSyncedAt: Date.now()
  };
}

function parseTextLine(line: string): LoLAccount | null {
  let parts: string[] = [];

  if (line.includes(':')) {
    parts = line.split(':');
  } else if (line.includes(';')) {
    parts = line.split(';');
  } else if (line.includes('|')) {
    parts = line.split('|');
  } else if (line.includes('\t')) {
    parts = line.split('\t');
  } else if (line.includes(',')) {
    parts = line.split(',');
  } else {
    parts = [line];
  }

  parts = parts.map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length === 0) return null;

  return parseRowOrLine(parts);
}

function parseRowOrLine(parts: any[]): LoLAccount | null {
  const cleanParts = parts.map(p => String(p ?? '').trim()).filter(Boolean);
  if (cleanParts.length === 0) return null;

  let gameName = 'Invocador';
  let tagLine = 'BR1';
  let login: string | undefined = undefined;
  let password: string | undefined = undefined;

  if (cleanParts[0].includes('#')) {
    const [nick, tag] = cleanParts[0].split('#');
    gameName = nick.trim();
    tagLine = tag.trim() || 'BR1';

    if (cleanParts.length >= 2) login = cleanParts[1];
    if (cleanParts.length >= 3) password = cleanParts[2];
  } else if (cleanParts.length >= 4) {
    gameName = cleanParts[0];
    tagLine = cleanParts[1];
    login = cleanParts[2];
    password = cleanParts[3];
  } else if (cleanParts.length === 3) {
    gameName = cleanParts[0];
    login = cleanParts[1];
    password = cleanParts[2];
  } else if (cleanParts.length === 2) {
    login = cleanParts[0];
    password = cleanParts[1];
    gameName = cleanParts[0];
  } else {
    gameName = cleanParts[0];
  }

  if (!gameName && !login) return null;

  return {
    id: crypto.randomUUID(),
    gameName: gameName || login || 'Invocador',
    tagLine: tagLine || 'BR1',
    login,
    password,
    region: 'americas',
    platform: 'br1',
    tags: [],
    createdAt: Date.now()
  };
}
