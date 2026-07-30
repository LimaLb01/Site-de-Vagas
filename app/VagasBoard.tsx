'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  FONTES,
  PATH_VAGAS,
  PATH_EXECUCAO,
  fetchAoVivo,
  type Vaga,
  type Execucao,
} from '@/lib/vagas'
import styles from './page.module.css'

const LS_CAND = 'vagas_candidatadas_v1'
const LS_VISTAS = 'vagas_vistas_v1'
const PAGINA = 30

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
  termo_busca: string | null
  publicada_em: string | null
  capturada_em: string
  fontes: Fonte[]
}

function norm(s: string | null): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// junta a mesma vaga vinda de fontes diferentes num card só
function mesclar(vagas: Vaga[]): VagaMerged[] {
  const mapa = new Map<string, VagaMerged>()
  for (const v of vagas) {
    const key = `${norm(v.titulo)}|${norm(v.empresa)}`
    const ex = mapa.get(key)
    if (!ex) {
      mapa.set(key, {
        key,
        titulo: v.titulo,
        empresa: v.empresa,
        cidade: v.cidade,
        tipo: v.tipo,
        salario: v.salario,
        termo_busca: v.termo_busca,
        publicada_em: v.publicada_em,
        capturada_em: v.capturada_em,
        fontes: [{ fonte: v.fonte, url: v.url }],
      })
    } else {
      if (!ex.fontes.some((f) => f.fonte === v.fonte)) ex.fontes.push({ fonte: v.fonte, url: v.url })
      if (!ex.salario && v.salario) ex.salario = v.salario
      if (!ex.tipo && v.tipo) ex.tipo = v.tipo
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

const INTERVALO_MS = 3 * 60 * 1000

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
  const [busca, setBusca] = useState('')
  const [fonte, setFonte] = useState<string | null>(null)
  const [termo, setTermo] = useState<string | null>(null)
  const [nivel, setNivel] = useState<Nivel | null>(null)
  const [soNovas, setSoNovas] = useState(false)
  const [soComSalario, setSoComSalario] = useState(false)
  const [ocultarCand, setOcultarCand] = useState(false)
  const [ordem, setOrdem] = useState<Ordem>('recentes')
  const [candidatadas, setCandidatadas] = useState<Set<string>>(new Set())
  const [vistas, setVistas] = useState<Set<string> | null>(null)
  const [visiveis, setVisiveis] = useState(PAGINA)

  const itens = useMemo(() => mesclar(vagas), [vagas])

  // mantém a lista fresca sozinha: a cada 3 min e ao voltar para a aba
  useEffect(() => {
    let vivo = true
    const atualiza = async () => {
      if (document.hidden) return
      setAtualizando(true)
      const [novas, exec] = await Promise.all([
        fetchAoVivo<Vaga>(PATH_VAGAS),
        fetchAoVivo<Execucao>(PATH_EXECUCAO),
      ])
      if (!vivo) return
      if (novas) setVagas(novas)
      if (exec && exec[0]) setUltima(exec[0])
      setAtualizando(false)
    }
    const id = setInterval(atualiza, INTERVALO_MS)
    const aoVoltar = () => {
      if (!document.hidden) atualiza()
    }
    document.addEventListener('visibilitychange', aoVoltar)
    window.addEventListener('focus', aoVoltar)
    return () => {
      vivo = false
      clearInterval(id)
      document.removeEventListener('visibilitychange', aoVoltar)
      window.removeEventListener('focus', aoVoltar)
    }
  }, [])

  // carrega "me candidatei" do localStorage (por navegador)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_CAND)
      if (raw) setCandidatadas(new Set(JSON.parse(raw) as string[]))
    } catch {}
  }, [])

  // carrega "já vistas". Primeira visita: marca tudo como visto (baseline),
  // assim só o que aparecer depois é destacado como novo pra você.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_VISTAS)
      const salvas = raw ? (JSON.parse(raw) as string[]) : null
      // lista vazia (falha de rede): não mexe no que já está salvo
      if (itens.length === 0) {
        setVistas(new Set(salvas ?? []))
        return
      }
      if (salvas) {
        // descarta chaves de vagas que já saíram do ar (evita crescer sem limite)
        const atuais = new Set(itens.map((i) => i.key))
        const podadas = salvas.filter((k) => atuais.has(k))
        localStorage.setItem(LS_VISTAS, JSON.stringify(podadas))
        setVistas(new Set(podadas))
      } else {
        const todas = itens.map((i) => i.key)
        localStorage.setItem(LS_VISTAS, JSON.stringify(todas))
        setVistas(new Set(todas))
      }
    } catch {
      setVistas(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const gravaVistas = (s: Set<string>) => {
    setVistas(s)
    try {
      localStorage.setItem(LS_VISTAS, JSON.stringify([...s]))
    } catch {}
  }

  const marcarVista = (key: string) => {
    if (!vistas || vistas.has(key)) return
    const n = new Set(vistas)
    n.add(key)
    gravaVistas(n)
  }

  const marcarTodasVistas = () => {
    gravaVistas(new Set(itens.map((i) => i.key)))
  }

  // antes de carregar o localStorage, não marca nada como novo (evita piscar)
  const naoVista = (v: VagaMerged) => (vistas ? !vistas.has(v.key) : false)

  const toggleCand = (key: string) => {
    setCandidatadas((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      try {
        localStorage.setItem(LS_CAND, JSON.stringify([...n]))
      } catch {}
      return n
    })
  }

  const naoVistasCount = useMemo(
    () => (vistas ? itens.filter((i) => !vistas.has(i.key)).length : 0),
    [itens, vistas],
  )

  const contagemFonte = useMemo(() => {
    const c: Record<string, number> = {}
    for (const v of itens) for (const f of v.fontes) c[f.fonte] = (c[f.fonte] ?? 0) + 1
    return c
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

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let r = itens.filter((v) => {
      if (fonte && !v.fontes.some((f) => f.fonte === fonte)) return false
      if (termo && v.termo_busca !== termo) return false
      if (termo === 'analista' && nivel && nivelDe(v) !== nivel) return false
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
  }, [itens, busca, fonte, termo, nivel, soNovas, soComSalario, ocultarCand, candidatadas, vistas, ordem])

  // reseta a paginação quando os filtros mudam
  useEffect(() => {
    setVisiveis(PAGINA)
  }, [busca, fonte, termo, nivel, soNovas, soComSalario, ocultarCand, ordem])

  const mostradas = filtradas.slice(0, visiveis)

  const limpar = () => {
    setBusca('')
    setFonte(null)
    setTermo(null)
    setNivel(null)
    setSoNovas(false)
    setSoComSalario(false)
    setOcultarCand(false)
  }
  const temFiltro = busca || fonte || termo || nivel || soNovas || soComSalario || ocultarCand

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Caxias do Sul · RS</p>
          <h1 className={styles.title}>Vagas de Assistente e Analista</h1>
          <p className={styles.subtitle}>
            Painel automático atualizado de hora em hora a partir de Gupy, LinkedIn,
            Vagas.com, Jobfy e Indeed.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{itens.length}</strong>
              <span>vagas ativas</span>
            </div>
            <div className={styles.stat}>
              <strong>{naoVistasCount}</strong>
              <span>ainda não vistas</span>
            </div>
            {ultima && (
              <div className={styles.stat}>
                <strong>
                  {fmtHora(ultima.executada_em)}
                  <span className={atualizando ? styles.pulseOn : styles.pulse} aria-hidden />
                </strong>
                <span>{fmtData(ultima.executada_em)} · última atualização</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon} aria-hidden>
              ⌕
            </span>
            <input
              className={styles.search}
              type="search"
              placeholder="Buscar por cargo, empresa…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar vagas"
            />
          </div>

          <div className={styles.filterRow}>
            <div className={styles.chips}>
              <button
                className={!fonte ? styles.chipOn : styles.chip}
                onClick={() => setFonte(null)}
              >
                Todas fontes
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

            <div className={styles.chips}>
              <button
                className={!termo ? styles.chipOn : styles.chip}
                onClick={() => trocarCargo(null)}
              >
                Todos cargos
              </button>
              <button
                className={termo === 'assistente' ? styles.chipOn : styles.chip}
                onClick={() => trocarCargo(termo === 'assistente' ? null : 'assistente')}
              >
                Assistente
              </button>
              <button
                className={termo === 'analista' ? styles.chipOn : styles.chip}
                onClick={() => trocarCargo(termo === 'analista' ? null : 'analista')}
              >
                Analista
              </button>
            </div>

            {termo === 'analista' && (
              <div className={styles.chips}>
                <button
                  className={!nivel ? styles.chipOn : styles.chip}
                  onClick={() => setNivel(null)}
                >
                  Todos níveis
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
                  onChange={(e) => setOcultarCand(e.target.checked)}
                />
                Ocultar candidatadas
              </label>
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
          </div>

          <div className={styles.resultBar}>
            <span>
              {filtradas.length} de {itens.length} vagas
              {naoVistasCount > 0 && (
                <span className={styles.naoVistasInfo}> · {naoVistasCount} não vistas</span>
              )}
            </span>
            <span className={styles.barActions}>
              {naoVistasCount > 0 && (
                <button className={styles.clear} onClick={marcarTodasVistas}>
                  Marcar todas como vistas
                </button>
              )}
              {temFiltro && (
                <button className={styles.clear} onClick={limpar}>
                  Limpar filtros
                </button>
              )}
            </span>
          </div>
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
                const nova = naoVista(v)
                const principal = v.fontes[0]
                const cls = [styles.card, aplicada && styles.cardAplicada, nova && styles.cardNova]
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
                        {aplicada && <span className={styles.candTag}>CANDIDATADA</span>}
                        {nova && <span className={styles.nova}>NOVA PRA VOCÊ</span>}
                      </span>
                    </div>
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
                    <div className={styles.meta}>
                      {v.cidade && <span>📍 {v.cidade}</span>}
                      {v.salario && <span className={styles.salario}>💰 {v.salario}</span>}
                      {v.tipo && <span>{v.tipo}</span>}
                      {fmtData(v.publicada_em) && <span>{fmtData(v.publicada_em)}</span>}
                    </div>
                    <div className={styles.cardFoot}>
                      <a
                        className={styles.apply}
                        href={principal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => marcarVista(v.key)}
                      >
                        Ver vaga →
                      </a>
                      <label className={styles.candCheck}>
                        <input
                          type="checkbox"
                          checked={aplicada}
                          onChange={() => toggleCand(v.key)}
                        />
                        Me candidatei
                      </label>
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
        <p>
          Dados públicos de Gupy, LinkedIn, Vagas.com, Jobfy e Indeed · atualização
          automática de hora em hora. Não afiliado às plataformas.
        </p>
      </footer>
    </div>
  )
}
