'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Vaga } from '@/lib/vagas'
import styles from '../page.module.css'

const PAGINA = 30

type Nivel = 'entrada' | 'pleno'
type Local = 'caxias' | 'remoto'

const NIVEL_NOME: Record<Nivel, string> = {
  entrada: 'Entrada (júnior/estágio)',
  pleno: 'Pleno',
}
const LOCAL_NOME: Record<Local, string> = {
  caxias: 'Caxias do Sul',
  remoto: 'Remoto',
}

function nivelDe(v: Vaga): Nivel {
  return /j[úu]nior|\bjr\b|est[áa]gi|trainee|aprendiz|assistente|\bi\b$/i.test(v.titulo)
    ? 'entrada'
    : 'pleno'
}

function localDe(v: Vaga): Local {
  return /caxias/i.test(v.cidade ?? '') ? 'caxias' : 'remoto'
}

function areaDe(v: Vaga): string {
  const t = v.titulo.toLowerCase()
  if (/dados|analytics|\bbi\b|business intelligence/.test(t)) return 'Dados / BI'
  if (/suporte|service desk|noc|help ?desk/.test(t)) return 'Suporte'
  if (/qa|test|qualidade de software/.test(t)) return 'QA / Testes'
  if (/infra|cloud|devops|rede|servidor/.test(t)) return 'Infra / DevOps'
  if (/desenvolv|program|front|back|full ?stack|software|\bdev\b/.test(t)) return 'Desenvolvimento'
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
const IconClock = () => (
  <svg {...svg} aria-hidden>
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 10.6V6h-2v7.4l5 3 1-1.7-4-2.1z" />
  </svg>
)

export default function SimuladoBoard({ vagas }: { vagas: Vaga[] }) {
  const [nivel, setNivel] = useState<Nivel | null>(null)
  const [local, setLocal] = useState<Local | null>(null)
  const [area, setArea] = useState<string | null>(null)
  const [visiveis, setVisiveis] = useState(PAGINA)

  const contagem = useMemo(() => {
    const n: Record<string, number> = {}
    const l: Record<string, number> = {}
    const a: Record<string, number> = {}
    for (const v of vagas) {
      n[nivelDe(v)] = (n[nivelDe(v)] ?? 0) + 1
      l[localDe(v)] = (l[localDe(v)] ?? 0) + 1
      a[areaDe(v)] = (a[areaDe(v)] ?? 0) + 1
    }
    return { n, l, a }
  }, [vagas])

  const areas = useMemo(
    () => Object.entries(contagem.a).sort((x, y) => y[1] - x[1]),
    [contagem],
  )

  const filtradas = useMemo(() => {
    return vagas
      .filter((v) => {
        if (nivel && nivelDe(v) !== nivel) return false
        if (local && localDe(v) !== local) return false
        if (area && areaDe(v) !== area) return false
        return true
      })
      .sort((a, b) => {
        // entrada primeiro: é o que interessa a quem acabou de se formar
        const na = nivelDe(a) === 'entrada' ? 0 : 1
        const nb = nivelDe(b) === 'entrada' ? 0 : 1
        if (na !== nb) return na - nb
        return (b.publicada_em ?? b.capturada_em).localeCompare(a.publicada_em ?? a.capturada_em)
      })
  }, [vagas, nivel, local, area])

  const mostradas = filtradas.slice(0, visiveis)
  const temFiltro = nivel || local || area
  const limpar = () => {
    setNivel(null)
    setLocal(null)
    setArea(null)
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
            ← Painel de vagas
          </Link>
        </div>
      </div>

      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div>
            <h1 className={styles.title}>Simulado: formado em ADS</h1>
            <p className={styles.eyebrow}>
              Vagas de tecnologia em aberto agora que aceitam um recém-formado no
              tecnólogo em Análise e Desenvolvimento de Sistemas.
            </p>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{vagas.length}</strong>
              <span>vagas abertas</span>
            </div>
            <div className={styles.stat}>
              <strong>{contagem.n.entrada ?? 0}</strong>
              <span>nível de entrada</span>
            </div>
            <div className={styles.stat}>
              <strong>{contagem.l.caxias ?? 0}</strong>
              <span>em Caxias</span>
            </div>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.controls}>
          <div className={styles.filterRow}>
            <div className={styles.chipLine}>
              <span className={styles.chipLabel}>Nível</span>
              <div className={styles.chips}>
                <button
                  className={!nivel ? styles.chipOn : styles.chip}
                  onClick={() => setNivel(null)}
                >
                  Todos
                </button>
                {(['entrada', 'pleno'] as Nivel[]).map((n) => (
                  <button
                    key={n}
                    className={nivel === n ? styles.chipOn : styles.chip}
                    onClick={() => setNivel(nivel === n ? null : n)}
                  >
                    {NIVEL_NOME[n]}
                    <span className={styles.chipCount}>{contagem.n[n] ?? 0}</span>
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
                {(['caxias', 'remoto'] as Local[]).map((l) => (
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
          </div>
        </div>

        <div className={styles.resultBar}>
          <span>
            Mostrando <strong>{filtradas.length}</strong> de {vagas.length} vagas
          </span>
          {temFiltro && (
            <button className={styles.clear} onClick={limpar}>
              Limpar filtros
            </button>
          )}
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
                const entrada = nivelDe(v) === 'entrada'
                return (
                  <li
                    key={v.id}
                    className={entrada ? `${styles.card} ${styles.cardNova}` : styles.card}
                  >
                    <div className={styles.cardHead}>
                      <span className={styles.badges}>
                        <span className={`${styles.badge} ${styles.f_gupy}`}>
                          {areaDe(v)}
                        </span>
                      </span>
                      <span className={styles.headTags}>
                        {entrada && <span className={styles.nova}>Nível de entrada</span>}
                      </span>
                    </div>
                    <a
                      className={styles.cardTitle}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {v.titulo}
                    </a>
                    {v.empresa && <p className={styles.empresa}>{v.empresa}</p>}
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
                  Carregar mais vagas ({filtradas.length - visiveis} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          Simulação com vagas públicas reais da Gupy, em Caxias do Sul e remotas.
          Exclui posições sênior, de especialista e de gestão. Não afiliado às plataformas.
        </div>
      </footer>
    </div>
  )
}
