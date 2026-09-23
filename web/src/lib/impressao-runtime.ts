// Executado apenas na janela temporária. Não acessa nem modifica o DOM do opener.
export function runtimeImpressao() {
  const origem = location.origin
  const id = location.hash.slice(1)
  const origemJanela = window.opener
  const estado = document.getElementById('estado')!
  const imprimir = document.getElementById('imprimir') as HTMLButtonElement
  const fechar = document.getElementById('fechar') as HTMLButtonElement
  let frame: HTMLIFrameElement | null = null
  let ocupado = false
  const avisar = (tipo: string) => origemJanela?.postMessage({canal:'clube-impressao',id,tipo},origem)
  const concluir = () => { avisar('concluido'); window.close(); estado.textContent='Impressão encerrada. Você pode fechar este relatório.' }
  fechar.onclick = concluir
  async function imprimirAgora() {
    if (!frame?.contentWindow || ocupado) return
    ocupado=true; imprimir.disabled=true; estado.textContent='Preparando impressão...'
    let prazo: ReturnType<typeof setTimeout> | undefined
    try {
      const doc=frame.contentDocument!, win=frame.contentWindow
      await Promise.race([
        Promise.all([
          doc.fonts?.ready || Promise.resolve(),
          ...Array.from(doc.images).map(img=>(img.complete ? Promise.resolve() : new Promise<void>(resolve=>{img.addEventListener('load',()=>resolve(),{once:true});img.addEventListener('error',()=>resolve(),{once:true})})).then(()=>img.decode?.().catch(()=>{})))
        ]),
        new Promise((_,reject)=>{prazo=setTimeout(()=>reject(Error('resources timeout')),30000)})
      ])
      clearTimeout(prazo)
      // Layout concluído após fontes e imagens; não usa atraso fixo para imprimir.
      await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))
      win.addEventListener('afterprint',concluir,{once:true})
      estado.textContent='Use o diálogo de impressão. Ao terminar, esta janela será fechada.'
      avisar('imprimindo'); win.focus(); win.print()
    } catch (e) {
      console.error('Falha ao preparar relatório',e)
      estado.textContent='Não foi possível preparar a impressão. Volte ao sistema e tente novamente.'
      avisar('erro'); window.close()
    } finally {clearTimeout(prazo);ocupado=false;imprimir.disabled=false}
  }
  imprimir.onclick=imprimirAgora
  window.addEventListener('message',event=>{
    if(event.origin!==origem || event.source!==origemJanela || event.data?.canal!=='clube-impressao' || event.data.id!==id || event.data.tipo!=='documento' || frame)return
    const dados=event.data
    if(typeof dados.html!=='string')return
    document.title=String(dados.titulo || 'Relatório')
    frame=document.createElement('iframe')
    frame.title='Relatório para impressão'
    // Scripts do HTML do relatório não executam, nem navegam a janela principal.
    frame.setAttribute('sandbox','allow-same-origin allow-modals')
    frame.style.cssText='display:block;width:100%;height:85vh;border:0;background:white'
    frame.onload=()=>{imprimir.disabled=false;estado.textContent='Relatório pronto.';avisar('pronto');if(dados.automatico)void imprimirAgora()}
    frame.srcdoc=dados.html
    document.getElementById('relatorio')!.appendChild(frame)
  })
  avisar('aberto')
}
