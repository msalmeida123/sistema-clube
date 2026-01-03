// Script para gerar módulos seguindo SRP
// Uso: node scripts/generate-module.js <nome-do-modulo> <NomeEntidade>
// Exemplo: node scripts/generate-module.js financeiro Mensalidade

const fs = require('fs');
const path = require('path');

const moduleName = process.argv[2];
const entityName = process.argv[3];

if (!moduleName || !entityName) {
  console.log('Uso: node scripts/generate-module.js <nome-do-modulo> <NomeEntidade>');
  console.log('Exemplo: node scripts/generate-module.js financeiro Mensalidade');
  process.exit(1);
}

const moduleDir = path.join(__dirname, '..', 'src', 'modules', moduleName);
const entityLower = entityName.toLowerCase();
const entityPlural = entityLower + 's';

// Criar diretórios
const dirs = ['types', 'repositories', 'services', 'hooks', 'components'];
dirs.forEach(dir => {
  const fullPath = path.join(moduleDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Criado: ${dir}/`);
  }
});

// Template: types/index.ts
const typesContent = `// Tipos do módulo de ${entityName}

export interface ${entityName} {
  id: string
  // TODO: Adicionar campos específicos
  status: 'ativo' | 'inativo'
  created_at: string
  updated_at?: string
}

export interface ${entityName}Filters {
  search?: string
  status?: ${entityName}['status']
}

export interface ${entityName}FormData {
  // TODO: Adicionar campos do formulário
  status?: ${entityName}['status']
}
`;

// Template: repository
const repositoryContent = `// Repository de ${entityName}
import { SupabaseClient } from '@supabase/supabase-js'
import type { ${entityName}, ${entityName}Filters, ${entityName}FormData } from '../types'

export class ${entityName}sRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(filters?: ${entityName}Filters): Promise<${entityName}[]> {
    let query = this.supabase
      .from('${entityPlural}')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.search) {
      query = query.ilike('nome', \`%\${filters.search}%\`)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async findById(id: string): Promise<${entityName} | null> {
    const { data, error } = await this.supabase
      .from('${entityPlural}')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async create(data: ${entityName}FormData): Promise<${entityName}> {
    const { data: created, error } = await this.supabase
      .from('${entityPlural}')
      .insert({ ...data, status: data.status || 'ativo' })
      .select()
      .single()

    if (error) throw error
    return created
  }

  async update(id: string, data: Partial<${entityName}FormData>): Promise<${entityName}> {
    const { data: updated, error } = await this.supabase
      .from('${entityPlural}')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('${entityPlural}')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  async count(): Promise<number> {
    const { count, error } = await this.supabase
      .from('${entityPlural}')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  }
}

export const create${entityName}sRepository = (supabase: SupabaseClient) => {
  return new ${entityName}sRepository(supabase)
}
`;

// Template: service
const serviceContent = `// Service de ${entityName}
import type { ${entityName}, ${entityName}FormData, ${entityName}Filters } from '../types'
import { ${entityName}sRepository } from '../repositories/${entityLower}s.repository'

export class ${entityName}sService {
  constructor(private repository: ${entityName}sRepository) {}

  async listar(filters?: ${entityName}Filters): Promise<${entityName}[]> {
    return this.repository.findAll(filters)
  }

  async buscarPorId(id: string): Promise<${entityName} | null> {
    return this.repository.findById(id)
  }

  async criar(data: ${entityName}FormData): Promise<${entityName}> {
    // TODO: Adicionar validações
    return this.repository.create(data)
  }

  async atualizar(id: string, data: Partial<${entityName}FormData>): Promise<${entityName}> {
    return this.repository.update(id, data)
  }

  async excluir(id: string): Promise<void> {
    return this.repository.delete(id)
  }
}

export const create${entityName}sService = (repository: ${entityName}sRepository) => {
  return new ${entityName}sService(repository)
}
`;

// Template: hooks
const hooksContent = `// Hooks de ${entityName}
'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { create${entityName}sRepository } from '../repositories/${entityLower}s.repository'
import { create${entityName}sService } from '../services/${entityLower}s.service'
import type { ${entityName}, ${entityName}Filters, ${entityName}FormData } from '../types'

export function use${entityName}s(initialFilters?: ${entityName}Filters) {
  const [${entityPlural}, set${entityName}s] = useState<${entityName}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<${entityName}Filters>(initialFilters || {})

  const supabase = createClientComponentClient()
  const repository = create${entityName}sRepository(supabase)
  const service = create${entityName}sService(repository)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await service.listar(filters)
      set${entityName}s(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    carregar()
  }, [carregar])

  const buscar = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }, [])

  return {
    ${entityPlural},
    loading,
    error,
    filters,
    buscar,
    recarregar: carregar,
  }
}

export function use${entityName}(id: string) {
  const [${entityLower}, set${entityName}] = useState<${entityName} | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = create${entityName}sRepository(supabase)
  const service = create${entityName}sService(repository)

  useEffect(() => {
    const carregar = async () => {
      setLoading(true)
      try {
        const data = await service.buscarPorId(id)
        set${entityName}(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
      } finally {
        setLoading(false)
      }
    }
    if (id) carregar()
  }, [id])

  return { ${entityLower}, loading, error }
}

export function use${entityName}sMutations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClientComponentClient()
  const repository = create${entityName}sRepository(supabase)
  const service = create${entityName}sService(repository)

  const criar = useCallback(async (data: ${entityName}FormData) => {
    setLoading(true)
    setError(null)
    try {
      return await service.criar(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const atualizar = useCallback(async (id: string, data: Partial<${entityName}FormData>) => {
    setLoading(true)
    setError(null)
    try {
      return await service.atualizar(id, data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const excluir = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      await service.excluir(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { criar, atualizar, excluir, loading, error }
}
`;

// Template: index
const indexContent = `// Módulo de ${entityName}
export * from './types'
export { use${entityName}s, use${entityName}, use${entityName}sMutations } from './hooks/use${entityName}s'
export { ${entityName}sRepository, create${entityName}sRepository } from './repositories/${entityLower}s.repository'
export { ${entityName}sService, create${entityName}sService } from './services/${entityLower}s.service'
`;

// Escrever arquivos
fs.writeFileSync(path.join(moduleDir, 'types', 'index.ts'), typesContent);
fs.writeFileSync(path.join(moduleDir, 'repositories', `${entityLower}s.repository.ts`), repositoryContent);
fs.writeFileSync(path.join(moduleDir, 'services', `${entityLower}s.service.ts`), serviceContent);
fs.writeFileSync(path.join(moduleDir, 'hooks', `use${entityName}s.ts`), hooksContent);
fs.writeFileSync(path.join(moduleDir, 'index.ts'), indexContent);

console.log(`
✅ Módulo "${moduleName}" criado com sucesso!

Estrutura:
src/modules/${moduleName}/
├── types/index.ts
├── repositories/${entityLower}s.repository.ts
├── services/${entityLower}s.service.ts
├── hooks/use${entityName}s.ts
└── index.ts

Próximos passos:
1. Edite types/index.ts com os campos específicos
2. Ajuste o repository com as queries corretas
3. Adicione validações no service
4. Use na página: import { use${entityName}s } from '@/modules/${moduleName}'
`);
