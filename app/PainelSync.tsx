'use client'

import { useState } from 'react'
import styles from './page.module.css'

/* Faixa de sincronização, igual nas duas abas: o link de pareamento leva o
   outro aparelho para o mesmo código. */
export default function PainelSync({
  codigo,
  usarCodigo,
}: {
  codigo: string | null
  usarCodigo: (digitado: string) => Promise<string>
}) {
  const [digitado, setDigitado] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  return (
    <div className={styles.syncPainel}>
      <div className={styles.syncInner}>
        <p className={styles.syncTexto}>
          Abra este link uma vez no outro aparelho: os dois passam a usar o mesmo
          histórico, e cada vaga marcada num lado aparece no outro em até um minuto.
        </p>
        <div className={styles.syncLinha}>
          <code className={styles.syncCodigo}>{codigo ?? '…'}</code>
          <button
            className={styles.chipOn}
            onClick={() => {
              if (!codigo) return
              void navigator.clipboard?.writeText(`${window.location.origin}/?sync=${codigo}`)
              setStatus('Link copiado. Abra no outro aparelho.')
            }}
          >
            Copiar link
          </button>
          <button
            className={styles.chip}
            onClick={() => {
              if (!codigo) return
              void navigator.clipboard?.writeText(codigo)
              setStatus('Código copiado.')
            }}
          >
            Copiar código
          </button>
        </div>
        <div className={styles.syncLinha}>
          <input
            className={styles.search}
            placeholder="Ou cole aqui o código do outro aparelho"
            value={digitado}
            onChange={(e) => setDigitado(e.target.value)}
            aria-label="Código de sincronização"
          />
          <button
            className={styles.chip}
            onClick={() => {
              setStatus('Buscando…')
              void usarCodigo(digitado).then(setStatus)
            }}
          >
            Usar
          </button>
        </div>
        {status && <p className={styles.syncStatus}>{status}</p>}
      </div>
    </div>
  )
}
