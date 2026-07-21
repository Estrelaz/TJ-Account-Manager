import { createClient } from '@supabase/supabase-js';
import { LoLAccount, Folder } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'MY_SUPABASE_URL' && 
  supabaseAnonKey !== 'MY_SUPABASE_ANON_KEY'
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper para Login com Discord via Supabase Auth
export async function signInWithDiscord() {
  if (!supabase) {
    throw new Error('Supabase não está configurado nas variáveis de ambiente.');
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Extrair Foto, Nome e Informações do Perfil do Usuário Discord / Supabase
export function getUserProfile(user: any) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.custom_claims?.global_name || meta.name || meta.preferred_username || user.email?.split('@')[0] || 'Invocador';
  const avatar = meta.avatar_url || meta.picture || meta.custom_claims?.avatar_url || null;
  const email = user.email || '';
  return { name, avatar, email };
}

// Interfaces de Banco de Dados no Supabase
export interface DBFolder {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface DBAccount {
  id: string;
  user_id: string;
  game_name: string;
  tag_line: string;
  region: string;
  platform: string;
  profile_icon_url?: string;
  summoner_level?: number;
  tier?: string;
  rank?: string;
  league_points?: number;
  wins?: number;
  losses?: number;
  login?: string;
  password?: string;
  notes?: string;
  folder_id?: string | null;
  tags?: any;
  created_at: number;
}

// Conversores de tipo
export function dbToAppFolder(db: DBFolder): Folder {
  return {
    id: db.id,
    name: db.name,
    color: db.color,
    icon: db.icon
  };
}

export function dbToAppAccount(db: DBAccount): LoLAccount {
  return {
    id: db.id,
    gameName: db.game_name,
    tagLine: db.tag_line,
    region: db.region || 'americas',
    platform: db.platform || 'br1',
    profileIconUrl: db.profile_icon_url,
    summonerLevel: db.summoner_level,
    tier: db.tier,
    rank: db.rank,
    leaguePoints: db.league_points,
    wins: db.wins,
    losses: db.losses,
    login: db.login,
    password: db.password,
    notes: db.notes,
    folderId: db.folder_id,
    tags: Array.isArray(db.tags) ? db.tags : [],
    createdAt: db.created_at || Date.now()
  };
}

export function appToDBFolder(folder: Folder, userId: string): DBFolder {
  return {
    id: folder.id,
    user_id: userId,
    name: folder.name,
    color: folder.color,
    icon: folder.icon
  };
}

export function appToDBAccount(acc: LoLAccount, userId: string): DBAccount {
  return {
    id: acc.id,
    user_id: userId,
    game_name: acc.gameName,
    tag_line: acc.tagLine,
    region: acc.region || 'americas',
    platform: acc.platform || 'br1',
    profile_icon_url: acc.profileIconUrl,
    summoner_level: acc.summonerLevel,
    tier: acc.tier,
    rank: acc.rank,
    league_points: acc.leaguePoints,
    wins: acc.wins,
    losses: acc.losses,
    login: acc.login,
    password: acc.password,
    notes: acc.notes,
    folder_id: acc.folderId || null,
    tags: acc.tags || [],
    created_at: acc.createdAt || Date.now()
  };
}

// SQL Script para o usuário rodar no SQL Editor do Supabase
export const SUPABASE_SQL_SETUP = `-- Script de Criação do Banco de Dados no Supabase
-- Copie e cole este código no SQL Editor do seu projeto no Supabase (https://supabase.com/dashboard)

-- 1. Habilitar UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Pastas
CREATE TABLE IF NOT EXISTS public.folders (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT 'cyan',
    icon TEXT DEFAULT 'folder',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir que as colunas color e icon existam mesmo se a tabela já existia antes
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS color TEXT DEFAULT 'cyan';
ALTER TABLE public.folders ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'folder';

-- 3. Tabela de Contas
CREATE TABLE IF NOT EXISTS public.accounts (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    game_name TEXT NOT NULL,
    tag_line TEXT NOT NULL,
    region TEXT DEFAULT 'americas',
    platform TEXT DEFAULT 'br1',
    profile_icon_url TEXT,
    summoner_level INT DEFAULT 30,
    tier TEXT DEFAULT 'UNRANKED',
    rank TEXT DEFAULT '',
    league_points INT DEFAULT 0,
    wins INT DEFAULT 0,
    losses INT DEFAULT 0,
    login TEXT,
    password TEXT,
    notes TEXT,
    folder_id TEXT REFERENCES public.folders(id) ON DELETE SET NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::bigint
);

-- 4. Habilitar Segurança por Linha (Row Level Security - RLS)
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

-- 5. Criar Políticas RLS para garantir privacidade por usuário
DROP POLICY IF EXISTS "Usuários gerenciam suas próprias pastas" ON public.folders;
CREATE POLICY "Usuários gerenciam suas próprias pastas"
ON public.folders FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários gerenciam suas próprias contas" ON public.accounts;
CREATE POLICY "Usuários gerenciam suas próprias contas"
ON public.accounts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
`;
