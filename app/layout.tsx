import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vagas Caxias do Sul — Assistente e Analista',
  description:
    'Painel automático de vagas de assistente e analista em Caxias do Sul - RS. Atualizado de hora em hora a partir de Gupy, LinkedIn, Vagas.com e Indeed.',
  keywords: 'vagas, emprego, Caxias do Sul, assistente, analista, RS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
