export interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface Tag {
  id: string;
  text: string;
  color: string;
  icon?: string;
}

export interface LoLAccount {
  id: string;
  gameName: string;
  tagLine: string;
  region: string; // ex: americas
  platform: string; // ex: br1
  profileIconUrl?: string;
  summonerLevel?: number;
  tier?: string;
  rank?: string;
  leaguePoints?: number;
  wins?: number;
  losses?: number;
  login?: string;
  password?: string;
  notes?: string;
  folderId?: string | null;
  tags: Tag[];
  createdAt: number;
}
