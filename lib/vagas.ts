export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://zgvaxgqagoolpzqnnqrr.supabase.co'
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_Bil_mWlZLdLfnyrIRrWbxg_N2p_-oBs'

export interface Vaga {
  id: number
  fonte: string
  titulo: string
  empresa: string | null
  cidade: string | null
  tipo: string | null
  salario: string | null
  logo_url: string | null
  url: string
  termo_busca: string | null
  publicada_em: string | null
  capturada_em: string
}

export interface Execucao {
  executada_em: string
  novas_vagas: number
  total_encontradas: number
}

export const FONTES: Record<string, string> = {
  gupy: 'Gupy',
  linkedin: 'LinkedIn',
  'vagas.com': 'Vagas.com',
  jobfy: 'Jobfy',
  indeed: 'Indeed',
}

async function supabaseGet<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      next: { revalidate: 300 },
    })
    if (!res.ok) return []
    return (await res.json()) as T[]
  } catch {
    return []
  }
}

const ORDEM = 'order=capturada_em.desc,publicada_em.desc.nullslast&limit=1000'

// painel principal: cargos de Caxias, sem as vagas do simulado ADS
export const PATH_VAGAS = `vagas?select=*&ativa=eq.true&termo_busca=neq.ads&${ORDEM}`
// simulado ADS: vagas de tecnologia (Caxias + remoto)
export const PATH_ADS = `vagas?select=*&ativa=eq.true&termo_busca=eq.ads&${ORDEM}`

export function getVagas() {
  return supabaseGet<Vaga>(PATH_VAGAS)
}

export function getVagasAds() {
  return supabaseGet<Vaga>(PATH_ADS)
}

export function getUltimaExecucao() {
  return supabaseGet<Execucao>(
    'execucoes_busca?select=executada_em,novas_vagas,total_encontradas&order=executada_em.desc&limit=1',
  )
}
export const PATH_EXECUCAO =
  'execucoes_busca?select=executada_em,novas_vagas,total_encontradas&order=executada_em.desc&limit=1'

/* ---------- sincronização entre dispositivos ----------
   Sem login: um código aleatório longo identifica o perfil. Quem tem o código
   (celular e computador) compartilha o mesmo histórico de vistas/candidaturas. */

export interface Prefs {
  vistas: string[]
  candidatadas: string[]
}

export function novoCodigo(): string {
  const a = new Uint8Array(12)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20)
}

export async function lerPrefs(codigo: string): Promise<Prefs | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/preferencias?codigo=eq.${encodeURIComponent(codigo)}&select=vistas,candidatadas`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, cache: 'no-store' },
    )
    if (!res.ok) return null
    const linhas = (await res.json()) as Prefs[]
    return linhas[0] ?? null
  } catch {
    return null
  }
}

export async function salvarPrefs(codigo: string, prefs: Prefs): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/preferencias?on_conflict=codigo`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ codigo, ...prefs, atualizado_em: new Date().toISOString() }),
    })
    return res.ok
  } catch {
    return false
  }
}

// usado no navegador para atualizar sem recarregar a página (sempre dado fresco)
export async function fetchAoVivo<T>(path: string): Promise<T[] | null> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as T[]
  } catch {
    return null
  }
}
