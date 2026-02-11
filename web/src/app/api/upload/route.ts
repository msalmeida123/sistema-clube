import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Configuração de runtime para suportar uploads grandes
export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds timeout

// ==========================================
// CONFIGURAÇÕES DE SEGURANÇA DO UPLOAD
// ==========================================

// Tipos MIME permitidos
const TIPOS_PERMITIDOS = new Map([
  // Imagens
  ['image/jpeg', { ext: ['jpg', 'jpeg'], maxSize: 10 * 1024 * 1024 }],
  ['image/png', { ext: ['png'], maxSize: 10 * 1024 * 1024 }],
  ['image/gif', { ext: ['gif'], maxSize: 5 * 1024 * 1024 }],
  ['image/webp', { ext: ['webp'], maxSize: 10 * 1024 * 1024 }],
  
  // Documentos
  ['application/pdf', { ext: ['pdf'], maxSize: 20 * 1024 * 1024 }],
  ['application/msword', { ext: ['doc'], maxSize: 10 * 1024 * 1024 }],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', { ext: ['docx'], maxSize: 10 * 1024 * 1024 }],
  ['application/vnd.ms-excel', { ext: ['xls'], maxSize: 10 * 1024 * 1024 }],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', { ext: ['xlsx'], maxSize: 10 * 1024 * 1024 }],
  
  // Áudio
  ['audio/mpeg', { ext: ['mp3'], maxSize: 25 * 1024 * 1024 }],
  ['audio/ogg', { ext: ['ogg', 'oga'], maxSize: 25 * 1024 * 1024 }],
  ['audio/wav', { ext: ['wav'], maxSize: 25 * 1024 * 1024 }],
  ['audio/webm', { ext: ['weba'], maxSize: 25 * 1024 * 1024 }],
  
  // Vídeo
  ['video/mp4', { ext: ['mp4'], maxSize: 50 * 1024 * 1024 }],
  ['video/webm', { ext: ['webm'], maxSize: 50 * 1024 * 1024 }],
])

// Extensões bloqueadas (executáveis, scripts)
const EXTENSOES_BLOQUEADAS = [
  'exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'js', 'mjs', 'ts',
  'php', 'py', 'rb', 'pl', 'jar', 'msi', 'dll', 'so', 'dylib',
  'app', 'dmg', 'deb', 'rpm', 'apk', 'ipa', 'com', 'scr', 'pif',
  'html', 'htm', 'svg', 'xml', 'xhtml' // Podem conter scripts
]

// Tamanho máximo geral (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024

// ==========================================
// FUNÇÕES DE VALIDAÇÃO
// ==========================================

function getExtensao(filename: string): string {
  const partes = filename.split('.')
  if (partes.length < 2) return ''
  return partes[partes.length - 1].toLowerCase()
}

function validarArquivo(file: File): { valido: boolean; erro?: string } {
  // Verificar se o arquivo existe
  if (!file || !file.name) {
    return { valido: false, erro: 'Arquivo inválido' }
  }

  // Verificar extensão
  const extensao = getExtensao(file.name)
  
  if (!extensao) {
    return { valido: false, erro: 'Arquivo sem extensão' }
  }

  if (EXTENSOES_BLOQUEADAS.includes(extensao)) {
    return { valido: false, erro: `Tipo de arquivo não permitido: .${extensao}` }
  }

  // Verificar tamanho geral
  if (file.size > MAX_FILE_SIZE) {
    return { valido: false, erro: `Arquivo muito grande. Máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB` }
  }

  // Verificar tipo MIME
  const tipoConfig = TIPOS_PERMITIDOS.get(file.type)
  
  if (!tipoConfig) {
    return { valido: false, erro: `Tipo de arquivo não permitido: ${file.type}` }
  }

  // Verificar se extensão corresponde ao tipo MIME
  if (!tipoConfig.ext.includes(extensao)) {
    return { 
      valido: false, 
      erro: `Extensão .${extensao} não corresponde ao tipo ${file.type}` 
    }
  }

  // Verificar tamanho específico do tipo
  if (file.size > tipoConfig.maxSize) {
    return { 
      valido: false, 
      erro: `Arquivo muito grande para este tipo. Máximo: ${tipoConfig.maxSize / 1024 / 1024}MB` 
    }
  }

  return { valido: true }
}

// Verificar magic bytes (assinatura do arquivo)
async function verificarMagicBytes(buffer: ArrayBuffer, mimeType: string): Promise<boolean> {
  const bytes = new Uint8Array(buffer.slice(0, 12))
  
  // Assinaturas conhecidas
  const assinaturas: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
    'audio/mpeg': [[0xFF, 0xFB], [0xFF, 0xFA], [0xFF, 0xF3], [0x49, 0x44, 0x33]], // MP3 ou ID3
    'video/mp4': [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]], // ftyp
  }

  const assinaturasDoTipo = assinaturas[mimeType]
  
  if (!assinaturasDoTipo) {
    // Se não temos assinatura conhecida, permitir (mas já passou validação de MIME)
    return true
  }

  return assinaturasDoTipo.some(assinatura => 
    assinatura.every((byte, index) => bytes[index] === byte)
  )
}

// Sanitizar nome do arquivo
function sanitizarNomeArquivo(nome: string): string {
  // Remover caracteres perigosos
  return nome
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.') // Prevenir path traversal
    .substring(0, 100)
}

// ==========================================
// HANDLER HTTP
// ==========================================

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Obter arquivo do FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Arquivo é obrigatório' }, { status: 400 })
    }

    // Validar arquivo
    const validacao = validarArquivo(file)
    if (!validacao.valido) {
      return NextResponse.json({ error: validacao.erro }, { status: 400 })
    }

    // Converter para buffer e verificar magic bytes
    const arrayBuffer = await file.arrayBuffer()
    
    const magicBytesValido = await verificarMagicBytes(arrayBuffer, file.type)
    if (!magicBytesValido) {
      return NextResponse.json({ 
        error: 'Conteúdo do arquivo não corresponde ao tipo declarado' 
      }, { status: 400 })
    }

    // Gerar nome seguro
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 11)
    const extensao = getExtensao(file.name)
    const nomeSeguro = sanitizarNomeArquivo(file.name.replace(`.${extensao}`, ''))
    const fileName = `${timestamp}-${randomStr}-${nomeSeguro}.${extensao}`
    const filePath = `whatsapp-media/${user.id}/${fileName}`

    // Upload para Supabase Storage
    const buffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      })

    if (error) {
      console.error('Erro no upload:', error)
      return NextResponse.json({ 
        error: 'Erro ao fazer upload: ' + error.message 
      }, { status: 500 })
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath)

    // Log de auditoria (opcional)
    console.log(`Upload: ${file.name} (${file.type}, ${file.size} bytes) por ${user.email}`)

    return NextResponse.json({ 
      success: true, 
      url: urlData.publicUrl,
      fileName: sanitizarNomeArquivo(file.name),
      fileType: file.type,
      fileSize: file.size
    })

  } catch (error: any) {
    console.error('Erro no upload:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}

// Listar tipos permitidos (para informar o frontend)
export async function GET() {
  const tipos = Array.from(TIPOS_PERMITIDOS.entries()).map(([mime, config]) => ({
    mimeType: mime,
    extensoes: config.ext,
    maxSizeMB: config.maxSize / 1024 / 1024
  }))

  return NextResponse.json({
    tiposPermitidos: tipos,
    maxFileSizeMB: MAX_FILE_SIZE / 1024 / 1024,
    extensoesBloqueadas: EXTENSOES_BLOQUEADAS
  })
}
