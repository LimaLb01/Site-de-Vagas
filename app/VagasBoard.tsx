'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FONTES,
  PATH_VAGAS,
  PATH_EXECUCAO,
  fetchAoVivo,
  fetchAoVivoTodas,
  buscarCandidatadas,
  chaveVaga,
  rotuloTipo,
  type Vaga,
  type Execucao,
} from '@/lib/vagas'
import LogoEmpresa from './LogoEmpresa'
import PainelSync from './PainelSync'
import { usePrefs } from './usePrefs'
import styles from './page.module.css'

const PAGINA = 30

const CARGOS: Array<{ id: string; nome: string }> = [
  { id: 'assistente', nome: 'Assistente' },
  { id: 'analista', nome: 'Analista' },
  { id: 'diversidade', nome: 'Diversidade' },
  { id: 'psicologia', nome: 'Psicologia' },
]

type Nivel = 'jr' | 'pl' | 'sr' | 'sem'
const NIVEL_NOME: Record<Nivel, string> = {
  jr: 'Júnior',
  pl: 'Pleno',
  sr: 'Sênior',
  sem: 'Sem nível',
}

interface Fonte {
  fonte: string
  url: string
}
interface VagaMerged {
  key: string
  titulo: string
  empresa: string | null
  cidade: string | null
  tipo: string | null
  salario: string | null
  logo_url: string | null
  termo_busca: string | null
  publicada_em: string | null
  capturada_em: string
  fontes: Fonte[]
  encerrada: boolean
}


// junta a mesma vaga vinda de fontes diferentes num card só
function mesclar(vagas: Vaga[]): VagaMerged[] {
  const mapa = new Map<string, VagaMerged>()
  for (const v of vagas) {
    const key = chaveVaga(v.titulo, v.empresa)
    const ex = mapa.get(key)
    if (!ex) {
      mapa.set(key, {
        key,
        titulo: v.titulo,
        empresa: v.empresa,
        cidade: v.cidade,
        tipo: v.tipo,
        salario: v.salario,
        logo_url: v.logo_url,
        termo_busca: v.termo_busca,
        publicada_em: v.publicada_em,
        capturada_em: v.capturada_em,
        fontes: [{ fonte: v.fonte, url: v.url }],
        encerrada: v.ativa === false,
      })
    } else {
      if (!ex.fontes.some((f) => f.fonte === v.fonte)) ex.fontes.push({ fonte: v.fonte, url: v.url })
      if (!ex.salario && v.salario) ex.salario = v.salario
      if (!ex.logo_url && v.logo_url) ex.logo_url = v.logo_url
      if (!ex.tipo && v.tipo) ex.tipo = v.tipo
      // encerrada só quando nenhuma fonte ainda tem a vaga aberta
      ex.encerrada = ex.encerrada && v.ativa === false
      if (v.capturada_em > ex.capturada_em) ex.capturada_em = v.capturada_em
      const pa = v.publicada_em ?? ''
      const pe = ex.publicada_em ?? ''
      if (pa > pe) ex.publicada_em = v.publicada_em
    }
  }
  // ordena os selos pela ordem canônica das FONTES
  const ordemFonte = Object.keys(FONTES)
  for (const m of mapa.values()) {
    m.fontes.sort((a, b) => ordemFonte.indexOf(a.fonte) - ordemFonte.indexOf(b.fonte))
  }
  return [...mapa.values()]
}

function ehRemota(v: VagaMerged): boolean {
  return /remoto|home ?office/i.test(`${v.cidade ?? ''} ${v.tipo ?? ''}`)
}

function nivelDe(v: VagaMerged): Nivel {
  const t = v.titulo.toLowerCase()
  if (/\bs[êe]nior\b|\bsr\b/.test(t)) return 'sr'
  if (/\bpleno\b|\bpl\b/.test(t)) return 'pl'
  if (/\bj[úu]nior\b|\bjr\b/.test(t)) return 'jr'
  return 'sem'
}

function fmtData(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
}

function fmtHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function salarioNum(v: VagaMerged): number {
  if (!v.salario) return -1
  const m = String(v.salario).match(/[\d.]+(?:,\d{2})?/)
  if (!m) return -1
  return parseFloat(m[0].replace(/\./g, '').replace(',', '.')) || -1
}

type Ordem = 'recentes' | 'antigas' | 'az' | 'salario'

const INTERVALO_MS = 60 * 1000

function haQuantoTempo(ms: number | null, agora: number): string {
  if (!ms) return 'agora'
  const s = Math.max(0, Math.round((agora - ms) / 1000))
  if (s < 60) return 'há instantes'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  return `há ${Math.round(m / 60)} h`
}

/* ícones inline: sem fonte de ícones externa, sem requisição extra */
const svg = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor' } as const

const IconPin = () => (
  <svg {...svg} aria-hidden>
    <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
  </svg>
)
const IconMoney = () => (
  <svg {...svg} aria-hidden>
    <path d="M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm9 3.5A2.5 2.5 0 1 0 12 14.5a2.5 2.5 0 0 0 0-5z" />
  </svg>
)
const IconWork = () => (
  <svg {...svg} aria-hidden>
    <path d="M9 4h6a2 2 0 0 1 2 2v1h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3V6a2 2 0 0 1 2-2zm0 3h6V6H9v1z" />
  </svg>
)
const IconClock = () => (
  <svg {...svg} aria-hidden>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.6V6h-2v7.4l5 3 1-1.7-4-2.1z" />
  </svg>
)
const IconSearch = () => (
  <svg {...svg} aria-hidden>
    <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
  </svg>
)

export default function VagasBoard({
  vagas: vagasIniciais,
  ultima: ultimaInicial,
}: {
  vagas: Vaga[]
  ultima: Execucao | null
}) {
  const [vagas, setVagas] = useState<Vaga[]>(vagasIniciais)
  const [ultima, setUltima] = useState<Execucao | null>(ultimaInicial)
  const [atualizando, setAtualizando] = useState(false)
  const [checadoEm, setChecadoEm] = useState<number | null>(null)
  const [agora, setAgora] = useState(() => Date.now())
  const [erroRede, setErroRede] = useState(false)
  const buscandoRef = useRef(false)
  const [busca, setBusca] = useState('')
  const [fonte, setFonte] = useState<string | null>(null)
  const [termo, setTermo] = useState<string | null>(null)
  const [nivel, setNivel] = useState<Nivel | null>(null)
  const [local, setLocal] = useState<'caxias' | 'remoto' | null>(null)
  const [soNovas, setSoNovas] = useState(false)
  const [soComSalario, setSoComSalario] = useState(false)
  const [ocultarCand, setOcultarCand] = useState(false)
  const [soCand, setSoCand] = useState(false)
  const [vagasCand, setVagasCand] = useState<Vaga[]>([])
  const [ordem, setOrdem] = useState<Ordem>('recentes')
  const [mostrarSync, setMostrarSync] = useState(false)
  const [visiveis, setVisiveis] = useState(PAGINA)

  const itens = useMemo(() => mesclar(vagas), [vagas])

  const {
    vistas,
    candidatadas,
    codigo,
    puxarPrefs,
    marcarVista,
    toggleVista,
    marcarTodasVistas,
    desmarcarTodasVistas,
    toggleCand,
    usarCodigo,
  } = usePrefs(itens.map((i) => i.key))

  // busca a lista mais recente. `manual` ignora a checagem de aba oculta.
  const atualizar = useCallback(async (manual = false) => {
    if (!manual && document.hidden) return
    if (buscandoRef.current) return
    buscandoRef.current = true
    setAtualizando(true)
    try {
      const [novas, exec] = await Promise.all([
        fetchAoVivoTodas<Vaga>(PATH_VAGAS),
        fetchAoVivo<Execucao>(PATH_EXECUCAO),
      ])
      if (novas) {
        setVagas(novas)
        setErroRede(false)
      } else {
        setErroRede(true)
      }
      if (exec && exec[0]) setUltima(exec[0])
      setChecadoEm(Date.now())
    } catch {
      setErroRede(true)
    } finally {
      buscandoRef.current = false
      setAtualizando(false)
    }
  }, [])

  // mantém lista e marcações frescas: no intervalo, ao voltar para a aba e ao reconectar
  useEffect(() => {
    const id = setInterval(() => {
      atualizar()
      void puxarPrefs()
    }, INTERVALO_MS)
    const aoVoltar = () => {
      if (document.hidden) return
      atualizar()
      void puxarPrefs()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('focus', aoVoltar)
    window.addEventListener('online', aoVoltar)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('focus', aoVoltar)
      window.removeEventListener('online', aoVoltar)
    }
  }, [atualizar, puxarPrefs])

  // relógio: reconta "há X" a cada 15s para provar que o painel está vivo
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

  // antes de carregar o histórico, nada é "novo" (evita piscar)
  const naoVista = (v: VagaMerged) => (vistas ? !vistas.has(v.key) : false)

  const naoVistasCount = useMemo(
    () => (vistas ? itens.filter((i) => !vistas.has(i.key)).length : 0),
    [itens, vistas],
  )

  const contagemFonte = useMemo(() => {
    const c: Record<string, number> = {}
    for (const v of itens) for (const f of v.fontes) c[f.fonte] = (c[f.fonte] ?? 0) + 1
    return c
  }, [itens])

  const contagemCargo = useMemo(() => {
    const c: Record<string, number> = {}
    for (const v of itens) if (v.termo_busca) c[v.termo_busca] = (c[v.termo_busca] ?? 0) + 1
    return c
  }, [itens])

  const contagemLocal = useMemo(() => {
    let remoto = 0
    for (const v of itens) if (ehRemota(v)) remoto++
    return { remoto, caxias: itens.length - remoto }
  }, [itens])

  const contagemNivel = useMemo(() => {
    const c: Record<Nivel, number> = { jr: 0, pl: 0, sr: 0, sem: 0 }
    for (const v of itens) if (v.termo_busca === 'analista') c[nivelDe(v)]++
    return c
  }, [itens])

  const trocarCargo = (novo: string | null) => {
    setTermo(novo)
    setNivel(null)
  }

  // "Só candidatadas" também mostra as vagas que já encerraram, que o painel não carrega
  useEffect(() => {
    if (candidatadas.size === 0) {
      setVagasCand([])
      return
    }
    let cancelado = false
    buscarCandidatadas([...candidatadas]).then((r) => {
      // o histórico é compartilhado com a aba de estágios: aqui só entram as deste painel
      if (!cancelado && r) setVagasCand(r.filter((v) => v.termo_busca !== 'estagio-ads'))
    })
    return () => {
      cancelado = true
    }
  }, [candidatadas])

  // quantas candidaturas são deste painel (as de estágio ficam na outra aba)
  const candDaqui = useMemo(
    () => new Set(vagasCand.map((v) => chaveVaga(v.titulo, v.empresa))).size,
    [vagasCand],
  )

  const itensComEncerradas = useMemo(
    () => (soCand ? mesclar([...vagas, ...vagasCand]) : itens),
    [soCand, vagas, vagasCand, itens],
  )

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let r = itensComEncerradas.filter((v) => {
      if (soCand && !candidatadas.has(v.key)) return false
      if (fonte && !v.fontes.some((f) => f.fonte === fonte)) return false
      if (termo && v.termo_busca !== termo) return false
      if (termo === 'analista' && nivel && nivelDe(v) !== nivel) return false
      if (local === 'remoto' && !ehRemota(v)) return false
      if (local === 'caxias' && ehRemota(v)) return false
      if (soNovas && !naoVista(v)) return false
      if (soComSalario && !v.salario) return false
      if (ocultarCand && candidatadas.has(v.key)) return false
      if (q) {
        const alvo = `${v.titulo} ${v.empresa ?? ''} ${v.cidade ?? ''}`.toLowerCase()
        if (!alvo.includes(q)) return false
      }
      return true
    })
    r = [...r].sort((a, b) => {
      if (ordem === 'az') return a.titulo.localeCompare(b.titulo, 'pt-BR')
      if (ordem === 'salario') return salarioNum(b) - salarioNum(a)
      const ta = new Date(a.publicada_em ?? a.capturada_em).getTime()
      const tb = new Date(b.publicada_em ?? b.capturada_em).getTime()
      return ordem === 'recentes' ? tb - ta : ta - tb
    })
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itensComEncerradas, soCand, busca, fonte, termo, nivel, local, soNovas, soComSalario, ocultarCand, candidatadas, vistas, ordem])

  // reseta a paginação quando os filtros mudam
  useEffect(() => {
    setVisiveis(PAGINA)
  }, [busca, fonte, termo, nivel, local, soNovas, soComSalario, ocultarCand, soCand, ordem])

  const mostradas = filtradas.slice(0, visiveis)
  const encerradasNaLista = soCand ? filtradas.filter((v) => v.encerrada).length : 0

  const limpar = () => {
    setBusca('')
    setFonte(null)
    setTermo(null)
    setNivel(null)
    setLocal(null)
    setSoNovas(false)
    setSoComSalario(false)
    setOcultarCand(false)
    setSoCand(false)
  }
  const temFiltro =
    busca || fonte || termo || nivel || local || soNovas || soComSalario || ocultarCand || soCand

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <span className={styles.logo} aria-hidden>
            VC
          </span>
          <span className={styles.brand}>Vagas Caxias do Sul</span>
          <button
            className={styles.navLink}
            onClick={() => setMostrarSync((v) => !v)}
            title="Usar o mesmo histórico no celular e no computador"
          >
            Sincronizar
          </button>
          <a className={styles.navLink} href="/estagio-ads">
            Estágio ADS em Canoas
          </a>
        </div>
      </div>

      {mostrarSync && <PainelSync codigo={codigo} usarCodigo={usarCodigo} />}

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1 className={styles.title}>Vagas de Assistente e Analista</h1>
            <p className={styles.eyebrow}>
              <IconPin /> Caxias do Sul, RS
            </p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{itens.length}</strong>
              <span>vagas ativas</span>
            </div>
            <div className={styles.stat}>
              <strong>{naoVistasCount}</strong>
              <span>ainda não vistas</span>
            </div>
            <span className={styles.atualizado}>
              {ultima && (
                <>
                  Coleta de {fmtHora(ultima.executada_em)}, {fmtData(ultima.executada_em)}
                  <br />
                </>
              )}
              <span className={styles.checagem}>
                <span className={atualizando ? styles.pulseOn : styles.pulse} aria-hidden />
                {erroRede
                  ? 'sem conexão — tentando'
                  : atualizando
                    ? 'verificando…'
                    : `verificado ${haQuantoTempo(checadoEm, agora)}`}
                <button
                  className={styles.refresh}
                  onClick={() => atualizar(true)}
                  disabled={atualizando}
                  title="Buscar vagas agora"
                >
                  atualizar
                </button>
              </span>
            </span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.controls}>
          <div className={styles.searchRow}>
            <div className={styles.searchWrap}>
              <span className={styles.searchIcon} aria-hidden>
                <IconSearch />
              </span>
              <input
                className={styles.search}
                type="search"
                placeholder="Cargo ou empresa…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar vagas"
              />
            </div>
            <select
              className={styles.select}
              value={ordem}
              onChange={(e) => setOrdem(e.target.value as Ordem)}
              aria-label="Ordenar"
            >
              <option value="recentes">Mais recentes</option>
              <option value="antigas">Mais antigas</option>
              <option value="salario">Maior salário</option>
              <option value="az">Título A–Z</option>
            </select>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.chipLine}>
              <span className={styles.chipLabel}>Fontes</span>
              <div className={styles.chips}>
                <button
                  className={!fonte ? styles.chipOn : styles.chip}
                  onClick={() => setFonte(null)}
                >
                  Todas
                </button>
                {Object.entries(FONTES).map(([k, nome]) => (
                  <button
                    key={k}
                    className={fonte === k ? styles.chipOn : styles.chip}
                    onClick={() => setFonte(fonte === k ? null : k)}
                  >
                    {nome}
                    <span className={styles.chipCount}>{contagemFonte[k] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.chipLine}>
              <span className={styles.chipLabel}>Local</span>
              <div className={styles.chips}>
                <button
                  className={!local ? styles.chipOn : styles.chip}
                  onClick={() => setLocal(null)}
                >
                  Todos
                </button>
                <button
                  className={local === 'caxias' ? styles.chipOn : styles.chip}
                  onClick={() => setLocal(local === 'caxias' ? null : 'caxias')}
                >
                  Caxias do Sul
                  <span className={styles.chipCount}>{contagemLocal.caxias}</span>
                </button>
                <button
                  className={local === 'remoto' ? styles.chipOn : styles.chip}
                  onClick={() => setLocal(local === 'remoto' ? null : 'remoto')}
                >
                  Remoto
                  <span className={styles.chipCount}>{contagemLocal.remoto}</span>
                </button>
              </div>
            </div>

            <div className={styles.chipLine}>
              <span className={styles.chipLabel}>Cargo</span>
              <div className={styles.chips}>
                <button
                  className={!termo ? styles.chipOn : styles.chip}
                  onClick={() => trocarCargo(null)}
                >
                  Todos
                </button>
                {CARGOS.map((c) => (
                  <button
                    key={c.id}
                    className={termo === c.id ? styles.chipOn : styles.chip}
                    onClick={() => trocarCargo(termo === c.id ? null : c.id)}
                  >
                    {c.nome}
                    <span className={styles.chipCount}>{contagemCargo[c.id] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {termo === 'analista' && (
              <div className={styles.chipLine}>
                <span className={styles.chipLabel}>Nível</span>
                <div className={styles.chips}>
                  <button
                    className={!nivel ? styles.chipOn : styles.chip}
                    onClick={() => setNivel(null)}
                  >
                    Todos
                  </button>
                  {(['jr', 'pl', 'sr', 'sem'] as Nivel[]).map((n) => (
                    <button
                      key={n}
                      className={nivel === n ? styles.chipOn : styles.chip}
                      onClick={() => setNivel(nivel === n ? null : n)}
                    >
                      {NIVEL_NOME[n]}
                      <span className={styles.chipCount}>{contagemNivel[n]}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.rightControls}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={soNovas}
                  onChange={(e) => setSoNovas(e.target.checked)}
                />
                Só não vistas
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={soComSalario}
                  onChange={(e) => setSoComSalario(e.target.checked)}
                />
                Só com salário
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={ocultarCand}
                  onChange={(e) => {
                    setOcultarCand(e.target.checked)
                    if (e.target.checked) setSoCand(false)
                  }}
                />
                Ocultar candidatadas
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={soCand}
                  onChange={(e) => {
                    setSoCand(e.target.checked)
                    if (e.target.checked) setOcultarCand(false)
                  }}
                />
                Só candidatadas{candDaqui > 0 ? ` (${candDaqui})` : ''}
              </label>
            </div>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span>
            Mostrando <strong>{filtradas.length}</strong> de{' '}
            {soCand ? `${candDaqui} candidatadas` : `${itens.length} vagas`}
            {encerradasNaLista > 0 && (
              <span className={styles.naoVistasInfo}>
                {', '}{encerradasNaLista} já {encerradasNaLista === 1 ? 'encerrada' : 'encerradas'}
              </span>
            )}
            {naoVistasCount > 0 && (
              <span className={styles.naoVistasInfo}>, {naoVistasCount} não vistas</span>
            )}
          </span>
          <span className={styles.barActions}>
            {naoVistasCount > 0 && (
              <button className={styles.clear} onClick={() => marcarTodasVistas(itens.map((i) => i.key))}>
                Marcar todas como vistas
              </button>
            )}
            {vistas && vistas.size > 0 && (
              <button
                className={styles.clear}
                onClick={() => desmarcarTodasVistas(itens.map((i) => i.key))}
                title="Volta todas para não vistas, para revisar a lista inteira"
              >
                Desmarcar todas
              </button>
            )}
            {temFiltro && (
              <button className={styles.clear} onClick={limpar}>
                Limpar filtros
              </button>
            )}
          </span>
        </div>

        {filtradas.length === 0 ? (
          <div className={styles.empty}>
            <p>Nenhuma vaga com esses filtros.</p>
            {temFiltro && (
              <button className={styles.chipOn} onClick={limpar}>
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className={styles.grid}>
              {mostradas.map((v) => {
                const aplicada = candidatadas.has(v.key)
                // encerrada nunca é "nova": o histórico de vistas só guarda vagas abertas
                const nova = naoVista(v) && !v.encerrada
                const principal = v.fontes[0]
                const cls = [
                  styles.card,
                  aplicada && styles.cardAplicada,
                  nova && styles.cardNova,
                  v.encerrada && styles.cardEncerrada,
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <li key={v.key} className={cls}>
                    <div className={styles.cardHead}>
                      <span className={styles.badges}>
                        {v.fontes.map((f) => (
                          <a
                            key={f.fonte}
                            className={`${styles.badge} ${styles['f_' + f.fonte.replace('.', '_')]}`}
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Ver no ${FONTES[f.fonte] ?? f.fonte}`}
                            onClick={() => marcarVista(v.key)}
                          >
                            {FONTES[f.fonte] ?? f.fonte}
                          </a>
                        ))}
                      </span>
                      <span className={styles.headTags}>
                        {v.encerrada && <span className={styles.encerradaTag}>Encerrada</span>}
                        {aplicada && <span className={styles.candTag}>Candidatada</span>}
                        {nova && !aplicada && <span className={styles.nova}>Nova pra você</span>}
                      </span>
                    </div>
                    <div className={styles.cardCorpo}>
                      <LogoEmpresa empresa={v.empresa} logoUrl={v.logo_url} />
                      <div className={styles.cardTexto}>
                        <a
                          className={styles.cardTitle}
                          href={principal.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => marcarVista(v.key)}
                        >
                          {v.titulo}
                        </a>
                        {v.empresa && <p className={styles.empresa}>{v.empresa}</p>}
                      </div>
                    </div>
                    <div className={styles.meta}>
                      {v.cidade && (
                        <span className={styles.metaItem}>
                          <IconPin /> {v.cidade}
                        </span>
                      )}
                      {v.salario && (
                        <span className={`${styles.metaItem} ${styles.salario}`}>
                          <IconMoney /> {v.salario}
                        </span>
                      )}
                      {rotuloTipo(v.tipo) && (
                        <span className={styles.metaItem}>
                          <IconWork /> {rotuloTipo(v.tipo)}
                        </span>
                      )}
                      {fmtData(v.publicada_em) && (
                        <span className={styles.metaItem}>
                          <IconClock /> {fmtData(v.publicada_em)}
                        </span>
                      )}
                    </div>
                    <div className={styles.cardFoot}>
                      <a
                        className={styles.apply}
                        href={principal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => marcarVista(v.key)}
                      >
                        Ver vaga
                      </a>
                      <span className={styles.checks}>
                        <label className={styles.candCheck} title="Marcar como já visualizada">
                          <input
                            type="checkbox"
                            checked={!nova}
                            onChange={() => toggleVista(v.key)}
                          />
                          Visualizada
                        </label>
                        <label className={styles.candCheck}>
                          <input
                            type="checkbox"
                            checked={aplicada}
                            onChange={() => toggleCand(v.key)}
                          />
                          Me candidatei
                        </label>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
            {visiveis < filtradas.length && (
              <div className={styles.loadMoreWrap}>
                <button
                  className={styles.loadMore}
                  onClick={() => setVisiveis((n) => n + PAGINA)}
                >
                  Carregar mais vagas ({filtradas.length - visiveis} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          Dados públicos de Gupy, LinkedIn, Vagas.com, Jobfy e Indeed, atualização
          automática de hora em hora. Não afiliado às plataformas.
        </div>
      </footer>
    </div>
  )
}
