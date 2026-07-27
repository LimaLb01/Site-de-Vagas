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

export function getVagas() {
  return supabaseGet<Vaga>(
    'vagas?select=*&ativa=eq.true&order=capturada_em.desc,publicada_em.desc.nullslast&limit=500',
  )
}

export function getUltimaExecucao() {
  return supabaseGet<Execucao>(
    'execucoes_busca?select=executada_em,novas_vagas,total_encontradas&order=executada_em.desc&limit=1',
  )
}

export const PATH_VAGAS =
  'vagas?select=*&ativa=eq.true&order=capturada_em.desc,publicada_em.desc.nullslast&limit=500'
export const PATH_EXECUCAO =
  'execucoes_busca?select=executada_em,novas_vagas,total_encontradas&order=executada_em.desc&limit=1'

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
