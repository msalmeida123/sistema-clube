// Saída destinada exclusivamente ao psql, sem exibir chaves no terminal.
const {publicKey,privateKey}=require('web-push').generateVAPIDKeys()
if(![publicKey,privateKey].every(k=>/^[A-Za-z0-9_-]+$/.test(k)))throw Error('Formato de chave inválido')
process.stdout.write(`INSERT INTO public.clube_push_config(id,public_key,private_key) VALUES(true,'${publicKey}','${privateKey}') ON CONFLICT(id) DO NOTHING;\n`)
