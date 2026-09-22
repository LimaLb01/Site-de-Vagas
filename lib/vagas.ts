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
  // false = vaga encerrada na fonte (só aparece em "Só candidatadas")
  ativa?: boolean
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

// id no fim deixa a ordem estável entre os lotes da paginação
const ORDEM = 'order=capturada_em.desc,publicada_em.desc.nullslast,id.desc'

// O PostgREST do Supabase devolve no máximo 1000 linhas por requisição, mesmo
// pedindo mais: sem paginar, o painel perdia tudo além das 1000 mais recentes.
const LOTE = 1000
const MAX_LOTES = 10

// painel principal: cargos de Caxias, sem os estágios de ADS (página própria)
// e sem as vagas do antigo simulado ADS, desativado
export const PATH_VAGAS = `vagas?select=*&ativa=eq.true&termo_busca=not.in.(ads,estagio-ads)&${ORDEM}`
// estágios de ADS: Canoas, região metropolitana de Porto Alegre e remoto
export const PATH_ESTAGIO = `vagas?select=*&ativa=eq.true&termo_busca=eq.estagio-ads&${ORDEM}`

async function supabaseGetTodas<T>(path: string): Promise<T[]> {
  const todas: T[] = []
  for (let i = 0; i < MAX_LOTES; i++) {
    const lote = await supabaseGet<T>(`${path}&limit=${LOTE}&offset=${i * LOTE}`)
    todas.push(...lote)
    if (lote.length < LOTE) break
  }
  return todas
}

export function getVagas() {
  return supabaseGetTodas<Vaga>(PATH_VAGAS)
}

export function getVagasEstagio() {
  return supabaseGetTodas<Vaga>(PATH_ESTAGIO)
}

// A Gupy manda o regime como código (vacancy_type_effective); o card mostra o nome.
const TIPOS_GUPY: Record<string, string> = {
  vacancy_type_effective: 'Efetivo (CLT)',
  vacancy_legal_entity: 'PJ',
  vacancy_type_legal_entity: 'PJ',
  vacancy_type_talent_pool: 'Banco de talentos',
  vacancy_type_temporary: 'Temporário',
  vacancy_type_internship: 'Estágio',
  vacancy_type_outsource: 'Terceirizado',
  vacancy_type_associate: 'Associado',
  vacancy_type_autonomous: 'Autônomo',
  vacancy_type_independent_contractor: 'Autônomo',
  vacancy_type_apprentice: 'Jovem aprendiz',
  vacancy_type_trainee: 'Trainee',
  vacancy_type_freelancer: 'Freelancer',
  vacancy_type_lecturer: 'Docente',
  vacancy_type_summer: 'Temporada',
  vacancy_type_volunteer: 'Voluntário',
}

export function rotuloTipo(tipo: string | null): string | null {
  if (!tipo) return null
  if (TIPOS_GUPY[tipo]) return TIPOS_GUPY[tipo]
  // código novo que a Gupy venha a criar: melhor omitir do que mostrar cru
  if (/^vacancy_/.test(tipo)) return null
  return tipo
}

export function getUltimaExecucao() {
  return supabaseGet<Execucao>(
    'execucoes_busca?select=executada_em,novas_vagas,total_encontradas&order=executada_em.desc&limit=1',
  )
}
export const PATH_EXECUCAO =
  'execucoes_busca?select=executada_em,novas_vagas,total_encontradas&order=executada_em.desc&limit=1'

// última rodada do coletor de estágios (a página /estagio-ads mostra a hora)
export const PATH_EXEC_ESTAGIO =
  'execucoes_estagio?select=executada_em,encontradas,inseridas&order=executada_em.desc&limit=1'

export async function getUltimaEstagio(): Promise<Execucao | null> {
  const linhas = await supabaseGet<{
    executada_em: string
    encontradas: number
    inseridas: number
  }>(PATH_EXEC_ESTAGIO)
  const u = linhas[0]
  if (!u) return null
  return {
    executada_em: u.executada_em,
    novas_vagas: u.inseridas,
    total_encontradas: u.encontradas,
  }
}

/* ---------- sincronização entre dispositivos ----------
   Sem login: um código aleatório longo identifica o perfil. Quem tem o código
   (celular e computador) compartilha o mesmo histórico de vistas/candidaturas. */

export interface Prefs {
  vistas: string[]
  candidatadas: string[]
  atualizado_em?: string
}

export function novoCodigo(): string {
  const a = new Uint8Array(12)
  crypto.getRandomValues(a)
  return Array.from(a, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 20)
}

export async function lerPrefs(codigo: string): Promise<Prefs | null> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/preferencias?codigo=eq.${encodeURIComponent(codigo)}&select=vistas,candidatadas,atualizado_em`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, cache: 'no-store' },
    )
    if (!res.ok) return null
    const linhas = (await res.json()) as Prefs[]
    return linhas[0] ?? null
  } catch {
    return null
  }
}

// devolve o carimbo gravado: o painel usa para saber se o que veio do servidor
// é mais novo que a última alteração feita aqui
export async function salvarPrefs(codigo: string, prefs: Prefs): Promise<string | null> {
  const agora = new Date().toISOString()
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/preferencias?on_conflict=codigo`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        codigo,
        vistas: prefs.vistas,
        candidatadas: prefs.candidatadas,
        atualizado_em: agora,
      }),
    })
    return res.ok ? agora : null
  } catch {
    return null
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

// null se qualquer lote falhar: o painel mantém a lista anterior em vez de
// trocar por uma lista pela metade
export async function fetchAoVivoTodas<T>(path: string): Promise<T[] | null> {
  const todas: T[] = []
  for (let i = 0; i < MAX_LOTES; i++) {
    const lote = await fetchAoVivo<T>(`${path}&limit=${LOTE}&offset=${i * LOTE}`)
    if (!lote) return null
    todas.push(...lote)
    if (lote.length < LOTE) break
  }
  return todas
}

// Vagas em que o usuário se candidatou, inclusive as já encerradas (ativa=false), que o
// painel não carrega. A função SQL recalcula a mesma chave título|empresa do painel.
export async function buscarCandidatadas(chaves: string[]): Promise<Vaga[] | null> {
  if (chaves.length === 0) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/vagas_candidatadas`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chaves }),
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as Vaga[]
  } catch {
    return null
  }
}
