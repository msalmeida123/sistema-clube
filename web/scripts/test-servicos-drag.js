(async()=>{
 const botao=Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='TESTE KANBAN 9f5cb40c');
 const destino=document.querySelector('button[aria-label="Adicionar serviço em 09/09/2026"]');
 if(!botao||!destino)throw new Error('Cartão ou dia não encontrado');
 botao.closest('article').dispatchEvent(new DragEvent('dragstart',{bubbles:true}));
 await new Promise(r=>setTimeout(r,50));
 destino.closest('section').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true}));
 return 'Movimento para quarta-feira solicitado';
})()
