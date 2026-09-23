'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  FONTES,
  INGLES_NOME,
  PATH_ESTAGIO,
  PATH_EXEC_ESTAGIO,
  buscarCandidatadas,
  chaveVaga,
  fetchAoVivo,
  fetchAoVivoTodas,
  rotuloTipo,
  type Execucao,
  type Vaga,
} from '@/lib/vagas'
import LogoEmpresa from '../LogoEmpresa'
import PainelSync from '../PainelSync'
import { usePrefs } from '../usePrefs'
import styles from '../page.module.css'

const PAGINA = 30
const INTERVALO_MS = 60 * 1000

type Ordem = 'recentes' | 'antigas' | 'az' | 'salario'

// título que sugere vaga para quem está começando o curso
const COMECO =
  /1[ºo°]?\s*(a|ao)?\s*\d?[ºo°]?\s*semestre|primeiro semestre|in[íi]cio (de|do) curso|sem experi[êe]ncia|banco de talentos|primeiro emprego/i

// Cada fonte escreve o local de um jeito ("Canoas, RS", "Canoas - RS",
// "Greater Porto Alegre"): o filtro mostra só o nome da cidade.
function cidadeDe(v: Vaga): string {
  const onde = `${v.cidade ?? ''} ${v.tipo ?? ''}`
  // o LinkedIn não garante o remoto: só vira "Remoto" quando a descrição confirma
  if (/a confirmar/i.test(v.cidade ?? '')) return 'Remoto a confirmar'
  if (/remoto|remote|home ?office/i.test(onde)) return 'Remoto'
  const nome = (v.cidade ?? '')
    .split(/[,–]|\s-\s/)[0]
    .replace(/^greater\s+/i, '')
    .replace(/^regi[ãa]o metropolitana de\s+/i, '')
    .replace(/\s+e\s+regi[ãa]o$/i, '')
    .trim()
  return nome || 'Sem cidade'
}

// enquanto o enriquecedor não leu a descrição, o nível fica como desconhecido
function inglesDe(v: Vaga): string {
  return v.ingles ?? 'desconhecido'
}

function areaDe(v: Vaga): string {
  const t = v.titulo.toLowerCase()
  if (/dados|analytics|\bbi\b|business intelligence|\bdata\b/.test(t)) return 'Dados / BI'
  if (/suporte|service desk|noc|help ?desk/.test(t)) return 'Suporte'
  if (/\bqa\b|test|qualidade de software/.test(t)) return 'QA / Testes'
  if (/infra|cloud|devops|\brede/.test(t)) return 'Infra / Redes'
  if (/desenvolv|program|front|back|full ?stack|software|\bdev\b|web|mobile|android|ios\b/.test(t))
    return 'Desenvolvimento'
  return 'Sistemas / Outros'
}

function salarioNum(v: Vaga): number {
  if (!v.salario) return -1
  const m = String(v.salario).match(/[\d.]+(?:,\d{2})?/)
  if (!m) return -1
  return parseFloat(m[0].replace(/\./g, '').replace(',', '.')) || -1
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

function haQuantoTempo(ms: number | null, agora: number): string {
  if (!ms) return 'agora'
  const s = Math.max(0, Math.round((agora - ms) / 1000))
  if (s < 60) return 'há instantes'
  const m = Math.round(s / 60)
  if (m < 60) return `há ${m} min`
  return `há ${Math.round(m / 60)} h`
}

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
const IconFala = () => (
  <svg {...svg} aria-hidden>
    <path d="M12 3c-4.97 0-9 3.13-9 7 0 1.9.98 3.62 2.56 4.88L5 21l4.6-2.3c.77.2 1.57.3 2.4.3 4.97 0 9-3.13 9-7s-4.03-9-9-9z" />
  </svg>
)
const IconSearch = () => (
  <svg {...svg} aria-hidden>
    <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
  </svg>
)

export default function EstagioBoard({
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
  const [local, setLocal] = useState<string | null>(null)
  const [area, setArea] = useState<string | null>(null)
  const [fonte, setFonte] = useState<string | null>(null)
  const [ingles, setIngles] = useState<string | null>(null)
  const [soComeco, setSoComeco] = useState(false)
  const [soNovas, setSoNovas] = useState(false)
  const [soComSalario, setSoComSalario] = useState(false)
  const [ocultarCand, setOcultarCand] = useState(false)
  const [soCand, setSoCand] = useState(false)
  const [vagasCand, setVagasCand] = useState<Vaga[]>([])
  const [ordem, setOrdem] = useState<Ordem>('recentes')
  const [mostrarSync, setMostrarSync] = useState(false)
  const [visiveis, setVisiveis] = useState(PAGINA)

  const chave = (v: Vaga) => chaveVaga(v.titulo, v.empresa)

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
  } = usePrefs(vagas.map(chave))

  // a página é estática, então a lista é reconferida no banco de tempos em tempos
  const atualizar = useCallback(async (manual = false) => {
    if (!manual && document.hidden) return
    if (buscandoRef.current) return
    buscandoRef.current = true
    setAtualizando(true)
    try {
      const [novas, exec] = await Promise.all([
        fetchAoVivoTodas<Vaga>(PATH_ESTAGIO),
        fetchAoVivo<{ executada_em: string; encontradas: number; inseridas: number }>(
          PATH_EXEC_ESTAGIO,
        ),
      ])
      if (novas) {
        setVagas(novas)
        setErroRede(false)
      } else {
        setErroRede(true)
      }
      const u = exec?.[0]
      if (u) {
        setUltima({
          executada_em: u.executada_em,
          novas_vagas: u.inseridas,
          total_encontradas: u.encontradas,
        })
      }
      setChecadoEm(Date.now())
    } catch {
      setErroRede(true)
    } finally {
      buscandoRef.current = false
      setAtualizando(false)
    }
  }, [])

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

  // relógio do "verificado há X"
  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 15000)
    return () => clearInterval(id)
  }, [])

  // "Só candidatadas" também mostra os estágios que já encerraram, que a página não carrega
  useEffect(() => {
    if (candidatadas.size === 0) {
      setVagasCand([])
      return
    }
    let cancelado = false
    buscarCandidatadas([...candidatadas]).then((r) => {
      if (!cancelado && r) setVagasCand(r.filter((v) => v.termo_busca === 'estagio-ads'))
    })
    return () => {
      cancelado = true
    }
  }, [candidatadas])

  const lista = useMemo(() => {
    if (!soCand) return vagas
    const mapa = new Map<string, Vaga>()
    for (const v of [...vagas, ...vagasCand]) mapa.set(`${v.fonte}|${v.id}`, v)
    return [...mapa.values()]
  }, [soCand, vagas, vagasCand])

  // o histórico é o mesmo das duas abas: aqui só contam as candidaturas de estágio
  const candDaqui = useMemo(() => new Set(vagasCand.map(chave)).size, [vagasCand])

  const naoVista = (v: Vaga) => (vistas ? !vistas.has(chave(v)) : false)

  const naoVistasCount = useMemo(
    () => (vistas ? vagas.filter((v) => !vistas.has(chave(v))).length : 0),
    [vagas, vistas],
  )

  const contagem = useMemo(() => {
    const l: Record<string, number> = {}
    const a: Record<string, number> = {}
    const f: Record<string, number> = {}
    const i: Record<string, number> = {}
    let comeco = 0
    for (const v of vagas) {
      l[cidadeDe(v)] = (l[cidadeDe(v)] ?? 0) + 1
      a[areaDe(v)] = (a[areaDe(v)] ?? 0) + 1
      f[v.fonte] = (f[v.fonte] ?? 0) + 1
      i[inglesDe(v)] = (i[inglesDe(v)] ?? 0) + 1
      if (COMECO.test(v.titulo)) comeco++
    }
    return { l, a, f, i, comeco }
  }, [vagas])

  // só entram cidades que têm vaga; remoto fica por último
  const cidades = useMemo(
    () =>
      Object.entries(contagem.l).sort((x, y) => {
        const peso = (c: string) => (c === 'Remoto a confirmar' ? 2 : c === 'Remoto' ? 1 : 0)
        if (peso(x[0]) !== peso(y[0])) return peso(x[0]) - peso(y[0])
        return y[1] - x[1]
      }),
    [contagem],
  )

  const areas = useMemo(
    () => Object.entries(contagem.a).sort((x, y) => y[1] - x[1]),
    [contagem],
  )
  const fontes = useMemo(
    () => Object.entries(contagem.f).sort((x, y) => y[1] - x[1]),
    [contagem],
  )

  // do mais fácil para o mais exigente, com o pendente no fim
  const ORDEM_INGLES = ['nao_pede', 'basico', 'intermediario', 'avancado', 'mencionado', 'desconhecido']
  const niveis = useMemo(
    () =>
      ORDEM_INGLES.filter((n) => contagem.i[n]).map((n) => [n, contagem.i[n]] as [string, number]),
    [contagem],
  )

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const r = lista.filter((v) => {
      const k = chave(v)
      if (soCand && !candidatadas.has(k)) return false
      if (local && cidadeDe(v) !== local) return false
      if (area && areaDe(v) !== area) return false
      if (fonte && v.fonte !== fonte) return false
      if (ingles && inglesDe(v) !== ingles) return false
      if (soComeco && !COMECO.test(v.titulo)) return false
      if (soNovas && !naoVista(v)) return false
      if (soComSalario && !v.salario) return false
      if (ocultarCand && candidatadas.has(k)) return false
      if (q && !`${v.titulo} ${v.empresa ?? ''} ${v.cidade ?? ''}`.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
    return [...r].sort((a, b) => {
      if (ordem === 'az') return a.titulo.localeCompare(b.titulo, 'pt-BR')
      if (ordem === 'salario') return salarioNum(b) - salarioNum(a)
      // perto primeiro: Canoas, depois as outras cidades, depois remoto
      const peso = (v: Vaga) => {
        const c = cidadeDe(v)
        return c === 'Canoas' ? 0 : c === 'Remoto' ? 2 : 1
      }
      if (ordem === 'recentes' && peso(a) !== peso(b)) return peso(a) - peso(b)
      const ta = new Date(a.publicada_em ?? a.capturada_em).getTime()
      const tb = new Date(b.publicada_em ?? b.capturada_em).getTime()
      return ordem === 'antigas' ? ta - tb : tb - ta
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, busca, local, area, fonte, ingles, soComeco, soNovas, soComSalario, ocultarCand, soCand, candidatadas, vistas, ordem])

  useEffect(() => {
    setVisiveis(PAGINA)
  }, [busca, local, area, fonte, ingles, soComeco, soNovas, soComSalario, ocultarCand, soCand, ordem])

  const mostradas = filtradas.slice(0, visiveis)
  const encerradasNaLista = soCand ? filtradas.filter((v) => v.ativa === false).length : 0
  const temFiltro = Boolean(
    busca || local || area || fonte || ingles || soComeco || soNovas || soComSalario || ocultarCand || soCand,
  )
  const limpar = () => {
    setBusca('')
    setLocal(null)
    setArea(null)
    setFonte(null)
    setIngles(null)
    setSoComeco(false)
    setSoNovas(false)
    setSoComSalario(false)
    setOcultarCand(false)
    setSoCand(false)
  }

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
          <Link href="/" className={styles.navLink}>
            Painel de Caxias
          </Link>
        </div>
      </div>

      {mostrarSync && <PainelSync codigo={codigo} usarCodigo={usarCodigo} />}

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1 className={styles.title}>Estágio em ADS, Canoas e região</h1>
            <p className={styles.eyebrow}>
              <IconPin /> Canoas, região metropolitana de Porto Alegre e vagas remotas
            </p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{vagas.length}</strong>
              <span>estágios abertos</span>
            </div>
            <div className={styles.stat}>
              <strong>{naoVistasCount}</strong>
              <span>ainda não vistos</span>
            </div>
            <div className={styles.stat}>
              <strong>{contagem.l.Remoto ?? 0}</strong>
              <span>remotos confirmados</span>
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
                  title="Conferir estágios agora"
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
              <span className={styles.searchIcon}>
                <IconSearch />
              </span>
              <input
                className={styles.search}
                placeholder="Cargo ou empresa..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                aria-label="Buscar estágio"
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
              <option value="az">Título A-Z</option>
              <option value="salario">Maior bolsa</option>
            </select>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.chipLine}>
              <span className={styles.chipLabel}>Local</span>
              <div className={styles.chips}>
                <button
                  className={!local ? styles.chipOn : styles.chip}
                  onClick={() => setLocal(null)}
                >
                  Todos
                </button>
                {cidades.map(([c, n]) => (
                  <button
                    key={c}
                    className={local === c ? styles.chipOn : styles.chip}
                    onClick={() => setLocal(local === c ? null : c)}
                  >
                    {c}
                    <span className={styles.chipCount}>{n}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.chipLine}>
              <span className={styles.chipLabel}>Área</span>
              <div className={styles.chips}>
                <button
                  className={!area ? styles.chipOn : styles.chip}
                  onClick={() => setArea(null)}
                >
                  Todas
                </button>
                {areas.map(([a, n]) => (
                  <button
                    key={a}
                    className={area === a ? styles.chipOn : styles.chip}
                    onClick={() => setArea(area === a ? null : a)}
                  >
                    {a}
                    <span className={styles.chipCount}>{n}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.chipLine}>
              <span className={styles.chipLabel}>Fonte</span>
              <div className={styles.chips}>
                <button
                  className={!fonte ? styles.chipOn : styles.chip}
                  onClick={() => setFonte(null)}
                >
                  Todas
                </button>
                {fontes.map(([f, n]) => (
                  <button
                    key={f}
                    className={fonte === f ? styles.chipOn : styles.chip}
                    onClick={() => setFonte(fonte === f ? null : f)}
                  >
                    {FONTES[f] ?? f}
                    <span className={styles.chipCount}>{n}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.chipLine}>
              <span className={styles.chipLabel}>Inglês</span>
              <div className={styles.chips}>
                <button
                  className={!ingles ? styles.chipOn : styles.chip}
                  onClick={() => setIngles(null)}
                >
                  Tanto faz
                </button>
                {niveis.map(([n, q]) => (
                  <button
                    key={n}
                    className={ingles === n ? styles.chipOn : styles.chip}
                    onClick={() => setIngles(ingles === n ? null : n)}
                  >
                    {INGLES_NOME[n] ?? n}
                    <span className={styles.chipCount}>{q}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.rightControls}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={soComeco}
                  onChange={(e) => setSoComeco(e.target.checked)}
                />
                Começo de curso ({contagem.comeco})
              </label>
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
                Só com bolsa
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={ocultarCand}
                  onChange={(e) => setOcultarCand(e.target.checked)}
                />
                Ocultar candidatadas
              </label>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={soCand}
                  onChange={(e) => setSoCand(e.target.checked)}
                />
                Só candidatadas{candDaqui > 0 ? ` (${candDaqui})` : ''}
              </label>
            </div>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span>
            Mostrando <strong>{filtradas.length}</strong> de{' '}
            {soCand ? `${candDaqui} candidatadas` : `${vagas.length} estágios`}
            {encerradasNaLista > 0 && (
              <span className={styles.naoVistasInfo}>
                {', '}
                {encerradasNaLista} já {encerradasNaLista === 1 ? 'encerrada' : 'encerradas'}
              </span>
            )}
            {naoVistasCount > 0 && (
              <span className={styles.naoVistasInfo}>, {naoVistasCount} não vistas</span>
            )}
          </span>
          <span className={styles.barActions}>
            {naoVistasCount > 0 && (
              <button className={styles.clear} onClick={() => marcarTodasVistas(vagas.map(chave))}>
                Marcar todas como vistas
              </button>
            )}
            {vistas && vistas.size > 0 && (
              <button
                className={styles.clear}
                onClick={() => desmarcarTodasVistas(vagas.map(chave))}
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
            <p>Nenhum estágio com esses filtros.</p>
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
                const k = chave(v)
                const aplicada = candidatadas.has(k)
                const nova = naoVista(v)
                const comeco = COMECO.test(v.titulo)
                const encerrada = v.ativa === false
                const cls = [
                  styles.card,
                  encerrada && styles.cardEncerrada,
                  aplicada && styles.cardAplicada,
                  !aplicada && !encerrada && (nova || comeco) && styles.cardNova,
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <li key={v.id} className={cls}>
                    <div className={styles.cardHead}>
                      <span className={styles.badges}>
                        <a
                          className={`${styles.badge} ${styles['f_' + v.fonte.replace('.', '_')]}`}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => marcarVista(k)}
                        >
                          {FONTES[v.fonte] ?? v.fonte}
                        </a>
                        <span className={styles.badge}>{areaDe(v)}</span>
                      </span>
                      <span className={styles.headTags}>
                        {encerrada && <span className={styles.encerradaTag}>Encerrada</span>}
                        {aplicada && <span className={styles.candTag}>Candidatada</span>}
                        {comeco && !aplicada && (
                          <span className={styles.nova}>Começo de curso</span>
                        )}
                        {nova && !aplicada && !comeco && (
                          <span className={styles.nova}>Novo pra você</span>
                        )}
                      </span>
                    </div>

                    <div className={styles.cardCorpo}>
                      <LogoEmpresa empresa={v.empresa} logoUrl={v.logo_url} />
                      <div className={styles.cardTexto}>
                        <a
                          className={styles.cardTitle}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => marcarVista(k)}
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
                      {v.ingles && (
                        <span className={styles.metaItem}>
                          <IconFala /> {INGLES_NOME[v.ingles] ?? v.ingles}
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
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => marcarVista(k)}
                      >
                        Ver vaga
                      </a>
                      <span className={styles.checks}>
                        <label className={styles.candCheck}>
                          <input
                            type="checkbox"
                            checked={!nova}
                            onChange={() => toggleVista(k)}
                          />
                          Visualizada
                        </label>
                        <label className={styles.candCheck}>
                          <input
                            type="checkbox"
                            checked={aplicada}
                            onChange={() => toggleCand(k)}
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
                  Carregar mais ({filtradas.length - visiveis} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          Estágios de tecnologia em Canoas, na região metropolitana de Porto Alegre e
          remotos, de Gupy, LinkedIn, Vagas.com, Jobfy e Indeed. Coleta diária. Não
          afiliado às plataformas.
        </div>
      </footer>
    </div>
  )
}
