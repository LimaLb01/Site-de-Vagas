import type { FiltroPcd } from '@/lib/vagas'
import styles from './page.module.css'

// "Só exclusivas" serve a quem é PcD; "Esconder" a quem não pode se candidatar a elas
export default function ChipsPcd({
  valor,
  mudar,
  exclusivas,
  total,
}: {
  valor: FiltroPcd
  mudar: (v: FiltroPcd) => void
  exclusivas: number
  total: number
}) {
  const opcoes: Array<[FiltroPcd, string, number]> = [
    ['so', 'Só exclusivas PcD', exclusivas],
    ['sem', 'Esconder exclusivas PcD', total - exclusivas],
  ]
  return (
    <div className={styles.chipLine}>
      <span className={styles.chipLabel}>PcD</span>
      <div className={styles.chips}>
        <button className={!valor ? styles.chipOn : styles.chip} onClick={() => mudar(null)}>
          Todas
        </button>
        {opcoes.map(([v, nome, n]) => (
          <button
            key={v}
            className={valor === v ? styles.chipOn : styles.chip}
            onClick={() => mudar(valor === v ? null : v)}
          >
            {nome}
            <span className={styles.chipCount}>{n}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
