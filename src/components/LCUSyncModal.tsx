import React, { useState } from 'react';
import { X, Zap, Copy, Check, Download, Code, FileText, Upload, RefreshCw, CheckCircle2, Terminal, AlertTriangle } from 'lucide-react';
import { parseJsonData } from '../utils/importParser';
import { LoLAccount } from '../types';

interface LCUSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncAccounts?: (syncedAccounts: LoLAccount[]) => void;
  onAccountsSynced?: (syncedAccounts: LoLAccount[]) => void;
}

export const LCUSyncModal: React.FC<LCUSyncModalProps> = ({ isOpen, onClose, onSyncAccounts, onAccountsSynced }) => {
  const handleSyncTrigger = (accounts: LoLAccount[]) => {
    if (onAccountsSynced) onAccountsSynced(accounts);
    if (onSyncAccounts) onSyncAccounts(accounts);
  };
  const [activeTab, setActiveTab] = useState<'script' | 'paste' | 'supabase'>('script');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const syncApiUrl = typeof window !== 'undefined' && window.location.origin.includes('tj-account-manager')
    ? 'https://tj-account-manager.vercel.app/api/sync'
    : (typeof window !== 'undefined' ? `${window.location.origin}/api/sync` : 'https://tj-account-manager.vercel.app/api/sync');

  const supabaseSqlCode = `-- Copie e cole este código no SQL Editor do seu painel do Supabase:
-- Adiciona as colunas de Essência, RP, Skins e Espólio na tabela 'accounts':

ALTER TABLE accounts
ADD COLUMN IF NOT EXISTS blue_essence BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS orange_essence BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rp BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS skin_shards_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS chests_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS owned_skins_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS owned_skins JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS loot_skins JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS loot_skin_names JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS last_synced_at BIGINT;
`;

  const pythonScriptCode = `import sys
import os
import traceback

print("==================================================")
print("   SINCRONIZADOR DE CONTA LOL - TJ ACCOUNT MANAGER")
print("==================================================\n")

# Verifica se os pacotes necessários estão instalados
try:
    import requests
    import urllib3
    import json
except ImportError as e:
    print(f"[ERRO DE BIBLIOTECA] Faltam bibliotecas necessárias no seu Python.")
    print(f"Detalhe: {e}")
    print("\nPara corrigir, abra o CMD/Terminal e execute:")
    print("pip install requests urllib3 psutil\n")
    input("Pressione ENTER para sair...")
    sys.exit(1)

# Desativa avisos de certificado SSL local do cliente do LoL
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# URL da sua aplicação web para onde os dados serão enviados
SYNC_ENDPOINT = "${syncApiUrl}"

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

def get_lol_auth():
    """Obtém as credenciais LCU locais do cliente do LoL aberto"""
    port = None
    password = None

    if HAS_PSUTIL:
        for proc in psutil.process_iter(['name', 'cmdline']):
            try:
                if proc.info['name'] in ['LeagueClientUx.exe', 'LeagueClient.exe']:
                    cmdline = proc.info['cmdline']
                    for arg in cmdline:
                        if arg.startswith('--app-port='):
                            port = arg.split('=')[1]
                        elif arg.startswith('--remoting-auth-token='):
                            password = arg.split('=')[1]
                    if port and password:
                        return port, password
            except Exception:
                pass

    # Método alternativo via lockfile caso psutil não encontre
    paths = [
        r"C:\Riot Games\League of Legends\lockfile",
        r"D:\Riot Games\League of Legends\lockfile",
        r"E:\Riot Games\League of Legends\lockfile",
        r"C:\Games\League of Legends\lockfile",
        r"D:\Games\League of Legends\lockfile",
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                with open(p, 'r') as f:
                    content = f.read().split(':')
                    return content[2], content[3]
            except Exception:
                pass

    return None, None

def sincronizar_conta_completa():
    print("[1/5] Procurando League of Legends aberto no PC...")
    port, password = get_lol_auth()
    if not port or not password:
        print("\n[ATENÇÃO] Cliente do League of Legends NÃO foi encontrado aberto.")
        print("-> Por favor, abra o jogo League of Legends e faça login na sua conta primeiro.")
        return

    base_url = f"https://127.0.0.1:{port}"
    session = requests.Session()
    session.auth = ('riot', password)
    session.verify = False

    print(f"[OK] Conectado ao Cliente LoL na porta {port}!")

    # 1. Invocador
    print("[2/5] Lendo dados do invocador...")
    res = session.get(f"{base_url}/lol-summoner/v1/current-summoner")
    if res.status_code != 200:
        print("[ERRO] Não foi possível obter dados do invocador logado.")
        return
    summoner = res.json()
    display_name = summoner.get('gameName', summoner.get('displayName', 'Invocador'))
    tag_line = summoner.get('tagLine', 'BR1')
    conta_full = f"{display_name}#{tag_line}"

    # 2. Carteiras (Essência Azul / Laranja)
    print("[3/5] Consultando Essência Azul e Laranja...")
    wallet_res = session.get(f"{base_url}/lol-store/v1/wallet")
    wallet = wallet_res.json() if wallet_res.status_code == 200 else {}
    ip = wallet.get('ip', 0)  # Essência Azul
    rp = wallet.get('rp', 0)

    # 3. Espólio & Inventário
    print("[4/5] Mapeando espólio, fragmentos de skins e baús...")
    loot_res = session.get(f"{base_url}/lol-loot/v1/player-loot")
    loot_items = loot_res.json() if loot_res.status_code == 200 else []

    oe = 0
    frag_skin_count = 0
    baus_count = 0
    nomes_frag_skin = []
    skins_espolio_detalhadas = []

    for item in loot_items:
        item_id = item.get('lootId', '')
        count = item.get('count', 1)
        type_str = item.get('type', '')

        if item_id == 'CURRENCY_cosmetic':
            oe = count
        elif ('CHEST' in item_id or 'chest' in item_id.lower()) and ('KEY' not in item_id and 'key' not in item_id.lower()):
            baus_count += count
        elif 'SKIN' in type_str or 'SKIN' in item_id:
            frag_skin_count += count
            name = item.get('itemDesc', item.get('lootName', 'Skin'))
            nomes_frag_skin.append(name)
            s_item_id = item.get('storeItemId', 0)
            skins_espolio_detalhadas.append({
                'skin_id': s_item_id,
                'champion_id': 0,
                'skin_name': name,
                'is_permanent': 'RENTAL' not in type_str,
                'count': count,
                'tile_url': f"https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-tiles/{s_item_id}.jpg" if s_item_id else None,
                'splash_url': f"https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/{s_item_id}.jpg" if s_item_id else None
            })

    # 4. Skins Habilitadas
    print("[5/5] Coletando skins habilitadas na conta...")
    skins_res = session.get(f"{base_url}/lol-champions/v1/inventories/{summoner['summonerId']}/skins-minimal")
    owned_skins_detalhes = []
    if skins_res.status_code == 200:
        all_skins = skins_res.json()
        for s in all_skins:
            if s.get('ownership', {}).get('owned', False) and not s.get('isBase', False):
                skin_id = s.get('id')                   # ex: 222018
                champion_id = s.get('championId')       # ex: 222
                skin_name = s.get('name')               # ex: "Jinx Guardiã Estelar"
                champion_name = s.get('championName')   # ex: "Jinx"
                
                # 💡 Extrai o número da skin usando o resto da divisão (%)
                skin_num = skin_id % 1000 if skin_id else 0
                
                # 🖼️ Monta a URL da Splash Art do Data Dragon
                splash_url = f"https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{champion_name}_{skin_num}.jpg" if champion_name else None
                
                # 🔲 Ícone Quadrado (Tile)
                raw_tile = f"https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/{champion_name}_0.jpg" if champion_name else None
                tile_url = f"https://wsrv.nl/?url={raw_tile}" if raw_tile else None
                
                owned_skins_detalhes.append({
                    'skin_id': skin_id,
                    'skin_num': skin_num,
                    'champion_id': champion_id,
                    'champion_name': champion_name,
                    'skin_name': skin_name,
                    'splash_url': splash_url,
                    'tile_url': tile_url
                })

    dados_conta = {
        'conta': conta_full,
        'essencia_azul': ip,
        'rp': rp,
        'essencia_laranja': oe,
        'fragmentos_skin_count': frag_skin_count,
        'baus_hextech_count': baus_count,
        'skins_habilitadas_detalhadas': owned_skins_detalhes,
        'skins_espolio_detalhadas': skins_espolio_detalhadas,
        'nomes_fragmentos_skin': nomes_frag_skin
    }

    print("\n==================================================")
    print("                RESUMO DA CONTA")
    print("==================================================")
    print(f"Conta: {conta_full}")
    print(f"Essência Azul: {ip} | RP: {rp} | Essência Laranja: {oe}")
    print(f"Skins Habilitadas: {len(owned_skins_detalhes)} | Frag. de Skin: {frag_skin_count} | Baús Hextech: {baus_count}")

    # 5. Enviar para a aplicação Web
    print(f"\nEnviando dados sincronizados para o site ({SYNC_ENDPOINT})...")
    try:
        response = requests.post(SYNC_ENDPOINT, json={'dados_conta': dados_conta}, timeout=12)
        if response.status_code == 200:
            res_data = response.json()
            print("\n[SUCESSO COMPLETO!] Servidor respondeu:")
            print(f" -> {res_data.get('message', 'Sincronizado')}")
            for log in res_data.get('dbLogs', []):
                print(f" -> DB STATUS: {log}")
        else:
            print(f"\n[AVISO] O site respondeu com código {response.status_code}: {response.text}")
    except Exception as e:
        print(f"\n[ERRO AO ENVIAR PARA O SITE] {e}")

if __name__ == '__main__':
    try:
        sincronizar_conta_completa()
    except Exception as err:
        print("\n==================================================")
        print(" OCORREU UM ERRO INESPERADO DURANTE A EXECUÇÃO:")
        print("==================================================")
        traceback.print_exc()
    finally:
        print("\n--------------------------------------------------")
        input("Pressione ENTER para fechar a janela do terminal...")
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleDownloadScript = () => {
    const blob = new Blob([pythonScriptCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sincronizar_lol_lcu.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProcessPastedJson = () => {
    setStatusMsg(null);
    if (!pastedJson.trim()) {
      setStatusMsg({ type: 'error', text: 'Cole os dados em formato JSON antes de sincronizar.' });
      return;
    }

    try {
      const parsed = JSON.parse(pastedJson);
      const accs = parseJsonData(parsed);

      if (accs.length === 0) {
        setStatusMsg({ type: 'error', text: 'Nenhuma conta válida foi reconhecida no JSON fornecido.' });
        return;
      }

      handleSyncTrigger(accs);
      setStatusMsg({ type: 'success', text: `${accs.length} conta(s) sincronizada(s) com sucesso!` });
      setPastedJson('');
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'JSON inválido: ' + e.message });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#161C24] border border-cyan-500/30 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#0F141B]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <Zap size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Sincronizador LCU (Cliente LoL)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Colete Essência Azul, Essência Laranja, Skins e Espólio em tempo real do seu League de Legends.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 bg-[#0F141B] flex items-center gap-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('script')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'script'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Code size={15} />
            <span>Script Python Autônomo</span>
          </button>
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <FileText size={15} />
            <span>Colar JSON do Espólio</span>
          </button>
          <button
            onClick={() => setActiveTab('supabase')}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'supabase'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            <Zap size={15} className="text-emerald-400" />
            <span>Comando SQL Supabase</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[65vh] flex-1 space-y-4">
          {activeTab === 'script' ? (
            <div className="space-y-4">
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                  <Terminal size={16} />
                  Como sincronizar com o Cliente LoL Aberto:
                </h4>
                <ol className="text-xs text-gray-300 list-decimal list-inside space-y-1 leading-relaxed">
                  <li>Abra o seu League of Legends no PC e faça login na conta.</li>
                  <li>Baixe o script Python abaixo ou copie para um arquivo <code className="text-cyan-300">sincronizar_lol.py</code>.</li>
                  <li>Execute no terminal: <code className="text-cyan-300">python sincronizar_lol.py</code></li>
                  <li>O script se conectará ao cliente local via LCU API e enviará automaticamente os dados das Essências e Skins para este site!</li>
                </ol>
              </div>

              <div className="bg-[#0F141B] border border-white/10 rounded-xl overflow-hidden relative">
                <div className="p-3 bg-black/60 border-b border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-400">sincronizar_lol_lcu.py</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                    >
                      {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedCode ? 'Copiado!' : 'Copiar Código'}</span>
                    </button>
                    <button
                      onClick={handleDownloadScript}
                      className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Download size={14} />
                      <span>Baixar .PY</span>
                    </button>
                  </div>
                </div>

                <pre className="p-4 text-xs font-mono text-cyan-300/90 overflow-x-auto max-h-64 leading-relaxed bg-black/80">
                  {pythonScriptCode}
                </pre>
              </div>
            </div>
          ) : activeTab === 'paste' ? (
            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
                <p className="text-xs text-gray-300 leading-relaxed mb-2">
                  Se você já executou o script e possui a saída JSON ou dados coletados da conta, cole-os abaixo para sincronizar instantaneamente no painel:
                </p>
                <textarea
                  value={pastedJson}
                  onChange={e => setPastedJson(e.target.value)}
                  placeholder={`Cole aqui o JSON da conta, ex:\n{\n  "conta": "Invocador#BR1",\n  "essencia_azul": 12500,\n  "essencia_laranja": 3400,\n  "fragmentos_skin_count": 8\n}`}
                  className="w-full h-44 bg-[#0F141B] border border-white/15 focus:border-cyan-400 text-gray-200 font-mono text-xs rounded-xl p-3 outline-none resize-none"
                />
              </div>

              {statusMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <button
                onClick={handleProcessPastedJson}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={16} />
                <span>Processar & Sincronizar JSON</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                  <Zap size={16} />
                  Atualização de Colunas na Tabela do Supabase:
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Para que a sua tabela <code className="text-emerald-300 font-mono">lol_accounts</code> no Supabase salve permanentemente as Essências, Skins e Espólio trazidos pelo script, acesse o <strong>SQL Editor</strong> do Supabase e rode os comandos abaixo:
                </p>
              </div>

              <div className="bg-[#0F141B] border border-white/10 rounded-xl overflow-hidden relative">
                <div className="p-3 bg-black/60 border-b border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gray-400">supabase_migration.sql</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(supabaseSqlCode);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 2500);
                    }}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedSql ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                  </button>
                </div>

                <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed bg-black/80">
                  {supabaseSqlCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0F141B] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
