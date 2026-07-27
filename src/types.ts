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

export interface OwnedSkin {
  skin_id: number;
  champion_id: number;
  skin_name: string;
  champion_name: string;
  splash_url?: string;
  tile_url?: string;
}

export interface LootSkin {
  skin_id: number;
  champion_id: number;
  skin_name: string;
  is_permanent?: boolean;
  count?: number;
  splash_url?: string;
  tile_url?: string;
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

  // LCU Client Sync & Inventory
  blueEssence?: number;
  orangeEssence?: number;
  rp?: number;
  riotPoints?: number;
  skinShardsCount?: number;
  championShardsCount?: number;
  chestsCount?: number;
  keysCount?: number;
  keyFragmentsCount?: number;
  ownedSkinsCount?: number;
  ownedSkins?: OwnedSkin[];
  lootSkins?: LootSkin[];
  lootSkinNames?: string[];
  lastSyncedAt?: number;
}

