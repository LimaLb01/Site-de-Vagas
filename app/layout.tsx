import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Vagas Caxias do Sul — Assistente e Analista',
  description:
    'Painel automático de vagas de assistente e analista em Caxias do Sul - RS. Atualizado de hora em hora a partir de Gupy, LinkedIn, Vagas.com, Jobfy e Indeed.',
  keywords: 'vagas, emprego, Caxias do Sul, assistente, analista, RS',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d4ed8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
