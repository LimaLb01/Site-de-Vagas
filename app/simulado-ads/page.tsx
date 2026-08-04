import { getVagasAds } from '@/lib/vagas'
import SimuladoBoard from './SimuladoBoard'

export const revalidate = 300

export const metadata = {
  title: 'Simulado ADS — vagas para quem concluiu o tecnólogo',
  description:
    'Vagas de tecnologia em aberto em Caxias do Sul e remotas, filtradas pelo que um recém-formado em Análise e Desenvolvimento de Sistemas consegue se candidatar.',
}

export default async function SimuladoAds() {
  const vagas = await getVagasAds()
  return <SimuladoBoard vagas={vagas} />
}
