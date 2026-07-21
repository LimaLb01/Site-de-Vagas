'use client'

import { useMemo, useState } from 'react'
import { FONTES, type Vaga, type Execucao } from '@/lib/vagas'
import styles from './page.module.css'

const DIA = 24 * 60 * 60 * 1000

function ehNova(v: Vaga): boolean {
  return Date.now() - new Date(v.capturada_em).getTime() < DIA
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

type Ordem = 'recentes' | 'antigas' | 'az'

export default function VagasBoard({
  vagas,
  ultima,
}: {
  vagas: Vaga[]
  ultima: Execucao | null
}) {
  const [busca, setBusca] = useState('')
  const [fonte, setFonte] = useState<string | null>(null)
  const [termo, setTermo] = useState<string | null>(null)
  const [soNovas, setSoNovas] = useState(false)
  const [ordem, setOrdem] = useState<Ordem>('recentes')

  const novas24h = useMemo(() => vagas.filter(ehNova).length, [vagas])

  const contagemFonte = useMemo(() => {
    const c: Record<string, number> = {}
    for (const v of vagas) c[v.fonte] = (c[v.fonte] ?? 0) + 1
    return c
  }, [vagas])

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    let r = vagas.filter((v) => {
      if (fonte && v.fonte !== fonte) return false
      if (termo && v.termo_busca !== termo) return false
      if (soNovas && !ehNova(v)) return false
      if (q) {
        const alvo = `${v.titulo} ${v.empresa ?? ''} ${v.cidade ?? ''}`.toLowerCase()
        if (!alvo.includes(q)) return false
      }
      return true
    })
    r = [...r].sort((a, b) => {
      if (ordem === 'az') return a.titulo.localeCompare(b.titulo, 'pt-BR')
      const ta = new Date(a.publicada_em ?? a.capturada_em).getTime()
      const tb = new Date(b.publicada_em ?? b.capturada_em).getTime()
      return ordem === 'recentes' ? tb - ta : ta - tb
    })
    return r
  }, [vagas, busca, fonte, termo, soNovas, ordem])

  const limpar = () => {
    setBusca('')
    setFonte(null)
    setTermo(null)
    setSoNovas(false)
  }
  const temFiltro = busca || fonte || termo || soNovas

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Caxias do Sul · RS</p>
          <h1 className={styles.title}>Vagas de Assistente e Analista</h1>
          <p className={styles.subtitle}>
            Painel automático atualizado de hora em hora a partir de Gupy, LinkedIn,
            Vagas.com e Indeed.
          </p>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <strong>{vagas.length}</strong>
              <span>vagas ativas</span>
            </div>
            <div className={styles.stat}>
              <strong>{novas24h}</strong>
              <span>novas em 24h</span>
            </div>
            {ultima && (
              <div className={styles.stat}>
                <strong>{fmtHora(ultima.executada_em)}</strong>
                <span>última atualização</span>
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
                onClick={() => setTermo(null)}
              >
                Todos cargos
              </button>
              <button
                className={termo === 'assistente' ? styles.chipOn : styles.chip}
                onClick={() => setTermo(termo === 'assistente' ? null : 'assistente')}
              >
                Assistente
              </button>
              <button
                className={termo === 'analista' ? styles.chipOn : styles.chip}
                onClick={() => setTermo(termo === 'analista' ? null : 'analista')}
              >
                Analista
              </button>
            </div>

            <div className={styles.rightControls}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={soNovas}
                  onChange={(e) => setSoNovas(e.target.checked)}
                />
                Só novas (24h)
              </label>
              <select
                className={styles.select}
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                aria-label="Ordenar"
              >
                <option value="recentes">Mais recentes</option>
                <option value="antigas">Mais antigas</option>
                <option value="az">Título A–Z</option>
              </select>
            </div>
          </div>

          <div className={styles.resultBar}>
            <span>
              {filtradas.length} de {vagas.length} vagas
            </span>
            {temFiltro && (
              <button className={styles.clear} onClick={limpar}>
                Limpar filtros
              </button>
            )}
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
          <ul className={styles.grid}>
            {filtradas.map((v) => (
              <li key={v.id} className={styles.card}>
                <div className={styles.cardHead}>
                  <span className={`${styles.badge} ${styles['f_' + v.fonte.replace('.', '_')]}`}>
                    {FONTES[v.fonte] ?? v.fonte}
                  </span>
                  {ehNova(v) && <span className={styles.nova}>NOVA</span>}
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
                  {v.cidade && <span>📍 {v.cidade}</span>}
                  {v.tipo && <span>{v.tipo}</span>}
                  {fmtData(v.publicada_em) && <span>{fmtData(v.publicada_em)}</span>}
                </div>
                <a
                  className={styles.apply}
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver vaga →
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className={styles.footer}>
        <p>
          Dados públicos de Gupy, LinkedIn, Vagas.com e Indeed · atualização automática de
          hora em hora. Não afiliado às plataformas.
        </p>
      </footer>
    </div>
  )
}
