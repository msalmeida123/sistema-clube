/* Sem cache de dados pessoais. Apenas notificações explicitamente ativadas. */
self.addEventListener('push',event=>{
 let tipo='associado';try{tipo=event.data.json().tipo==='equipe'?'equipe':'associado'}catch{}
 event.waitUntil(self.registration.showNotification('Sistema Clube',{
  body:'Você tem uma nova mensagem. Entre para consultar.',
  tag:'clube-mensagens',data:{path:tipo==='equipe'?'/dashboard/associados/mensagens':'/associado?aba=mensagens'}
 }));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close();
 const p=event.notification.data?.path;
 const path=p==='/dashboard/associados/mensagens'?p:'/associado?aba=mensagens';
 event.waitUntil((async()=>{
  const url=new URL(path,self.location.origin).href;
  const tabs=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const tab of tabs){if(tab.url===url){await tab.focus();return}}
  await self.clients.openWindow(url);
 })());
});
