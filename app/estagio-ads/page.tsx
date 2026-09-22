import { getVagasEstagio, getUltimaEstagio } from '@/lib/vagas'
import EstagioBoard from './EstagioBoard'

export const revalidate = 300

export const metadata = {
  title: 'Estágio em ADS — Canoas e região metropolitana',
  description:
    'Estágios de tecnologia abertos em Canoas, na região metropolitana de Porto Alegre e remotos, de Gupy, LinkedIn, Vagas.com, Jobfy e Indeed.',
}

export default async function EstagioAds() {
  const [vagas, ultima] = await Promise.all([getVagasEstagio(), getUltimaEstagio()])
  return <EstagioBoard vagas={vagas} ultima={ultima} />
}
