import { read, utils } from 'xlsx';
import { LoLAccount } from '../types';

export async function parseAccountsFromFile(file: File): Promise<LoLAccount[]> {
  const fileName = file.name.toLowerCase();
  const accounts: LoLAccount[] = [];

  // Try parsing binary Excel / Spreadsheet first if xlsx/xls/ods
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods')) {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      const firstSheetName = workbook.SheetNames[0];
      if (firstSheetName) {
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = utils.sheet_to_json<any>(worksheet, { header: 1 }); // Array of arrays

        for (const row of rows) {
          if (!Array.isArray(row) || row.length === 0) continue;
          
          // Skip header row if it contains 'login' or 'nick' or 'senha'
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

  // If array parsing yielded nothing or file is txt/csv, try text line-by-line
  if (accounts.length === 0) {
    const textContent = await file.text();
    const lines = textContent.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      
      // Skip obvious CSV headers
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

function parseTextLine(line: string): LoLAccount | null {
  // Delimiters to try: colon `:`, semicolon `;`, pipe `|`, tab `\t`, comma `,`
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

  // Pattern 1: First part contains Nick#TAG (e.g. "Faker#KR1:user:pass")
  if (cleanParts[0].includes('#')) {
    const [nick, tag] = cleanParts[0].split('#');
    gameName = nick.trim();
    tagLine = tag.trim() || 'BR1';

    if (cleanParts.length >= 2) login = cleanParts[1];
    if (cleanParts.length >= 3) password = cleanParts[2];
  }
  // Pattern 2: 4 parts -> [GameName, Tag, Login, Password]
  else if (cleanParts.length >= 4) {
    gameName = cleanParts[0];
    tagLine = cleanParts[1];
    login = cleanParts[2];
    password = cleanParts[3];
  }
  // Pattern 3: 3 parts -> [Nick, Login, Password]
  else if (cleanParts.length === 3) {
    gameName = cleanParts[0];
    login = cleanParts[1];
    password = cleanParts[2];
  }
  // Pattern 4: 2 parts -> [Login, Password]
  else if (cleanParts.length === 2) {
    login = cleanParts[0];
    password = cleanParts[1];
    gameName = cleanParts[0]; // Default nick to login
  }
  // Pattern 5: Single item -> GameName
  else {
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
