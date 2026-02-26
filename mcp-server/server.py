"""
MCP Server - Sistema de Gestão de Clube
========================================
Servidor MCP (Model Context Protocol) que expõe todas as funcionalidades
do sistema-clube para integração com LLMs como Claude.

Conexão híbrida: Supabase direto + APIs Next.js
"""

import os
import json
import logging
from datetime import datetime, date
from typing import Any, Optional

from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP
from supabase import create_client, Client
import httpx

# Carregar variáveis de ambiente
load_dotenv()

# Configuração
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
CLUBE_API_URL = os.getenv("CLUBE_API_URL", "https://clube.mindforge.dev.br")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env")

# Clientes
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
http_client = httpx.AsyncClient(base_url=CLUBE_API_URL, timeout=30.0)

# Criar servidor MCP
mcp = FastMCP("Sistema Clube")

logger = logging.getLogger("sistema-clube-mcp")


# ============================================================
# HELPERS
# ============================================================

def serialize(data: Any) -> str:
    """Serializa dados para JSON, tratando tipos especiais."""
    def default(obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return str(obj)
    return json.dumps(data, default=default, ensure_ascii=False, indent=2)


def format_cpf(cpf: str) -> str:
    """Formata CPF para busca (remove pontuação)."""
    return cpf.replace(".", "").replace("-", "").replace(" ", "")


def ok(data: Any, msg: str = "") -> str:
    """Retorna resposta de sucesso."""
    if msg:
        return f"{msg}\n\n{serialize(data)}"
    return serialize(data)


def err(msg: str) -> str:
    """Retorna resposta de erro."""
    return f"❌ Erro: {msg}"


# ============================================================
# MÓDULO: ASSOCIADOS
# ============================================================

@mcp.tool()
async def buscar_associados(
    busca: Optional[str] = None,
    status: Optional[str] = None,
    plano: Optional[str] = None,
    limite: int = 20,
) -> str:
    """Busca associados do clube com filtros opcionais.

    Args:
        busca: Texto para buscar no nome ou CPF do associado
        status: Filtrar por status (ativo, inativo, suspenso, expulso)
        plano: Filtrar por plano (individual, familiar, patrimonial)
        limite: Máximo de resultados (padrão 20)
    """
    try:
        query = supabase.table("associados").select("*").order("nome").limit(limite)

        if busca:
            busca_limpa = format_cpf(busca) if busca.replace(".", "").replace("-", "").isdigit() else busca
            query = query.or_(f"nome.ilike.%{busca}%,cpf.ilike.%{busca_limpa}%")

        if status:
            query = query.eq("status", status)

        if plano:
            query = query.eq("plano", plano)

        result = query.execute()
        total = len(result.data)
        return ok(result.data, f"✅ {total} associado(s) encontrado(s)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def obter_associado(associado_id: str) -> str:
    """Obtém detalhes completos de um associado pelo ID.

    Args:
        associado_id: UUID do associado
    """
    try:
        result = supabase.table("associados").select("*").eq("id", associado_id).single().execute()
        return ok(result.data)
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def obter_associado_por_cpf(cpf: str) -> str:
    """Busca um associado pelo CPF.

    Args:
        cpf: CPF do associado (com ou sem formatação)
    """
    try:
        cpf_limpo = format_cpf(cpf)
        result = supabase.table("associados").select("*").eq("cpf", cpf_limpo).single().execute()
        return ok(result.data)
    except Exception as e:
        return err(f"Associado com CPF {cpf} não encontrado: {e}")


@mcp.tool()
async def criar_associado(
    nome: str,
    cpf: str,
    plano: str,
    numero_titulo: int,
    telefone: Optional[str] = None,
    email: Optional[str] = None,
    data_nascimento: Optional[str] = None,
    endereco: Optional[str] = None,
    bairro: Optional[str] = None,
    cidade: Optional[str] = None,
    estado: Optional[str] = None,
    cep: Optional[str] = None,
) -> str:
    """Cria um novo associado no clube.

    Args:
        nome: Nome completo do associado
        cpf: CPF (com ou sem formatação)
        plano: Tipo de plano (individual, familiar, patrimonial)
        numero_titulo: Número do título do associado
        telefone: Telefone com DDD
        email: Email do associado
        data_nascimento: Data de nascimento (YYYY-MM-DD)
        endereco: Endereço completo
        bairro: Bairro
        cidade: Cidade
        estado: Estado (UF)
        cep: CEP
    """
    try:
        dados = {
            "nome": nome,
            "cpf": format_cpf(cpf),
            "plano": plano,
            "numero_titulo": numero_titulo,
            "status": "ativo",
            "data_associacao": date.today().isoformat(),
        }
        if telefone: dados["telefone"] = telefone
        if email: dados["email"] = email
        if data_nascimento: dados["data_nascimento"] = data_nascimento
        if endereco: dados["endereco"] = endereco
        if bairro: dados["bairro"] = bairro
        if cidade: dados["cidade"] = cidade
        if estado: dados["estado"] = estado
        if cep: dados["cep"] = cep

        result = supabase.table("associados").insert(dados).execute()
        return ok(result.data[0], f"✅ Associado '{nome}' criado com sucesso!")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def atualizar_associado(associado_id: str, **campos) -> str:
    """Atualiza dados de um associado existente.

    Args:
        associado_id: UUID do associado
        **campos: Campos a atualizar (nome, telefone, email, status, plano, etc.)
    """
    try:
        dados = {k: v for k, v in campos.items() if v is not None}
        if not dados:
            return err("Nenhum campo para atualizar")

        dados["updated_at"] = datetime.now().isoformat()

        result = supabase.table("associados").update(dados).eq("id", associado_id).execute()
        return ok(result.data[0] if result.data else {}, "✅ Associado atualizado!")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def estatisticas_associados() -> str:
    """Retorna estatísticas gerais dos associados (total, ativos, inativos, por plano)."""
    try:
        total = supabase.table("associados").select("*", count="exact", head=True).execute()
        ativos = supabase.table("associados").select("*", count="exact", head=True).eq("status", "ativo").execute()
        inativos = supabase.table("associados").select("*", count="exact", head=True).eq("status", "inativo").execute()
        suspensos = supabase.table("associados").select("*", count="exact", head=True).eq("status", "suspenso").execute()

        individual = supabase.table("associados").select("*", count="exact", head=True).eq("plano", "individual").execute()
        familiar = supabase.table("associados").select("*", count="exact", head=True).eq("plano", "familiar").execute()
        patrimonial = supabase.table("associados").select("*", count="exact", head=True).eq("plano", "patrimonial").execute()

        stats = {
            "total": total.count or 0,
            "ativos": ativos.count or 0,
            "inativos": inativos.count or 0,
            "suspensos": suspensos.count or 0,
            "por_plano": {
                "individual": individual.count or 0,
                "familiar": familiar.count or 0,
                "patrimonial": patrimonial.count or 0,
            }
        }
        return ok(stats, "📊 Estatísticas de Associados")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: DEPENDENTES
# ============================================================

@mcp.tool()
async def buscar_dependentes(
    associado_id: Optional[str] = None,
    busca: Optional[str] = None,
    status: Optional[str] = None,
    limite: int = 50,
) -> str:
    """Busca dependentes de associados.

    Args:
        associado_id: Filtrar por associado titular
        busca: Buscar por nome
        status: Filtrar por status (ativo, inativo)
        limite: Máximo de resultados
    """
    try:
        query = supabase.table("dependentes").select("*, associados(nome, numero_titulo)").order("nome").limit(limite)

        if associado_id:
            query = query.eq("associado_id", associado_id)
        if busca:
            query = query.ilike("nome", f"%{busca}%")
        if status:
            query = query.eq("status", status)

        result = query.execute()
        return ok(result.data, f"✅ {len(result.data)} dependente(s) encontrado(s)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def criar_dependente(
    associado_id: str,
    nome: str,
    parentesco: str,
    cpf: Optional[str] = None,
    data_nascimento: Optional[str] = None,
    telefone: Optional[str] = None,
    email: Optional[str] = None,
) -> str:
    """Cria um novo dependente para um associado.

    Args:
        associado_id: UUID do associado titular
        nome: Nome completo do dependente
        parentesco: Relação (conjuge, filho, filha, pai, mae, outro)
        cpf: CPF do dependente
        data_nascimento: Data de nascimento (YYYY-MM-DD)
        telefone: Telefone
        email: Email
    """
    try:
        dados = {
            "associado_id": associado_id,
            "nome": nome,
            "parentesco": parentesco,
            "status": "ativo",
        }
        if cpf: dados["cpf"] = format_cpf(cpf)
        if data_nascimento: dados["data_nascimento"] = data_nascimento
        if telefone: dados["telefone"] = telefone
        if email: dados["email"] = email

        result = supabase.table("dependentes").insert(dados).execute()
        return ok(result.data[0], f"✅ Dependente '{nome}' criado!")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: FINANCEIRO
# ============================================================

@mcp.tool()
async def buscar_mensalidades(
    associado_id: Optional[str] = None,
    status: Optional[str] = None,
    referencia: Optional[str] = None,
    ano: Optional[int] = None,
    limite: int = 50,
) -> str:
    """Busca mensalidades com filtros.

    Args:
        associado_id: Filtrar por associado
        status: Status do pagamento (pendente, pago, atrasado, cancelado)
        referencia: Mês de referência (formato YYYY-MM)
        ano: Ano de referência
        limite: Máximo de resultados
    """
    try:
        query = supabase.table("mensalidades").select("*, associados(nome, numero_titulo)").order("data_vencimento", desc=True).limit(limite)

        if associado_id:
            query = query.eq("associado_id", associado_id)
        if status:
            query = query.eq("status", status)
        if referencia:
            query = query.eq("referencia", referencia)
        if ano:
            query = query.ilike("referencia", f"{ano}-%")

        result = query.execute()
        return ok(result.data, f"✅ {len(result.data)} mensalidade(s) encontrada(s)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def registrar_pagamento(
    mensalidade_id: str,
    valor_pago: float,
    forma_pagamento: str,
    data_pagamento: Optional[str] = None,
    observacao: Optional[str] = None,
) -> str:
    """Registra o pagamento de uma mensalidade.

    Args:
        mensalidade_id: UUID da mensalidade
        valor_pago: Valor pago
        forma_pagamento: Forma de pagamento (dinheiro, pix, cartao_credito, cartao_debito, boleto, transferencia)
        data_pagamento: Data do pagamento (YYYY-MM-DD). Se não informado, usa hoje.
        observacao: Observação opcional
    """
    try:
        dados = {
            "valor_pago": valor_pago,
            "forma_pagamento": forma_pagamento,
            "data_pagamento": data_pagamento or date.today().isoformat(),
            "status": "pago",
            "updated_at": datetime.now().isoformat(),
        }
        if observacao:
            dados["observacao"] = observacao

        result = supabase.table("mensalidades").update(dados).eq("id", mensalidade_id).execute()
        return ok(result.data[0] if result.data else {}, "✅ Pagamento registrado!")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def gerar_mensalidades(
    referencia: str,
    valor: float,
    data_vencimento: str,
    plano: Optional[str] = None,
) -> str:
    """Gera mensalidades em lote para todos os associados ativos.

    Args:
        referencia: Mês de referência (formato YYYY-MM, ex: 2026-03)
        valor: Valor da mensalidade
        data_vencimento: Data de vencimento (YYYY-MM-DD)
        plano: Gerar apenas para um plano específico (individual, familiar, patrimonial)
    """
    try:
        query = supabase.table("associados").select("id, nome").eq("status", "ativo")
        if plano:
            query = query.eq("plano", plano)
        
        associados = query.execute()

        if not associados.data:
            return err("Nenhum associado ativo encontrado")

        mensalidades = [
            {
                "associado_id": a["id"],
                "referencia": referencia,
                "valor": valor,
                "data_vencimento": data_vencimento,
                "status": "pendente",
            }
            for a in associados.data
        ]

        result = supabase.table("mensalidades").insert(mensalidades).execute()
        return ok(
            {"total_geradas": len(result.data), "referencia": referencia, "valor": valor},
            f"✅ {len(result.data)} mensalidades geradas para {referencia}!"
        )
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def estatisticas_financeiro(mes: Optional[str] = None) -> str:
    """Retorna estatísticas financeiras (recebido, a receber, inadimplentes).

    Args:
        mes: Mês de referência (YYYY-MM). Se não informado, usa o mês atual.
    """
    try:
        ref = mes or date.today().strftime("%Y-%m")

        pendentes = supabase.table("mensalidades").select("valor", count="exact").eq("referencia", ref).eq("status", "pendente").execute()
        pagos = supabase.table("mensalidades").select("valor_pago", count="exact").eq("referencia", ref).eq("status", "pago").execute()
        atrasados = supabase.table("mensalidades").select("valor", count="exact").eq("referencia", ref).eq("status", "atrasado").execute()

        total_receber = sum(m["valor"] for m in (pendentes.data or []))
        total_recebido = sum(m.get("valor_pago", 0) or 0 for m in (pagos.data or []))
        total_atrasado = sum(m["valor"] for m in (atrasados.data or []))

        stats = {
            "referencia": ref,
            "total_receber": total_receber,
            "total_recebido": total_recebido,
            "total_atrasado": total_atrasado,
            "qtd_pendentes": pendentes.count or 0,
            "qtd_pagos": pagos.count or 0,
            "qtd_atrasados": atrasados.count or 0,
        }
        return ok(stats, "📊 Estatísticas Financeiras")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def listar_inadimplentes(meses_atrasados: int = 1) -> str:
    """Lista associados inadimplentes (com mensalidades atrasadas).

    Args:
        meses_atrasados: Mínimo de meses atrasados para considerar inadimplente (padrão 1)
    """
    try:
        result = supabase.table("mensalidades").select(
            "associado_id, associados(nome, telefone, email, numero_titulo), referencia, valor, data_vencimento"
        ).eq("status", "atrasado").order("data_vencimento").execute()

        inadimplentes = {}
        for m in (result.data or []):
            aid = m["associado_id"]
            if aid not in inadimplentes:
                inadimplentes[aid] = {
                    "associado": m.get("associados"),
                    "mensalidades_atrasadas": [],
                    "total_devedor": 0,
                }
            inadimplentes[aid]["mensalidades_atrasadas"].append({
                "referencia": m["referencia"],
                "valor": m["valor"],
                "vencimento": m["data_vencimento"],
            })
            inadimplentes[aid]["total_devedor"] += m["valor"]

        filtrados = {
            k: v for k, v in inadimplentes.items()
            if len(v["mensalidades_atrasadas"]) >= meses_atrasados
        }

        return ok(list(filtrados.values()), f"⚠️ {len(filtrados)} associado(s) inadimplente(s)")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: PORTARIA (corrigido - usa created_at, ponto_acesso_id)
# ============================================================

@mcp.tool()
async def registros_acesso(
    local: Optional[str] = None,
    tipo: Optional[str] = None,
    associado_id: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    limite: int = 50,
) -> str:
    """Lista registros de acesso na portaria.

    Args:
        local: Local de acesso (clube, piscina, academia) - filtra pelo ponto de acesso
        tipo: Tipo de registro (entrada, saida)
        associado_id: Filtrar por associado específico
        data_inicio: Data inicial (YYYY-MM-DD)
        data_fim: Data final (YYYY-MM-DD)
        limite: Máximo de resultados
    """
    try:
        query = supabase.table("registros_acesso").select(
            "*, pontos_acesso(nome, tipo), associados(nome, numero_titulo), dependentes(nome)"
        ).order("created_at", desc=True).limit(limite)

        if tipo:
            query = query.eq("tipo", tipo)
        if associado_id:
            query = query.eq("associado_id", associado_id)
        if data_inicio:
            query = query.gte("created_at", f"{data_inicio}T00:00:00")
        if data_fim:
            query = query.lte("created_at", f"{data_fim}T23:59:59")

        result = query.execute()

        # Filtrar por local (tipo do ponto de acesso) em memória se necessário
        data = result.data or []
        if local:
            data = [r for r in data if r.get("pontos_acesso", {}).get("tipo") == local]

        return ok(data, f"✅ {len(data)} registro(s) de acesso")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def validar_acesso(pessoa_id: str, tipo_pessoa: str, local: str = "clube") -> str:
    """Valida se uma pessoa pode acessar determinado local do clube.

    Verifica: status ativo, adimplência, exame médico (para academia/piscina).

    Args:
        pessoa_id: UUID da pessoa (associado ou dependente)
        tipo_pessoa: Tipo (associado ou dependente)
        local: Local de acesso (clube, piscina, academia)
    """
    try:
        alertas = []
        
        if tipo_pessoa == "associado":
            pessoa = supabase.table("associados").select("*").eq("id", pessoa_id).single().execute()
            dados = pessoa.data
            titular_id = pessoa_id
        else:
            pessoa = supabase.table("dependentes").select("*, associados(id, status)").eq("id", pessoa_id).single().execute()
            dados = pessoa.data
            titular_id = dados.get("associado_id")
            titular = dados.get("associados", {})
            if titular.get("status") != "ativo":
                return ok({
                    "permitido": False,
                    "motivo": f"Titular com status '{titular.get('status')}' - acesso negado",
                    "pessoa": dados,
                })

        if dados.get("status") != "ativo":
            return ok({
                "permitido": False,
                "motivo": f"Status '{dados.get('status')}' - acesso negado",
                "pessoa": dados,
            })

        # Verificar adimplência
        atrasados = supabase.table("mensalidades").select("*", count="exact", head=True)\
            .eq("associado_id", titular_id).eq("status", "atrasado").execute()

        if (atrasados.count or 0) > 0:
            alertas.append(f"⚠️ {atrasados.count} mensalidade(s) atrasada(s)")
            return ok({
                "permitido": False,
                "motivo": "Associado inadimplente",
                "alertas": alertas,
                "pessoa": dados,
            })

        # Verificar exame médico para academia/piscina
        if local in ("academia", "piscina"):
            exame_field = "associado_id" if tipo_pessoa == "associado" else "dependente_id"
            exame = supabase.table("exames_medicos").select("*")\
                .eq(exame_field, pessoa_id).eq("resultado", "apto")\
                .gte("data_validade", date.today().isoformat())\
                .order("data_validade", desc=True).limit(1).execute()

            if not exame.data:
                return ok({
                    "permitido": False,
                    "motivo": f"Exame médico obrigatório para {local} não encontrado ou vencido",
                    "pessoa": dados,
                })

        return ok({
            "permitido": True,
            "alertas": alertas,
            "pessoa": dados,
        }, f"✅ Acesso PERMITIDO ao(à) {local}")

    except Exception as e:
        return err(str(e))


@mcp.tool()
async def registrar_acesso(
    pessoa_id: str,
    tipo_pessoa: str,
    tipo: str,
    local: str = "clube",
    observacao: Optional[str] = None,
) -> str:
    """Registra uma entrada ou saída na portaria.

    Args:
        pessoa_id: UUID da pessoa
        tipo_pessoa: Tipo (associado, dependente, convidado)
        tipo: Tipo de registro (entrada, saida)
        local: Local (clube, piscina, academia)
        observacao: Observação opcional
    """
    try:
        # Buscar ponto de acesso pelo tipo/local
        ponto = supabase.table("pontos_acesso").select("id")\
            .eq("tipo", local).eq("ativo", True).limit(1).execute()

        if not ponto.data:
            return err(f"Ponto de acesso '{local}' não encontrado ou inativo. Cadastre um ponto de acesso primeiro.")

        dados = {
            "ponto_acesso_id": ponto.data[0]["id"],
            "tipo": tipo,
        }

        # Definir campo correto baseado no tipo de pessoa
        if tipo_pessoa == "associado":
            dados["associado_id"] = pessoa_id
        elif tipo_pessoa == "dependente":
            dados["dependente_id"] = pessoa_id
        elif tipo_pessoa == "convidado":
            dados["convidado_id"] = pessoa_id

        if observacao:
            dados["observacoes"] = observacao

        result = supabase.table("registros_acesso").insert(dados).execute()
        return ok(result.data[0], f"✅ {tipo.capitalize()} registrada no(a) {local}")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def estatisticas_portaria(local: Optional[str] = None) -> str:
    """Estatísticas de acesso do dia atual na portaria.

    Args:
        local: Filtrar por local (clube, piscina, academia). Se não informado, retorna todos.
    """
    try:
        hoje = date.today().isoformat()

        # Buscar ponto de acesso se local especificado
        ponto_id = None
        if local:
            ponto = supabase.table("pontos_acesso").select("id")\
                .eq("tipo", local).eq("ativo", True).limit(1).execute()
            if ponto.data:
                ponto_id = ponto.data[0]["id"]

        query_entradas = supabase.table("registros_acesso").select("*", count="exact", head=True)\
            .eq("tipo", "entrada").gte("created_at", f"{hoje}T00:00:00")
        query_saidas = supabase.table("registros_acesso").select("*", count="exact", head=True)\
            .eq("tipo", "saida").gte("created_at", f"{hoje}T00:00:00")

        if ponto_id:
            query_entradas = query_entradas.eq("ponto_acesso_id", ponto_id)
            query_saidas = query_saidas.eq("ponto_acesso_id", ponto_id)

        entradas = query_entradas.execute()
        saidas = query_saidas.execute()

        stats = {
            "data": hoje,
            "local": local or "todos",
            "entradas_hoje": entradas.count or 0,
            "saidas_hoje": saidas.count or 0,
            "presentes_estimado": (entradas.count or 0) - (saidas.count or 0),
        }
        return ok(stats, "📊 Estatísticas da Portaria")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: CRM / WHATSAPP (corrigido - usa conversas_whatsapp, mensagens_whatsapp)
# ============================================================

@mcp.tool()
async def buscar_contatos_crm(
    busca: Optional[str] = None,
    status: Optional[str] = None,
    limite: int = 30,
) -> str:
    """Busca conversas no CRM do WhatsApp.

    Args:
        busca: Buscar por nome ou telefone
        status: Status da conversa (aberta, aguardando, resolvida, arquivada)
        limite: Máximo de resultados
    """
    try:
        query = supabase.table("conversas_whatsapp").select(
            "*, associados(nome, numero_titulo), usuarios!conversas_whatsapp_atendente_id_fkey(nome)"
        ).order("ultimo_contato", desc=True).limit(limite)

        if busca:
            query = query.or_(f"nome_contato.ilike.%{busca}%,telefone.ilike.%{busca}%")
        if status:
            query = query.eq("status", status)

        result = query.execute()
        return ok(result.data, f"✅ {len(result.data)} conversa(s) encontrada(s)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def buscar_mensagens_crm(
    contato_id: str,
    limite: int = 50,
) -> str:
    """Lista mensagens de uma conversa no CRM.

    Args:
        contato_id: UUID da conversa (conversas_whatsapp.id)
        limite: Máximo de mensagens
    """
    try:
        result = supabase.table("mensagens_whatsapp").select("*")\
            .eq("conversa_id", contato_id).order("created_at", desc=True).limit(limite).execute()
        return ok(result.data, f"✅ {len(result.data)} mensagem(ns)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def enviar_whatsapp(
    telefone: str,
    mensagem: str,
) -> str:
    """Envia uma mensagem via WhatsApp usando o provider configurado.

    Usa a API do Next.js que gerencia os providers (WaSender/Meta).

    Args:
        telefone: Número do telefone (com DDD, ex: 5516999999999)
        mensagem: Texto da mensagem
    """
    try:
        response = await http_client.post(
            "/api/whatsapp/send",
            json={"telefone": telefone, "mensagem": mensagem},
        )
        response.raise_for_status()
        data = response.json()
        return ok(data, f"✅ Mensagem enviada para {telefone}")
    except httpx.HTTPStatusError as e:
        return err(f"Erro ao enviar WhatsApp ({e.response.status_code}): {e.response.text}")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def estatisticas_crm() -> str:
    """Retorna estatísticas do CRM (conversas, mensagens hoje, em atendimento)."""
    try:
        hoje = date.today().isoformat()

        total = supabase.table("conversas_whatsapp").select("*", count="exact", head=True).execute()
        abertas = supabase.table("conversas_whatsapp").select("*", count="exact", head=True)\
            .eq("status", "aberta").execute()
        aguardando = supabase.table("conversas_whatsapp").select("*", count="exact", head=True)\
            .eq("status", "aguardando").execute()
        msgs_hoje = supabase.table("mensagens_whatsapp").select("*", count="exact", head=True)\
            .gte("created_at", f"{hoje}T00:00:00").execute()

        stats = {
            "total_conversas": total.count or 0,
            "abertas": abertas.count or 0,
            "aguardando": aguardando.count or 0,
            "mensagens_hoje": msgs_hoje.count or 0,
        }
        return ok(stats, "📊 Estatísticas do CRM")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: COMPRAS
# ============================================================

@mcp.tool()
async def buscar_compras(
    status: Optional[str] = None,
    fornecedor_id: Optional[str] = None,
    data_inicio: Optional[str] = None,
    data_fim: Optional[str] = None,
    limite: int = 30,
) -> str:
    """Busca compras realizadas pelo clube.

    Args:
        status: Status da compra (rascunho, pendente, aprovada, finalizada, cancelada)
        fornecedor_id: Filtrar por fornecedor
        data_inicio: Data inicial (YYYY-MM-DD)
        data_fim: Data final (YYYY-MM-DD)
        limite: Máximo de resultados
    """
    try:
        query = supabase.table("compras").select("*").order("data_compra", desc=True).limit(limite)

        if status: query = query.eq("status", status)
        if fornecedor_id: query = query.eq("fornecedor_id", fornecedor_id)
        if data_inicio: query = query.gte("data_compra", data_inicio)
        if data_fim: query = query.lte("data_compra", data_fim)

        result = query.execute()
        return ok(result.data, f"✅ {len(result.data)} compra(s) encontrada(s)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def buscar_fornecedores(busca: Optional[str] = None, limite: int = 30) -> str:
    """Lista fornecedores cadastrados.

    Args:
        busca: Buscar por nome ou CNPJ
        limite: Máximo de resultados
    """
    try:
        query = supabase.table("fornecedores").select("*").eq("ativo", True).order("nome").limit(limite)

        if busca:
            query = query.or_(f"nome.ilike.%{busca}%,cnpj.ilike.%{busca}%")

        result = query.execute()
        return ok(result.data, f"✅ {len(result.data)} fornecedor(es)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def criar_compra(
    descricao: str,
    valor_total: float,
    fornecedor_id: Optional[str] = None,
    data_compra: Optional[str] = None,
    observacoes: Optional[str] = None,
) -> str:
    """Registra uma nova compra.

    Args:
        descricao: Descrição da compra
        valor_total: Valor total
        fornecedor_id: UUID do fornecedor (opcional)
        data_compra: Data da compra (YYYY-MM-DD). Se não informado, usa hoje.
        observacoes: Observações
    """
    try:
        dados = {
            "descricao": descricao,
            "valor_total": valor_total,
            "valor_pago": 0,
            "status": "pendente",
            "status_pagamento": "pendente",
            "data_compra": data_compra or date.today().isoformat(),
        }
        if fornecedor_id: dados["fornecedor_id"] = fornecedor_id
        if observacoes: dados["observacoes"] = observacoes

        result = supabase.table("compras").insert(dados).execute()
        return ok(result.data[0], "✅ Compra registrada!")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: ELEIÇÕES (corrigido - usa chapas intermediárias)
# ============================================================

@mcp.tool()
async def buscar_eleicoes(status: Optional[str] = None) -> str:
    """Lista eleições do clube.

    Args:
        status: Filtrar por status (agendada, em_andamento, encerrada, cancelada)
    """
    try:
        query = supabase.table("eleicoes").select(
            "*, chapas(*, candidatos(*, associados(nome)))"
        ).order("data_inicio", desc=True)

        if status:
            query = query.eq("status", status)

        result = query.execute()
        return ok(result.data, f"✅ {len(result.data)} eleição(ões)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def resultado_eleicao(eleicao_id: str) -> str:
    """Obtém o resultado detalhado de uma eleição.

    Args:
        eleicao_id: UUID da eleição
    """
    try:
        eleicao = supabase.table("eleicoes").select("*").eq("id", eleicao_id).single().execute()
        chapas = supabase.table("chapas").select(
            "*, candidatos(*, associados(nome))"
        ).eq("eleicao_id", eleicao_id).execute()

        # Contar votos por chapa
        votos = supabase.table("votos").select("chapa_id").eq("eleicao_id", eleicao_id).execute()
        total_votos = len(votos.data or [])
        votos_brancos = len([v for v in (votos.data or []) if v.get("chapa_id") is None])

        # Contagem por chapa
        contagem = {}
        for v in (votos.data or []):
            cid = v.get("chapa_id")
            if cid:
                contagem[cid] = contagem.get(cid, 0) + 1

        resultado_chapas = []
        for chapa in (chapas.data or []):
            votos_chapa = contagem.get(chapa["id"], 0)
            resultado_chapas.append({
                **chapa,
                "votos": votos_chapa,
                "percentual": round((votos_chapa / total_votos * 100), 2) if total_votos > 0 else 0,
            })

        # Ordenar por votos desc
        resultado_chapas.sort(key=lambda x: x["votos"], reverse=True)

        resultado = {
            "eleicao": eleicao.data,
            "chapas": resultado_chapas,
            "total_votos": total_votos,
            "votos_brancos": votos_brancos,
        }
        return ok(resultado, "🗳️ Resultado da Eleição")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: EXAMES MÉDICOS
# ============================================================

@mcp.tool()
async def buscar_exames(
    pessoa_id: Optional[str] = None,
    status: Optional[str] = None,
    vencidos: bool = False,
    a_vencer_dias: Optional[int] = None,
    limite: int = 50,
) -> str:
    """Busca exames médicos.

    Args:
        pessoa_id: Filtrar por pessoa (associado ou dependente)
        status: Resultado do exame (apto, inapto, pendente)
        vencidos: Se True, retorna apenas exames vencidos
        a_vencer_dias: Retorna exames que vencem nos próximos X dias
        limite: Máximo de resultados
    """
    try:
        query = supabase.table("exames_medicos").select("*").order("data_validade", desc=True).limit(limite)

        if pessoa_id:
            query = query.eq("associado_id", pessoa_id)
        if status:
            query = query.eq("resultado", status)
        if vencidos:
            query = query.lt("data_validade", date.today().isoformat())
        if a_vencer_dias:
            from datetime import timedelta
            limite_data = (date.today() + timedelta(days=a_vencer_dias)).isoformat()
            query = query.gte("data_validade", date.today().isoformat()).lte("data_validade", limite_data)

        result = query.execute()
        return ok(result.data, f"✅ {len(result.data)} exame(s) encontrado(s)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def registrar_exame(
    pessoa_id: str,
    tipo_pessoa: str,
    data_exame: str,
    data_validade: str,
    medico_nome: Optional[str] = None,
    crm_medico: Optional[str] = None,
    clinica: Optional[str] = None,
    resultado: Optional[str] = None,
) -> str:
    """Registra um exame médico para um associado ou dependente.

    Args:
        pessoa_id: UUID da pessoa
        tipo_pessoa: Tipo (associado ou dependente)
        data_exame: Data do exame (YYYY-MM-DD)
        data_validade: Data de validade (YYYY-MM-DD)
        medico_nome: Nome do médico
        crm_medico: CRM do médico
        clinica: Nome da clínica
        resultado: Resultado do exame (apto, inapto)
    """
    try:
        dados = {
            "associado_id": pessoa_id,
            "data_exame": data_exame,
            "data_validade": data_validade,
            "resultado": resultado or "apto",
            "tipo_exame": "admissional",
        }
        if medico_nome: dados["medico_nome"] = medico_nome
        if crm_medico: dados["crm_medico"] = crm_medico

        result = supabase.table("exames_medicos").insert(dados).execute()
        return ok(result.data[0], "✅ Exame médico registrado!")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: PUNIÇÕES E RECLAMAÇÕES (corrigido - era "infrações")
# ============================================================

@mcp.tool()
async def buscar_infracoes(
    associado_id: Optional[str] = None,
    gravidade: Optional[str] = None,
    status: Optional[str] = None,
    limite: int = 30,
) -> str:
    """Busca punições e reclamações registradas.

    Args:
        associado_id: Filtrar por associado
        gravidade: Filtrar por tipo de punição (advertencia, suspensao, expulsao)
        status: Filtrar por status da reclamação (aberta, em_analise, resolvida, arquivada)
        limite: Máximo de resultados
    """
    try:
        # Buscar punições
        query_punicoes = supabase.table("punicoes").select(
            "*, associados(nome, numero_titulo), reclamacoes(descricao, local_ocorrencia)"
        ).order("created_at", desc=True).limit(limite)

        if associado_id:
            query_punicoes = query_punicoes.eq("associado_id", associado_id)
        if gravidade:
            query_punicoes = query_punicoes.eq("tipo", gravidade)

        punicoes = query_punicoes.execute()

        # Buscar reclamações
        query_reclamacoes = supabase.table("reclamacoes").select(
            "*, associados!reclamacoes_reclamado_id_fkey(nome, numero_titulo)"
        ).order("created_at", desc=True).limit(limite)

        if associado_id:
            query_reclamacoes = query_reclamacoes.eq("reclamado_id", associado_id)
        if status:
            query_reclamacoes = query_reclamacoes.eq("status", status)

        reclamacoes = query_reclamacoes.execute()

        resultado = {
            "punicoes": punicoes.data or [],
            "reclamacoes": reclamacoes.data or [],
            "total_punicoes": len(punicoes.data or []),
            "total_reclamacoes": len(reclamacoes.data or []),
        }
        return ok(resultado, f"✅ {len(punicoes.data or [])} punição(ões), {len(reclamacoes.data or [])} reclamação(ões)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def registrar_infracao(
    associado_id: str,
    descricao: str,
    gravidade: str,
    data_ocorrencia: Optional[str] = None,
    local: Optional[str] = None,
    testemunhas: Optional[str] = None,
) -> str:
    """Registra uma reclamação contra um associado.

    Args:
        associado_id: UUID do associado reclamado
        descricao: Descrição detalhada da ocorrência
        gravidade: Tipo (leve, media, grave) - usado para classificação
        data_ocorrencia: Data da ocorrência (YYYY-MM-DD). Se não informado, usa hoje.
        local: Local da ocorrência
        testemunhas: Testemunhas (informativo na descrição)
    """
    try:
        # Criar reclamação
        descricao_completa = descricao
        if testemunhas:
            descricao_completa += f"\n\nTestemunhas: {testemunhas}"
        if gravidade:
            descricao_completa += f"\n\nGravidade informada: {gravidade}"

        dados = {
            "reclamado_id": associado_id,
            "descricao": descricao_completa,
            "data_ocorrencia": data_ocorrencia or date.today().isoformat(),
            "status": "aberta",
        }
        if local:
            dados["local_ocorrencia"] = local

        result = supabase.table("reclamacoes").insert(dados).execute()
        return ok(result.data[0], "✅ Reclamação registrada!")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: CONFIGURAÇÕES (corrigido - planos_valores)
# ============================================================

@mcp.tool()
async def listar_planos() -> str:
    """Lista os planos disponíveis no clube com seus valores."""
    try:
        result = supabase.table("planos_valores").select("*").eq("ativo", True).order("tipo").execute()
        return ok(result.data, f"✅ {len(result.data)} plano(s)")
    except Exception as e:
        return err(str(e))


@mcp.tool()
async def listar_usuarios_sistema(setor: Optional[str] = None) -> str:
    """Lista usuários do sistema (funcionários/administradores).

    Args:
        setor: Filtrar por setor (admin, financeiro, portaria_clube, etc.)
    """
    try:
        query = supabase.table("usuarios").select("id, nome, email, setor, ativo").eq("ativo", True).order("nome")

        if setor:
            query = query.eq("setor", setor)

        result = query.execute()
        return ok(result.data, f"✅ {len(result.data)} usuário(s)")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: DASHBOARD / GERAL (corrigido)
# ============================================================

@mcp.tool()
async def resumo_geral() -> str:
    """Retorna um resumo geral do clube com dados de todos os módulos.

    Ideal para ter uma visão rápida do estado atual do clube.
    """
    try:
        hoje = date.today().isoformat()
        mes_atual = date.today().strftime("%Y-%m")

        # Associados
        assoc_total = supabase.table("associados").select("*", count="exact", head=True).execute()
        assoc_ativos = supabase.table("associados").select("*", count="exact", head=True).eq("status", "ativo").execute()

        # Financeiro
        mens_pagas = supabase.table("mensalidades").select("*", count="exact", head=True)\
            .eq("referencia", mes_atual).eq("status", "pago").execute()
        mens_atrasadas = supabase.table("mensalidades").select("*", count="exact", head=True)\
            .eq("status", "atrasado").execute()

        # Portaria (usando created_at)
        entradas_hoje = supabase.table("registros_acesso").select("*", count="exact", head=True)\
            .eq("tipo", "entrada").gte("created_at", f"{hoje}T00:00:00").execute()

        # CRM (tabela correta: conversas_whatsapp)
        crm_abertas = supabase.table("conversas_whatsapp").select("*", count="exact", head=True)\
            .eq("status", "aberta").execute()

        # Exames vencidos
        exames_vencidos = supabase.table("exames_medicos").select("*", count="exact", head=True)\
            .lt("data_validade", hoje).eq("resultado", "apto").execute()

        resumo = {
            "data": hoje,
            "associados": {
                "total": assoc_total.count or 0,
                "ativos": assoc_ativos.count or 0,
            },
            "financeiro": {
                "mensalidades_pagas_mes": mens_pagas.count or 0,
                "total_atrasadas": mens_atrasadas.count or 0,
            },
            "portaria": {
                "entradas_hoje": entradas_hoje.count or 0,
            },
            "crm": {
                "conversas_abertas": crm_abertas.count or 0,
            },
            "exames": {
                "vencidos": exames_vencidos.count or 0,
            },
        }
        return ok(resumo, "📊 Resumo Geral do Clube")
    except Exception as e:
        return err(str(e))


# ============================================================
# MÓDULO: CONSULTAS SQL (informativo - requer RPC)
# ============================================================

@mcp.tool()
async def consulta_sql(query: str) -> str:
    """Executa uma consulta SQL somente-leitura no banco de dados do clube.

    ⚠️ APENAS SELECT é permitido. Consultas INSERT/UPDATE/DELETE serão bloqueadas.
    ⚠️ Requer a function RPC 'execute_readonly_query' no Supabase.

    Args:
        query: Consulta SQL (apenas SELECT)
    """
    query_upper = query.strip().upper()
    if not query_upper.startswith("SELECT"):
        return err("Apenas consultas SELECT são permitidas por segurança.")

    blocked = ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "GRANT", "REVOKE"]
    for word in blocked:
        if word in query_upper:
            return err(f"Comando '{word}' não é permitido.")

    try:
        # Tentar via RPC function (deve existir no Supabase)
        result = supabase.rpc("execute_readonly_query", {"query_text": query}).execute()
        return ok(result.data, "✅ Consulta executada")
    except Exception as e:
        error_msg = str(e)
        if "PGRST202" in error_msg or "could not find" in error_msg.lower():
            return err(
                "A function RPC 'execute_readonly_query' não existe no Supabase. "
                "Para habilitar consultas SQL raw, crie a seguinte function no Supabase:\n\n"
                "CREATE OR REPLACE FUNCTION execute_readonly_query(query_text TEXT)\n"
                "RETURNS JSON AS $$\n"
                "BEGIN\n"
                "  IF query_text !~* '^\\s*SELECT' THEN\n"
                "    RAISE EXCEPTION 'Apenas SELECT permitido';\n"
                "  END IF;\n"
                "  RETURN (SELECT json_agg(row_to_json(t)) FROM (\n"
                "    EXECUTE query_text\n"
                "  ) t);\n"
                "END;\n"
                "$$ LANGUAGE plpgsql SECURITY DEFINER;\n\n"
                "Por enquanto, use as tools específicas do MCP."
            )
        return err(error_msg)


# ============================================================
# RESOURCES (Contexto estático)
# ============================================================

@mcp.resource("clube://schema/associados")
def schema_associados() -> str:
    """Schema da tabela de associados."""
    return json.dumps({
        "tabela": "associados",
        "campos": {
            "id": "uuid (PK)",
            "numero_titulo": "integer (único)",
            "nome": "text",
            "cpf": "text (único, sem formatação)",
            "rg": "text?",
            "email": "text?",
            "telefone": "text?",
            "plano": "individual | familiar | patrimonial",
            "status": "ativo | inativo | suspenso | expulso",
            "data_associacao": "date",
            "data_nascimento": "date?",
            "foto_url": "text?",
            "endereco": "text?",
            "bairro": "text?",
            "cidade": "text?",
            "estado": "text?",
            "cep": "text?",
        }
    }, ensure_ascii=False, indent=2)


@mcp.resource("clube://schema/financeiro")
def schema_financeiro() -> str:
    """Schema das tabelas financeiras."""
    return json.dumps({
        "planos_valores": {
            "id": "uuid (PK)",
            "tipo": "tipo_plano (individual, familiar, patrimonial)",
            "valor_mensal": "decimal",
            "taxa_dependente_extra": "decimal",
            "vigencia_inicio": "date",
            "vigencia_fim": "date?",
            "ativo": "boolean",
        },
        "mensalidades": {
            "id": "uuid (PK)",
            "associado_id": "uuid (FK associados)",
            "referencia": "text (YYYY-MM)",
            "valor": "numeric",
            "valor_pago": "numeric?",
            "data_vencimento": "date",
            "data_pagamento": "date?",
            "status": "pendente | pago | atrasado | cancelado",
            "forma_pagamento": "dinheiro | pix | cartao_credito | cartao_debito | boleto | transferencia",
        },
    }, ensure_ascii=False, indent=2)


@mcp.resource("clube://schema/portaria")
def schema_portaria() -> str:
    """Schema das tabelas de controle de acesso."""
    return json.dumps({
        "pontos_acesso": {
            "id": "uuid (PK)",
            "nome": "varchar(100)",
            "tipo": "clube | piscina | academia",
            "ativo": "boolean",
        },
        "registros_acesso": {
            "id": "uuid (PK)",
            "ponto_acesso_id": "uuid (FK pontos_acesso)",
            "associado_id": "uuid? (FK associados)",
            "dependente_id": "uuid? (FK dependentes)",
            "convidado_id": "uuid? (FK convites)",
            "tipo": "entrada | saida",
            "forma_identificacao": "qrcode | cpf | nome",
            "operador_id": "uuid? (FK usuarios)",
            "observacoes": "text?",
            "created_at": "timestamptz (data/hora do registro)",
        },
    }, ensure_ascii=False, indent=2)


@mcp.resource("clube://schema/crm")
def schema_crm() -> str:
    """Schema das tabelas do CRM WhatsApp."""
    return json.dumps({
        "conversas_whatsapp": {
            "id": "uuid (PK)",
            "associado_id": "uuid? (FK associados)",
            "telefone": "varchar(20)",
            "nome_contato": "varchar(255)?",
            "ultimo_contato": "timestamptz?",
            "atendente_id": "uuid? (FK usuarios)",
            "status": "aberta | aguardando | resolvida | arquivada",
            "tags": "text[]",
        },
        "mensagens_whatsapp": {
            "id": "uuid (PK)",
            "conversa_id": "uuid (FK conversas_whatsapp)",
            "direcao": "entrada | saida",
            "conteudo": "text",
            "tipo": "texto | imagem | documento | audio",
            "arquivo_url": "text?",
            "wasender_id": "varchar(100)?",
            "enviado_por": "uuid? (FK usuarios)",
            "lida": "boolean",
        },
    }, ensure_ascii=False, indent=2)


@mcp.resource("clube://schema/eleicoes")
def schema_eleicoes() -> str:
    """Schema das tabelas de eleições."""
    return json.dumps({
        "eleicoes": {
            "id": "uuid (PK)",
            "titulo": "varchar(255)",
            "descricao": "text?",
            "data_inicio": "timestamptz",
            "data_fim": "timestamptz",
            "status": "agendada | em_andamento | encerrada | cancelada",
            "mandato_inicio": "date",
            "mandato_fim": "date",
        },
        "chapas": {
            "id": "uuid (PK)",
            "eleicao_id": "uuid (FK eleicoes)",
            "numero": "integer",
            "nome": "varchar(255)",
            "proposta": "text?",
        },
        "candidatos": {
            "id": "uuid (PK)",
            "chapa_id": "uuid (FK chapas)",
            "associado_id": "uuid (FK associados)",
            "cargo": "cargo_diretoria",
        },
        "votos": {
            "id": "uuid (PK)",
            "eleicao_id": "uuid (FK eleicoes)",
            "chapa_id": "uuid? (FK chapas, NULL = branco)",
            "associado_id": "uuid (FK associados)",
            "UNIQUE": "(eleicao_id, associado_id)",
        },
    }, ensure_ascii=False, indent=2)


@mcp.resource("clube://regras-negocio")
def regras_negocio() -> str:
    """Regras de negócio do sistema do clube."""
    return """
    # Regras de Negócio - Sistema Clube

    ## Portaria / Controle de Acesso
    - Associado deve estar com status 'ativo' para entrar
    - Status 'suspenso', 'inativo' ou 'expulso' → acesso negado
    - Verificar adimplência (mensalidades em dia)
    - Academia e Piscina exigem exame médico válido (apto e não vencido)
    - Registro via pontos_acesso (cada local tem seu ponto)
    - Identificação por QR Code, CPF ou nome

    ## Dependentes
    - Dependente herda status de adimplência do titular
    - Se titular inativo/suspenso → dependente bloqueado
    - Exame médico é individual (dependente tem próprio exame)

    ## Financeiro
    - Planos em planos_valores (individual, familiar, patrimonial)
    - Mensalidades: pendente → pago / atrasado → cancelado
    - Inadimplência bloqueia acesso na portaria

    ## CRM WhatsApp
    - Tabelas: conversas_whatsapp + mensagens_whatsapp
    - Status de conversa: aberta, aguardando, resolvida, arquivada
    - Múltiplos providers (WaSender + Meta Cloud API)
    - Templates de mensagem e automações configuráveis

    ## Eleições
    - Estrutura: eleicoes → chapas → candidatos
    - Votos vinculados à chapa (NULL = voto em branco)
    - Cada associado vota uma vez por eleição (UNIQUE constraint)

    ## Punições
    - Reclamações (aberta → em_análise → resolvida)
    - Punições aplicadas via reunião da diretoria
    - Tipos: advertencia, suspensao, expulsao
    """


# ============================================================
# PROMPTS (Templates úteis)
# ============================================================

@mcp.prompt()
def relatorio_inadimplencia() -> str:
    """Gera um relatório de inadimplência para a diretoria."""
    return """
    Por favor, gere um relatório completo de inadimplência do clube:

    1. Use `listar_inadimplentes` para obter a lista completa
    2. Use `estatisticas_financeiro` para ter o resumo financeiro
    3. Use `estatisticas_associados` para contextualizar

    Formate o relatório com:
    - Resumo executivo
    - Total de inadimplentes vs total de associados
    - Valor total em aberto
    - Lista dos maiores devedores
    - Sugestões de ação (notificação, suspensão, etc.)
    """


@mcp.prompt()
def relatorio_diario() -> str:
    """Gera o relatório diário do clube."""
    return """
    Gere o relatório diário do clube usando as seguintes ferramentas:

    1. `resumo_geral` - Visão geral do clube
    2. `estatisticas_portaria` - Movimento do dia
    3. `estatisticas_financeiro` - Situação financeira
    4. `estatisticas_crm` - Atendimentos via WhatsApp

    Formate como um relatório executivo curto e objetivo.
    """


@mcp.prompt()
def verificar_acesso_completo(pessoa_nome: str) -> str:
    """Verifica completamente o acesso de uma pessoa ao clube."""
    return f"""
    Preciso verificar o acesso de "{pessoa_nome}" ao clube:

    1. Use `buscar_associados` com busca="{pessoa_nome}" para encontrar a pessoa
    2. Se encontrado, use `validar_acesso` para cada local (clube, academia, piscina)
    3. Use `buscar_exames` para verificar exames médicos
    4. Use `buscar_mensalidades` para verificar situação financeira
    5. Use `buscar_infracoes` para verificar punições/reclamações

    Apresente um resumo completo da situação da pessoa.
    """


# ============================================================
# ENTRYPOINT
# ============================================================

def main():
    """Inicia o servidor MCP."""
    mcp.run()


if __name__ == "__main__":
    main()
