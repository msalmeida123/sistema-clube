import {lerRespostaCnpj} from '@/lib/resposta-cnpj'
test('HTML não vaza erro de JSON para a tela',async()=>{await expect(lerRespostaCnpj(new Response('<!DOCTYPE html>',{headers:{'content-type':'text/html'}}))).rejects.toThrow('não respondeu corretamente')})
test('sessão expirada orienta novo login',async()=>{await expect(lerRespostaCnpj(new Response('{}',{status:401}))).rejects.toThrow('sessão expirou')})
test('empresa válida é preservada',async()=>{const d={nome:'Empresa',cnpj:'00000000000191'};await expect(lerRespostaCnpj(Response.json(d))).resolves.toEqual(d)})
test('JSON incompleto não preenche o formulário',async()=>{await expect(lerRespostaCnpj(Response.json({}))).rejects.toThrow('incompletos')})
