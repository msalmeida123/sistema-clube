ALTER TABLE public.associados ADD COLUMN IF NOT EXISTS sexo text;
CREATE OR REPLACE FUNCTION public.validar_sexo_associado() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF NEW.tipo_cadastro='pj' THEN NEW.sexo:=NULL;
 ELSIF NEW.sexo IS NULL OR NEW.sexo NOT IN ('feminino','masculino','nao_informar') THEN
  RAISE EXCEPTION USING ERRCODE='23514',MESSAGE='cadastro_obrigatorio:sexo';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sexo_associado_validar ON public.associados;
CREATE TRIGGER sexo_associado_validar BEFORE INSERT OR UPDATE OF sexo,tipo_cadastro ON public.associados FOR EACH ROW EXECUTE FUNCTION public.validar_sexo_associado();

CREATE TABLE IF NOT EXISTS public.clube_mensagens(
 id uuid PRIMARY KEY, associado_id uuid NOT NULL REFERENCES public.associados(id),
 remetente_tipo text NOT NULL CHECK(remetente_tipo IN ('associado','equipe')),
 remetente_id uuid NOT NULL, texto text NOT NULL CHECK(char_length(btrim(texto)) BETWEEN 1 AND 3000),
 criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS clube_mensagens_conversa ON public.clube_mensagens(associado_id,criado_em DESC,id DESC);
CREATE TABLE IF NOT EXISTS public.clube_mensagens_leituras(
 mensagem_id uuid NOT NULL REFERENCES public.clube_mensagens(id) ON DELETE CASCADE,
 leitor_tipo text NOT NULL CHECK(leitor_tipo IN ('associado','equipe')), leitor_id uuid NOT NULL,
 lido_em timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(mensagem_id,leitor_tipo,leitor_id)
);
CREATE TABLE IF NOT EXISTS public.clube_push_config(
 id boolean PRIMARY KEY DEFAULT true CHECK(id), public_key text NOT NULL, private_key text NOT NULL
);
CREATE TABLE IF NOT EXISTS public.clube_push_inscricoes(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), endpoint text UNIQUE NOT NULL,
 chave text NOT NULL, segredo text NOT NULL,
 dono_tipo text NOT NULL CHECK(dono_tipo IN ('associado','equipe')), dono_id uuid NOT NULL,
 sessao_hash text, criado_em timestamptz NOT NULL DEFAULT now(),
 CHECK(char_length(endpoint)<=2000)
);
CREATE INDEX IF NOT EXISTS clube_push_dono ON public.clube_push_inscricoes(dono_tipo,dono_id);
CREATE TABLE IF NOT EXISTS public.clube_push_fila(
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 mensagem_id uuid NOT NULL REFERENCES public.clube_mensagens(id) ON DELETE CASCADE,
 inscricao_id uuid NOT NULL REFERENCES public.clube_push_inscricoes(id) ON DELETE CASCADE,
 tentativas integer NOT NULL DEFAULT 0, disponivel_em timestamptz NOT NULL DEFAULT now(),
 lease uuid, concluido_em timestamptz, resultado text,
 UNIQUE(mensagem_id,inscricao_id)
);
CREATE INDEX IF NOT EXISTS clube_push_pendente ON public.clube_push_fila(disponivel_em,id) WHERE concluido_em IS NULL;
ALTER TABLE public.clube_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_mensagens_leituras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_push_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_push_inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clube_push_fila ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.clube_mensagens,public.clube_mensagens_leituras,public.clube_push_config,public.clube_push_inscricoes,public.clube_push_fila FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.clube_mensagens,public.clube_mensagens_leituras,public.clube_push_config,public.clube_push_inscricoes,public.clube_push_fila TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.clube_push_fila_id_seq TO service_role;
CREATE OR REPLACE FUNCTION public.clube_enfileirar_push() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 INSERT INTO clube_push_fila(mensagem_id,inscricao_id)
 SELECT NEW.id,s.id FROM clube_push_inscricoes s
 WHERE (NEW.remetente_tipo='equipe' AND s.dono_tipo='associado' AND s.dono_id=NEW.associado_id)
 OR (NEW.remetente_tipo='associado' AND s.dono_tipo='equipe');
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS clube_mensagem_push ON public.clube_mensagens;
CREATE TRIGGER clube_mensagem_push AFTER INSERT ON public.clube_mensagens FOR EACH ROW EXECUTE FUNCTION public.clube_enfileirar_push();
CREATE OR REPLACE FUNCTION public.clube_push_reservar() RETURNS SETOF public.clube_push_fila LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 WITH encerrados AS (UPDATE clube_push_fila SET concluido_em=now(),resultado='falhou' WHERE concluido_em IS NULL AND tentativas>=6 AND disponivel_em<=now() RETURNING id)
 UPDATE clube_push_fila SET lease=gen_random_uuid(),tentativas=tentativas+1,disponivel_em=now()+interval '2 minutes'
 WHERE id IN (SELECT id FROM clube_push_fila WHERE concluido_em IS NULL AND disponivel_em<=now() AND tentativas<6 ORDER BY id FOR UPDATE SKIP LOCKED LIMIT 10)
 RETURNING *;
$$;
CREATE OR REPLACE FUNCTION public.clube_push_usuario_permitido(p_usuario uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE anterior text:=current_setting('request.jwt.claims',true); permitido boolean;
BEGIN
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',p_usuario,'role','authenticated')::text,true);
 permitido:=public.sistema_pode('associados','visualizar');
 PERFORM set_config('request.jwt.claims',coalesce(anterior,''),true);
 RETURN coalesce(permitido,false);
EXCEPTION WHEN OTHERS THEN
 PERFORM set_config('request.jwt.claims',coalesce(anterior,''),true);RETURN false;
END $$;
CREATE OR REPLACE FUNCTION public.clube_caixa_mensagens(p_usuario uuid,p_pagina integer DEFAULT 0)
RETURNS TABLE(associado_id uuid,nome text,criado_em timestamptz,nao_lidas bigint)
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT m.associado_id,a.nome::text,max(m.criado_em),
 count(*) FILTER(WHERE m.remetente_tipo='associado' AND l.mensagem_id IS NULL)
 FROM clube_mensagens m JOIN associados a ON a.id=m.associado_id
 LEFT JOIN clube_mensagens_leituras l ON l.mensagem_id=m.id AND l.leitor_tipo='equipe' AND l.leitor_id=p_usuario
 GROUP BY m.associado_id,a.nome ORDER BY max(m.criado_em) DESC,m.associado_id
 LIMIT 31 OFFSET greatest(0,least(10000,p_pagina))*30;
$$;
REVOKE ALL ON FUNCTION public.clube_enfileirar_push(),public.clube_push_reservar(),public.clube_push_usuario_permitido(uuid),public.clube_caixa_mensagens(uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.clube_push_reservar(),public.clube_push_usuario_permitido(uuid),public.clube_caixa_mensagens(uuid,integer) TO service_role;
NOTIFY pgrst,'reload schema';
CREATE OR REPLACE FUNCTION public.clube_mensagens_nao_lidas(p_tipo text,p_id uuid) RETURNS bigint
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT count(*) FROM clube_mensagens m
 WHERE ((p_tipo='associado' AND m.associado_id=p_id AND m.remetente_tipo='equipe') OR (p_tipo='equipe' AND m.remetente_tipo='associado'))
 AND NOT EXISTS(SELECT 1 FROM clube_mensagens_leituras l WHERE l.mensagem_id=m.id AND l.leitor_tipo=p_tipo AND l.leitor_id=p_id);
$$;
REVOKE ALL ON FUNCTION public.clube_mensagens_nao_lidas(text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.clube_mensagens_nao_lidas(text,uuid) TO service_role;
NOTIFY pgrst,'reload schema';

CREATE OR REPLACE FUNCTION public.clube_push_salvar(p_endpoint text,p_chave text,p_segredo text,p_tipo text,p_id uuid,p_sessao text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE salvo uuid;
BEGIN
 INSERT INTO clube_push_inscricoes(endpoint,chave,segredo,dono_tipo,dono_id,sessao_hash)
 VALUES(p_endpoint,p_chave,p_segredo,p_tipo,p_id,p_sessao)
 ON CONFLICT(endpoint) DO UPDATE SET chave=excluded.chave,segredo=excluded.segredo,sessao_hash=excluded.sessao_hash
 WHERE clube_push_inscricoes.dono_tipo=excluded.dono_tipo AND clube_push_inscricoes.dono_id=excluded.dono_id
 RETURNING id INTO salvo;
 RETURN salvo IS NOT NULL;
END $$;
REVOKE ALL ON FUNCTION public.clube_push_salvar(text,text,text,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.clube_push_salvar(text,text,text,text,uuid,text) TO service_role;
NOTIFY pgrst,'reload schema';
