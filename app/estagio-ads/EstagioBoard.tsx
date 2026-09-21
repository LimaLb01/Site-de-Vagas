'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { FONTES, rotuloTipo, type Vaga } from '@/lib/vagas'
import LogoEmpresa from '../LogoEmpresa'
import styles from '../page.module.css'

const PAGINA = 30

type Local = 'canoas' | 'regiao' | 'remoto'
const LOCAL_NOME: Record<Local, string> = {
  canoas: 'Canoas',
  regiao: 'Região metropolitana',
  remoto: 'Remoto',
}

// título que sugere vaga para quem está começando o curso
const COMECO =
  /1[ºo°]?\s*(a|ao)?\s*\d?[ºo°]?\s*semestre|primeiro semestre|in[íi]cio (de|do) curso|sem experi[êe]ncia|banco de talentos|primeiro emprego/i

function localDe(v: Vaga): Local {
  const onde = `${v.cidade ?? ''} ${v.tipo ?? ''}`
  if (/remoto|remote|home ?office/i.test(onde)) return 'remoto'
  if (/canoas/i.test(onde)) return 'canoas'
  return 'regiao'
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

function fmtData(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
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
const IconSearch = () => (
  <svg {...svg} aria-hidden>
    <path d="M15.5 14h-.8l-.3-.3a6.5 6.5 0 1 0-.7.7l.3.3v.8l5 5 1.5-1.5-5-5zm-6 0a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" />
  </svg>
)

export default function EstagioBoard({ vagas }: { vagas: Vaga[] }) {
  const [busca, setBusca] = useState('')
  const [local, setLocal] = useState<Local | null>(null)
  const [area, setArea] = useState<string | null>(null)
  const [fonte, setFonte] = useState<string | null>(null)
  const [soComeco, setSoComeco] = useState(false)
  const [visiveis, setVisiveis] = useState(PAGINA)

  const contagem = useMemo(() => {
    const l: Record<string, number> = {}
    const a: Record<string, number> = {}
    const f: Record<string, number> = {}
    let comeco = 0
    for (const v of vagas) {
      l[localDe(v)] = (l[localDe(v)] ?? 0) + 1
      a[areaDe(v)] = (a[areaDe(v)] ?? 0) + 1
      f[v.fonte] = (f[v.fonte] ?? 0) + 1
      if (COMECO.test(v.titulo)) comeco++
    }
    return { l, a, f, comeco }
  }, [vagas])

  const areas = useMemo(
    () => Object.entries(contagem.a).sort((x, y) => y[1] - x[1]),
    [contagem],
  )
  const fontes = useMemo(
    () => Object.entries(contagem.f).sort((x, y) => y[1] - x[1]),
    [contagem],
  )

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    return vagas
      .filter((v) => {
        if (local && localDe(v) !== local) return false
        if (area && areaDe(v) !== area) return false
        if (fonte && v.fonte !== fonte) return false
        if (soComeco && !COMECO.test(v.titulo)) return false
        if (q && !`${v.titulo} ${v.empresa ?? ''}`.toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => {
        // perto primeiro: Canoas, depois região, depois remoto
        const peso = (v: Vaga) => (localDe(v) === 'canoas' ? 0 : localDe(v) === 'regiao' ? 1 : 2)
        if (peso(a) !== peso(b)) return peso(a) - peso(b)
        return (b.publicada_em ?? b.capturada_em).localeCompare(a.publicada_em ?? a.capturada_em)
      })
  }, [vagas, busca, local, area, fonte, soComeco])

  const mostradas = filtradas.slice(0, visiveis)
  const temFiltro = Boolean(local || area || fonte || soComeco || busca)
  const limpar = () => {
    setBusca('')
    setLocal(null)
    setArea(null)
    setFonte(null)
    setSoComeco(false)
    setVisiveis(PAGINA)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <span className={styles.logo} aria-hidden>
            VC
          </span>
          <span className={styles.brand}>Vagas Caxias do Sul</span>
          <Link href="/" className={styles.navLink}>
            Painel de Caxias
          </Link>
        </div>
      </div>

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
              <strong>{(contagem.l.canoas ?? 0) + (contagem.l.regiao ?? 0)}</strong>
              <span>na região</span>
            </div>
            <div className={styles.stat}>
              <strong>{contagem.l.remoto ?? 0}</strong>
              <span>remotos</span>
            </div>
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
                onChange={(e) => {
                  setBusca(e.target.value)
                  setVisiveis(PAGINA)
                }}
                aria-label="Buscar estágio"
              />
            </div>
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
                {(['canoas', 'regiao', 'remoto'] as Local[]).map((l) => (
                  <button
                    key={l}
                    className={local === l ? styles.chipOn : styles.chip}
                    onClick={() => setLocal(local === l ? null : l)}
                  >
                    {LOCAL_NOME[l]}
                    <span className={styles.chipCount}>{contagem.l[l] ?? 0}</span>
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

            <div className={styles.rightControls}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={soComeco}
                  onChange={(e) => setSoComeco(e.target.checked)}
                />
                Começo de curso ({contagem.comeco})
              </label>
            </div>
          </div>
        </div>

        <div className={styles.resultBar}>
          <span>
            Mostrando <strong>{filtradas.length}</strong> de {vagas.length} estágios
          </span>
          {temFiltro && (
            <span className={styles.barActions}>
              <button className={styles.clear} onClick={limpar}>
                Limpar filtros
              </button>
            </span>
          )}
        </div>

        {filtradas.length === 0 ? (
          <div className={styles.empty}>
            <p>Nenhum estágio com esses filtros.</p>
            {temFiltro && (
              <button className={styles.clear} onClick={limpar}>
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className={styles.grid}>
              {mostradas.map((v) => {
                const comeco = COMECO.test(v.titulo)
                return (
                  <li
                    key={v.id}
                    className={comeco ? `${styles.card} ${styles.cardNova}` : styles.card}
                  >
                    <div className={styles.cardHead}>
                      <span className={styles.badges}>
                        <a
                          className={`${styles.badge} ${styles['f_' + v.fonte.replace('.', '_')]}`}
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {FONTES[v.fonte] ?? v.fonte}
                        </a>
                        <span className={styles.badge}>{areaDe(v)}</span>
                      </span>
                      <span className={styles.headTags}>
                        {comeco && <span className={styles.nova}>Começo de curso</span>}
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
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Ver vaga
                      </a>
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
          remotos, de Gupy, LinkedIn, Vagas.com e Indeed. Coleta diária. Não afiliado
          às plataformas.
        </div>
      </footer>
    </div>
  )
}
