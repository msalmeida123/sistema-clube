import {enviarAcessoAssociado} from '@/lib/enviar-acesso-associado'
import {confereSenha} from '@/lib/associado-app'
import nodemailer from 'nodemailer'
jest.mock('nodemailer',()=>({__esModule:true,default:{createTransport:jest.fn()}}))
const sendMail=jest.fn(),close=jest.fn(),upsert=jest.fn(),update=jest.fn(),eq=jest.fn()
const db:any={from:jest.fn(()=>({upsert,update}))}
beforeEach(()=>{
 jest.clearAllMocks(); upsert.mockResolvedValue({error:null});eq.mockReturnValue({eq});update.mockReturnValue({eq});sendMail.mockResolvedValue({accepted:['member@example.test']});
 (nodemailer.createTransport as jest.Mock).mockReturnValue({sendMail,close});
 process.env.APP_SMTP_HOST='smtp.gmail.com';process.env.APP_SMTP_FROM='club@example.test';process.env.APP_PUBLIC_URL='https://app.example.test'
})
test('envia somente ao email cadastrado, guarda hash e validade de uma hora',async()=>{
 const before=Date.now();const result=await enviarAcessoAssociado(db,{id:'member',email:'member@example.test'});
 const mail=sendMail.mock.calls[0][0],stored=upsert.mock.calls[0][0];
 const password=mail.text.match(/Senha temporária: (\S+)/)[1];
 expect(mail.to).toBe('member@example.test');expect(mail.text).toContain('https://app.example.test/associado');
 expect(await confereSenha(password,stored.temporaria_hash)).toBe(true);expect(stored).not.toHaveProperty('senha_hash');expect(JSON.stringify(stored)).not.toContain(password);
 expect(Date.parse(stored.temporaria_validade)).toBeGreaterThanOrEqual(before+3600000);expect(result).toBeUndefined();
})
test('falha de envio invalida apenas o hash gerado, preservando senha regular',async()=>{
 sendMail.mockRejectedValue(Error('smtp failed'));
 await expect(enviarAcessoAssociado(db,{id:'member',email:'member@example.test'})).rejects.toThrow('Não foi possível enviar');
 expect(update).toHaveBeenCalledWith({temporaria_hash:null,temporaria_validade:null});expect(eq).toHaveBeenCalledWith('temporaria_hash',upsert.mock.calls[0][0].temporaria_hash);expect(close).toHaveBeenCalled();
})
test('nao grava acesso quando SMTP ausente',async()=>{
 delete process.env.APP_SMTP_HOST;
 await expect(enviarAcessoAssociado(db,{id:'member',email:'member@example.test'})).rejects.toThrow('configurado');expect(upsert).not.toHaveBeenCalled();
})
