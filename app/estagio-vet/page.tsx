import { getVagasEstagio, getUltimaEstagio } from '@/lib/vagas'
import EstagioBoard from '../estagio-ads/EstagioBoard'

export const revalidate = 300

export const metadata = {
  title: 'Estágio em Veterinária — Canoas e região metropolitana',
  description:
    'Estágios de medicina veterinária abertos em Canoas, na região metropolitana de Porto Alegre e remotos, de Gupy, LinkedIn, Vagas.com, Jobfy e Indeed.',
}

export default async function EstagioVet() {
  const [vagas, ultima] = await Promise.all([getVagasEstagio('vet'), getUltimaEstagio('vet')])
  return <EstagioBoard perfil="vet" vagas={vagas} ultima={ultima} />
}
