import type { Metadata, Viewport } from 'next'
import { Archivo, Newsreader } from 'next/font/google'
import './globals.css'

// Duas famílias bem distintas: grotesca industrial na interface, serifada no
// título da vaga (o que se lê de verdade). Inter ficou de fora de propósito.
const archivo = Archivo({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-serif',
})

export const metadata: Metadata = {
  title: 'Vagas Caxias do Sul — Assistente e Analista',
  description:
    'Painel automático de vagas de assistente e analista em Caxias do Sul - RS. Atualizado de hora em hora a partir de Gupy, LinkedIn, Vagas.com, Jobfy e Indeed.',
  keywords: 'vagas, emprego, Caxias do Sul, assistente, analista, RS',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#7a1e2b',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${newsreader.variable}`}>
      <body>{children}</body>
    </html>
  )
}
