'use client'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ConfiguracaoCertificado() {
  const [certificado, setCertificado] = useState<{nome_arquivo:string;atualizado_em:string}|null>(null)
  const [senha, setSenha] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)
  async function carregar() {
    try {
      const r = await fetch('/api/configuracoes/certificado', { cache: 'no-store' }); const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setCertificado(d.certificado); setErro('')
    } catch (e) { setErro((e as Error).message) }
  }
  useEffect(() => { void carregar() }, [])
  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    const f = arquivo.current?.files?.[0]
    if (!f || f.size > 1048576) { toast.error('Selecione um arquivo de até 1 MB.'); return }
    setOcupado(true)
    try {
      const body = new FormData(); body.set('arquivo', f); body.set('senha', senha)
      const r = await fetch('/api/configuracoes/certificado', { method: 'POST', body }); const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      setSenha(''); if (arquivo.current) arquivo.current.value = ''
      toast.success('Certificado salvo com proteção.'); await carregar()
    } catch (e) { toast.error((e as Error).message) } finally { setOcupado(false) }
  }
  async function remover() {
    if (!confirm('Remover o certificado digital cadastrado no sistema?')) return
    setOcupado(true)
    try {
      const r = await fetch('/api/configuracoes/certificado', { method: 'DELETE' }); const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success('Certificado removido.'); await carregar()
    } catch (e) { toast.error((e as Error).message) } finally { setOcupado(false) }
  }
  return <section className="bg-white border rounded-xl p-6 space-y-5 max-w-3xl">
    <h2 className="text-xl font-semibold">Certificado Digital</h2>
    <p className="text-sm text-gray-600">Cadastre o certificado A1 da empresa em formato .pfx ou .p12. Arquivo e senha ficam protegidos e não são exibidos após salvar. Acesso exclusivo do administrador.</p>
    {erro ? <p role="alert" className="text-red-600">{erro}</p> : <p className="p-3 bg-gray-50 rounded">{certificado ? <>Cadastrado: <strong>{certificado.nome_arquivo}</strong><br/>Atualizado em {new Date(certificado.atualizado_em).toLocaleString('pt-BR')}</> : 'Nenhum certificado cadastrado.'}</p>}
    <form onSubmit={salvar} className="space-y-4">
      <label className="block">Arquivo A1 (até 1 MB)<Input ref={arquivo} type="file" accept=".pfx,.p12" required disabled={ocupado}/></label>
      <label className="block">Senha do certificado<Input type="password" autoComplete="new-password" value={senha} onChange={e=>setSenha(e.target.value)} maxLength={1024} disabled={ocupado}/></label>
      <div className="flex gap-3"><Button disabled={ocupado || !!erro} type="submit">{ocupado ? 'Aguarde…' : certificado ? 'Substituir certificado' : 'Salvar certificado'}</Button>{certificado && <Button type="button" variant="outline" disabled={ocupado} onClick={remover}>Remover</Button>}</div>
    </form>
    <p className="text-sm text-gray-600">O envio verifica a abertura do arquivo com a senha. Não verifica revogação ou autorização fiscal. Para emitir NFC-e, configure também o certificado no ACBrMonitor, na aba DFe. Este cadastro ainda não sincroniza com o ACBr. Certificados A3 (token/cartão) não são aceitos nesta tela.</p>
  </section>
}
