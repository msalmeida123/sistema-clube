const fs = require('fs');
const base = __dirname + '/';
const current = JSON.parse(fs.readFileSync(base+'before-columns.json','utf8'));
const existing = new Map();
for (const c of current) { if (!existing.has(c.table_name)) existing.set(c.table_name,new Map()); existing.get(c.table_name).set(c.column_name,c); }
let source=fs.readFileSync(base+'schema-clickup-original.sql','utf8').replace(/\bbar_carteirinha_saldos\b/g,'carteirinha_saldo').replace(/\bbar_carteirinha_movimentos\b/g,'carteirinha_movimentos');
const rh=fs.readFileSync(base+'../../src/modules/rh/sql/create_tables.sql','utf8');
source+='\n'+rh.slice(0,rh.indexOf('-- RLS'));
source=source.replace(/--[^\n]*/g,'');
const parts=[]; const addedTables=[], addedColumns=[], preserved=[];
for(const m of source.matchAll(/CREATE TYPE (\w+) AS ENUM \(([^;]+)\);/g)) parts.push(`DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' AND t.typname='${m[1]}') THEN ${m[0]} END IF; END $migration$;`);
function splitColumns(body) {let result=[],start=0,depth=0,quote=false;for(let i=0;i<body.length;i++){const c=body[i];if(c==="'"){if(quote && body[i+1]==="'"){i++;continue;}quote=!quote;}if(!quote){if(c==='(')depth++;if(c===')')depth--;if(c===','&&depth===0){result.push(body.slice(start,i).trim());start=i+1;}}}result.push(body.slice(start).trim());return result;}
const target=[];
for(const m of source.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)\s*\(([\s\S]*?)\n\);/g)) {
 const [whole,name,body]=m; target.push(name);
 if(!existing.has(name)){addedTables.push(name);parts.push(whole.replace(/CREATE TABLE (?:IF NOT EXISTS )?/, 'CREATE TABLE IF NOT EXISTS '));}
 else {for(const def of splitColumns(body)){const field=def.match(/^(\w+)\s+/)?.[1];if(!field||/^(UNIQUE|PRIMARY|FOREIGN|CHECK|CONSTRAINT)$/i.test(field))continue;
 if(existing.get(name).has(field)){preserved.push(name+'.'+field);continue;}
 addedColumns.push(name+'.'+field);parts.push(`ALTER TABLE public.${name} ADD COLUMN IF NOT EXISTS ${def};`);
 }}
}
for(const m of source.matchAll(/CREATE INDEX (?:IF NOT EXISTS )?\w+ ON \w+\([^;]+\);/g))parts.push(m[0].replace(/CREATE INDEX (?:IF NOT EXISTS )?/,'CREATE INDEX IF NOT EXISTS '));
for(const m of source.matchAll(/ALTER TABLE (\w+) ADD CONSTRAINT (\w+)\s+FOREIGN KEY[^;]+;/g))parts.push(`DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_constraint WHERE conrelid='public.${m[1]}'::regclass AND conname='${m[2]}') THEN ${m[0]} END IF; END $migration$;`);
parts.push(`CREATE OR REPLACE FUNCTION public.clube_clickup_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $fn$ BEGIN NEW.updated_at=now(); RETURN NEW; END $fn$;`);
for(const m of source.matchAll(/CREATE TRIGGER (\w+) BEFORE UPDATE ON (\w+)[^;]+;/g))parts.push(`DO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgrelid='public.${m[2]}'::regclass AND NOT tgisinternal AND tgname='${m[1]}') THEN CREATE TRIGGER ${m[1]} BEFORE UPDATE ON public.${m[2]} FOR EACH ROW EXECUTE FUNCTION public.clube_clickup_updated_at(); END IF; END $migration$;`);
for(const t of addedTables) parts.push(`ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;\nDO $migration$ BEGIN IF NOT EXISTS (SELECT FROM pg_policies WHERE schemaname='public' AND tablename='${t}' AND policyname='admin_local') THEN CREATE POLICY admin_local ON public.${t} TO authenticated USING (public.clube_admin_local()) WITH CHECK (public.clube_admin_local()); END IF; END $migration$;\nREVOKE ALL ON public.${t} FROM anon;\nGRANT SELECT,INSERT,UPDATE,DELETE ON public.${t} TO authenticated;\nGRANT ALL ON public.${t} TO service_role;`);
parts.push(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;\nNOTIFY pgrst, 'reload schema';`);
const output=`-- Adaptacao aditiva do ClickUp + RH para o Supabase local existente.\n-- Fonte: https://app.clickup.com/t/868hkc6f7\n-- Mantem tipos, dados e politicas existentes. Executar o arquivo inteiro.\nBEGIN;\nSET LOCAL search_path = public, extensions;\nSET LOCAL lock_timeout = '10s';\nSELECT pg_advisory_xact_lock(901105059454);\nDO $check$ BEGIN IF to_regprocedure('public.clube_admin_local()') IS NULL THEN RAISE EXCEPTION 'Banco local incorreto: helper clube_admin_local ausente'; END IF; END $check$;\n`+parts.join('\n\n')+'\nCOMMIT;\n';
fs.writeFileSync(base+'migracao-clickup-local.sql',output);
fs.writeFileSync(base+'migration-inventory.json',JSON.stringify({addedTables,addedColumns,preserved,target},null,2));
console.log(JSON.stringify({novasTabelas:addedTables.length,colunasAdicionadas:addedColumns.length,tabelas:addedTables},null,2));
