BEGIN;
ALTER TABLE public.bar_produtos ADD COLUMN IF NOT EXISTS enviar_cozinha boolean NOT NULL DEFAULT false;
ALTER TABLE public.bar_itens_pedido ADD COLUMN IF NOT EXISTS enviar_cozinha boolean NOT NULL DEFAULT false;
ALTER TABLE public.bar_pedidos ADD COLUMN IF NOT EXISTS cliente_nome varchar(120);
INSERT INTO public.bar_categorias(nome, ativo, ordem)
SELECT nome, true, ordem FROM (VALUES ('Bebidas', 10), ('Pratos', 20), ('Lanches', 30), ('Pizzas', 40), ('Porções', 50), ('Sobremesas', 60)) AS categorias(nome, ordem)
WHERE NOT EXISTS (SELECT 1 FROM public.bar_categorias c WHERE lower(c.nome) = lower(categorias.nome));
-- O destino é copiado do cadastro pelo banco, preservando a comanda histórica.
CREATE OR REPLACE FUNCTION public.bar_destino_item() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  SELECT enviar_cozinha INTO NEW.enviar_cozinha FROM public.bar_produtos WHERE id = NEW.produto_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS bar_destino_item ON public.bar_itens_pedido;
CREATE TRIGGER bar_destino_item BEFORE INSERT ON public.bar_itens_pedido
FOR EACH ROW EXECUTE FUNCTION public.bar_destino_item();
NOTIFY pgrst, 'reload schema';
COMMIT;
