'use client'

import { useMemo, useState } from 'react'
import styles from './page.module.css'

// cor estável por empresa: mesma empresa sempre com a mesma cor
const CORES = [
  '#003366', '#6f42c1', '#0a66c2', '#b45309', '#c2185b',
  '#006e25', '#0f766e', '#7c2d12', '#4338ca', '#9d174d',
]

function corDe(nome: string): string {
  let h = 0
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) | 0
  return CORES[Math.abs(h) % CORES.length]
}

function iniciais(nome: string): string {
  const palavras = nome
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((p) => p.length > 1 && !/^(de|da|do|das|dos|e|s\.?a|ltda|me|eireli|group|grupo)$/i.test(p))
  if (palavras.length === 0) return nome.slice(0, 2).toUpperCase()
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase()
  return (palavras[0][0] + palavras[1][0]).toUpperCase()
}

// "Randoncorp S.A." -> "randoncorp": base para adivinhar o domínio
function slugEmpresa(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(s\.?a|ltda|me|eireli|group|grupo|carreiras?|vagas?|oficial|brasil|do brasil)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

// quando a fonte não traz logo, tenta serviços públicos de ícone pelo domínio
// provável da empresa. Cada erro avança para o próximo; o último é o monograma.
function candidatos(logoUrl: string | null, empresa: string): string[] {
  const urls: string[] = []
  if (logoUrl) urls.push(logoUrl)
  const slug = slugEmpresa(empresa)
  if (slug.length >= 3) {
    urls.push(`https://logo.clearbit.com/${slug}.com.br`)
    urls.push(`https://logo.clearbit.com/${slug}.com`)
    urls.push(`https://www.google.com/s2/favicons?domain=${slug}.com.br&sz=128`)
    urls.push(`https://www.google.com/s2/favicons?domain=${slug}.com&sz=128`)
  }
  return urls
}

export default function LogoEmpresa({
  empresa,
  logoUrl,
}: {
  empresa: string | null
  logoUrl: string | null
}) {
  const nome = empresa?.trim() || 'Empresa'
  const urls = useMemo(() => candidatos(logoUrl, nome), [logoUrl, nome])
  const [i, setI] = useState(0)

  if (i < urls.length) {
    return (
      <img
        className={styles.logoEmpresa}
        src={urls[i]}
        alt={nome}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setI((n) => n + 1)}
      />
    )
  }

  return (
    <span
      className={styles.logoFallback}
      style={{ background: corDe(nome) }}
      title={nome}
      aria-hidden
    >
      {iniciais(nome)}
    </span>
  )
}
