import {validarConfigPonto,testarControlId} from '@/lib/rh-controlid'
import {conteudoFolha} from '@/modules/rh/folha-impressao'
import {EventEmitter} from 'node:events'
import https from 'node:https'

const config={ip:'192.168.1.150',porta:443,protocolo:'https',certificado_local:false,usuario:'teste',senha:'segredo',nome:'Relógio',empresa_nome:'Empresa',empresa_documento:''}
afterEach(()=>jest.restoreAllMocks())
test('Bloqueia endereços externos, loopback, nomes e porta inválida',()=>{
 for(const ip of ['127.0.0.1','169.254.169.254','8.8.8.8','localhost','192.168.1.2/exemplo'])expect(()=>validarConfigPonto({...config,ip})).toThrow()
 expect(()=>validarConfigPonto({...config,porta:0})).toThrow()
 expect(validarConfigPonto(config).ip).toBe(config.ip)
})
test('Teste usa login e leitura da identificação, encerra sessão e mantém validação TLS',async()=>{
 const chamadas:any[]=[]
 jest.spyOn(https,'request').mockImplementation(((options:any,callback:any)=>{
  chamadas.push(options);const req:any=new EventEmitter()
  req.destroy=()=>req.emit('close')
  req.end=()=>{const res:any=new EventEmitter();res.statusCode=200;callback(res);const body=options.path.startsWith('/login')?{session:'sessao'}:options.path.startsWith('/get_about')?{nSerie:'123',versionFW:104}:{};res.emit('data',Buffer.from(JSON.stringify(body)));res.emit('end');req.emit('close')}
  return req
 }) as any)
 expect(await testarControlId(config)).toEqual({serie:'123',firmware:'104'})
 expect(chamadas.map(c=>c.path)).toEqual(['/login.fcgi','/get_about.fcgi?session=sessao','/logout.fcgi?session=sessao'])
 expect(chamadas.every(c=>c.rejectUnauthorized===true)).toBe(true)
})
test('Impressão escapa texto, usa valores salvos e identifica folha cancelada',()=>{
 const folha:any={funcionario:{nome:'<script>alert(1)</script>',cargo:'Cargo'},status:'cancelada',referencia:'2026-09',total_proventos:1234.56,total_descontos:34.56,salario_liquido:1200,observacao:'<img src=x onerror=alert(1)>'}
 const empresa={empresa_nome:'Empresa & Filhos',empresa_documento:''}
 const html=conteudoFolha([folha],empresa,'2026-09',true)
 expect(html).not.toContain('<script>');expect(html).not.toContain('<img');expect(html).toContain('&lt;script&gt;')
 expect(html).toContain('Cancelada');expect(html).toContain('1.200,00');expect(html).toContain('não confirma o pagamento')
 expect(conteudoFolha([folha,folha],empresa,'2026-09')).toContain('2.400,00')
})

test('Holerite inclui bases informadas e rubricas separadas sem duplicar outros descontos',()=>{
 const folha:any={status:'rascunho',funcionario:{nome:'Exemplo'},total_proventos:3000,total_descontos:75,salario_liquido:2925,outros_descontos:75,detalhes_holerite:{codigo_funcionario:'009',sede:'Sede Norte',admissao:'2026-01-05',conta:'Conta 0001',dependentes:0,base_inss:3000,base_irrf:null,base_fgts:3000,salario_contratual:3000,rubricas:[{campo:'salario_base',codigo:'001',descricao:'Salário',referencia:'30 dias',valor:3000},{campo:'outros_descontos',codigo:'901',descricao:'Plano odontológico',referencia:'Mensal',valor:75}]}}
 const html=conteudoFolha([folha],{empresa_nome:'Empresa',empresa_documento:'Documento'},'2026-09',true)
 for(const campo of ['Código','Referência','Vencimentos','Base INSS','Base IRRF','Base FGTS','Dependentes','Sede Norte','05&#x2F;01&#x2F;2026','Conta 0001','Plano odontológico','30 dias','Não informado'])expect(html).toContain(campo)
 expect(html).not.toContain('Outros descontos')
})
