'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { lerPrefs, novoCodigo, salvarPrefs, type Prefs } from '@/lib/vagas'

const LS_CAND = 'vagas_candidatadas_v1'
const LS_VISTAS = 'vagas_vistas_v1'
const LS_CODIGO = 'vagas_codigo_sync_v1'

/* Histórico de "já vi" e "me candidatei", compartilhado pelas duas abas do site
   e entre aparelhos. O localStorage é isolado por navegador, então o servidor
   guarda a versão boa: cada marcação sobe na hora e os outros aparelhos puxam
   de volta. Vence sempre a gravação mais recente.

   As duas abas usam as mesmas chaves, por isso nada aqui pode apagar em bloco
   o que não é da lista em que a pessoa está. */
export function usePrefs(chavesIniciais: string[]) {
  const [vistas, setVistas] = useState<Set<string> | null>(null)
  const [candidatadas, setCandidatadas] = useState<Set<string>>(new Set())
  const [codigo, setCodigo] = useState<string | null>(null)
  const codigoRef = useRef<string | null>(null)
  const carimboRef = useRef('')

  const aplicarPrefs = useCallback((p: Prefs) => {
    setVistas(new Set(p.vistas))
    setCandidatadas(new Set(p.candidatadas))
    try {
      localStorage.setItem(LS_VISTAS, JSON.stringify(p.vistas))
      localStorage.setItem(LS_CAND, JSON.stringify(p.candidatadas))
    } catch {}
    if (p.atualizado_em) carimboRef.current = p.atualizado_em
  }, [])

  const puxarPrefs = useCallback(async () => {
    const cod = codigoRef.current
    if (!cod) return
    const remoto = await lerPrefs(cod)
    if (!remoto?.atualizado_em) return
    if (remoto.atualizado_em <= carimboRef.current) return
    aplicarPrefs(remoto)
  }, [aplicarPrefs])

  useEffect(() => {
    let cod: string | null = null
    try {
      // link de pareamento: /?sync=CODIGO passa este aparelho para o mesmo perfil
      const url = new URL(window.location.href)
      const doLink = url.searchParams.get('sync')
      if (doLink) {
        localStorage.setItem(LS_CODIGO, doLink)
        url.searchParams.delete('sync')
        window.history.replaceState(null, '', url.pathname + url.search)
      }
      cod = localStorage.getItem(LS_CODIGO)
      if (!cod) {
        cod = novoCodigo()
        localStorage.setItem(LS_CODIGO, cod)
      }
    } catch {}
    codigoRef.current = cod
    setCodigo(cod)

    const salvo = (chave: string): string[] | null => {
      try {
        const raw = localStorage.getItem(chave)
        return raw ? (JSON.parse(raw) as string[]) : null
      } catch {
        return null
      }
    }
    const candLocal = salvo(LS_CAND)
    const vistasLocal = salvo(LS_VISTAS)
    if (candLocal) setCandidatadas(new Set(candLocal))

    void (async () => {
      const remoto = cod ? await lerPrefs(cod) : null
      // primeira visita de verdade: o que já está no ar entra como visto, assim
      // só o que chegar depois aparece como novo
      const base: Prefs = remoto ?? {
        vistas: vistasLocal ?? chavesIniciais,
        candidatadas: candLocal ?? [],
      }
      aplicarPrefs(base)
      if (!cod || remoto) return
      const carimbo = await salvarPrefs(cod, base)
      if (carimbo) carimboRef.current = carimbo
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // envia sem travar a interface; o carimbo otimista impede que uma puxada em
  // andamento desfaça a marcação recém-feita aqui
  const enviarPrefs = (v: Set<string>, c: Set<string>) => {
    const cod = codigoRef.current
    if (!cod) return
    carimboRef.current = new Date().toISOString()
    void salvarPrefs(cod, { vistas: [...v], candidatadas: [...c] }).then((carimbo) => {
      if (carimbo) carimboRef.current = carimbo
    })
  }

  const gravaVistas = (s: Set<string>) => {
    setVistas(s)
    try {
      localStorage.setItem(LS_VISTAS, JSON.stringify([...s]))
    } catch {}
    enviarPrefs(s, candidatadas)
  }

  const marcarVista = (key: string) => {
    if (!vistas || vistas.has(key)) return
    const n = new Set(vistas)
    n.add(key)
    gravaVistas(n)
  }

  const toggleVista = (key: string) => {
    const n = new Set(vistas ?? [])
    if (n.has(key)) n.delete(key)
    else n.add(key)
    gravaVistas(n)
  }

  // marcar/desmarcar em bloco mexe só nas chaves da lista aberta
  const marcarTodasVistas = (chaves: string[]) => {
    gravaVistas(new Set([...(vistas ?? []), ...chaves]))
  }

  const desmarcarTodasVistas = (chaves: string[]) => {
    const n = new Set(vistas ?? [])
    for (const k of chaves) n.delete(k)
    gravaVistas(n)
  }

  const toggleCand = (key: string) => {
    setCandidatadas((prev) => {
      const n = new Set(prev)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      try {
        localStorage.setItem(LS_CAND, JSON.stringify([...n]))
      } catch {}
      enviarPrefs(vistas ?? new Set(), n)
      return n
    })
  }

  // troca este aparelho para um código existente e puxa o histórico de lá
  const usarCodigo = async (digitado: string): Promise<string> => {
    const cod = digitado.trim()
    if (cod.length < 12) return 'Código inválido.'
    const remoto = await lerPrefs(cod)
    if (!remoto) return 'Código não encontrado.'
    try {
      localStorage.setItem(LS_CODIGO, cod)
    } catch {}
    codigoRef.current = cod
    setCodigo(cod)
    aplicarPrefs(remoto)
    return `Sincronizado: ${remoto.vistas.length} vistas, ${remoto.candidatadas.length} candidaturas.`
  }

  return {
    vistas,
    candidatadas,
    codigo,
    puxarPrefs,
    marcarVista,
    toggleVista,
    marcarTodasVistas,
    desmarcarTodasVistas,
    toggleCand,
    usarCodigo,
  }
}
