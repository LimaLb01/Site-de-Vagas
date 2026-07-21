import { getVagas, getUltimaExecucao } from '@/lib/vagas'
import VagasBoard from './VagasBoard'

export const revalidate = 300

export default async function Home() {
  const [vagas, execucoes] = await Promise.all([getVagas(), getUltimaExecucao()])
  return <VagasBoard vagas={vagas} ultima={execucoes[0] ?? null} />
}
