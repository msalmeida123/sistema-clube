/**
 * Proteção contra uso do Console do Navegador
 * 
 * IMPORTANTE: Essas proteções NÃO são 100% efetivas.
 * Um atacante determinado pode desabilitar JavaScript ou usar ferramentas externas.
 * A proteção real deve estar no SERVIDOR (sanitização, validação, CSP).
 * 
 * Esta camada adicional serve para:
 * 1. Dificultar ataques casuais
 * 2. Detectar tentativas de manipulação
 * 3. Registrar comportamento suspeito
 */

// Flag para evitar múltiplas inicializações
let protectionInitialized = false

/**
 * Inicializa todas as proteções do cliente
 */
export function initClientProtection() {
  if (typeof window === 'undefined') return
  if (protectionInitialized) return
  
  protectionInitialized = true

  // 1. Bloquear atalhos de DevTools
  blockDevToolsShortcuts()
  
  // 2. Sobrescrever console (dificulta debug)
  disableConsole()
  
  // 3. Detectar manipulação do DOM
  protectDOM()
  
  // 4. Bloquear drag de scripts
  blockDragDrop()
  
  // 5. Detectar iframes maliciosos
  detectIframeEmbedding()
  
  // 6. Monitorar alterações suspeitas
  monitorSuspiciousActivity()
}

/**
 * Bloqueia atalhos comuns do DevTools
 */
function blockDevToolsShortcuts() {
  document.addEventListener('keydown', (e) => {
    // F12
    if (e.key === 'F12') {
      e.preventDefault()
      handleSecurityViolation('f12_blocked')
      return false
    }
    
    // Ctrl+Shift+I (DevTools)
    if (e.ctrlKey && e.shiftKey && e.key === 'I') {
      e.preventDefault()
      handleSecurityViolation('devtools_shortcut_blocked')
      return false
    }
    
    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && e.key === 'J') {
      e.preventDefault()
      handleSecurityViolation('console_shortcut_blocked')
      return false
    }
    
    // Ctrl+Shift+C (Inspect Element)
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault()
      handleSecurityViolation('inspect_shortcut_blocked')
      return false
    }
    
    // Ctrl+U (View Source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault()
      handleSecurityViolation('view_source_blocked')
      return false
    }
    
    // Ctrl+S (Save Page)
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault()
      return false
    }
    
    return true
  })
  
  // Bloquear menu de contexto (clique direito)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    return false
  })
}

/**
 * Desabilita/sobrescreve funções do console
 */
function disableConsole() {
  // Aviso antes de desabilitar
  try {
    console.log('%c⚠️ ATENÇÃO', 'color: red; font-size: 40px; font-weight: bold;')
    console.log('%cEste é um recurso do navegador destinado a desenvolvedores.', 'font-size: 16px;')
    console.log('%cSe alguém pediu para você colar algo aqui, isso é uma fraude.', 'font-size: 16px; color: red;')
    console.log('%cNão cole nenhum código aqui!', 'font-size: 20px; color: red; font-weight: bold;')
  } catch (_e) {
    // Ignora erros
  }
  
  const noop = () => { /* empty */ }
  
  // Sobrescrever métodos do console
  const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp']
  
  methods.forEach(method => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((console as any)[method]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (console as any)[method] = noop
      }
    } catch (_e) {
      // Ignora erros
    }
  })
  
  // Congelar o objeto console para impedir restauração
  try {
    Object.freeze(console)
  } catch (_e) {
    // Alguns navegadores não permitem
  }
}

/**
 * Protege elementos críticos do DOM contra manipulação
 */
function protectDOM() {
  // Observar mudanças no DOM
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Detectar scripts injetados
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'SCRIPT') {
          const script = node as HTMLScriptElement
          
          // Se o script não tem nonce válido ou src de domínio confiável
          if (!script.nonce && !isTrustedScriptSource(script.src)) {
            node.parentNode?.removeChild(node)
            handleSecurityViolation('script_injection_blocked', { src: script.src })
          }
        }
        
        // Detectar iframes injetados
        if (node.nodeName === 'IFRAME') {
          node.parentNode?.removeChild(node)
          handleSecurityViolation('iframe_injection_blocked')
        }
        
        // Detectar elementos com event handlers inline
        if (node instanceof HTMLElement) {
          const dangerousAttrs = ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur']
          dangerousAttrs.forEach(attr => {
            if (node.hasAttribute(attr)) {
              node.removeAttribute(attr)
              handleSecurityViolation('inline_handler_blocked', { attr })
            }
          })
        }
      })
    })
  })
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur', 'href', 'src']
  })
}

/**
 * Verifica se a fonte do script é confiável
 */
function isTrustedScriptSource(src: string): boolean {
  if (!src) return false
  
  const trustedDomains = [
    window.location.origin,
    'https://cdnjs.cloudflare.com',
    'https://unpkg.com'
  ]
  
  return trustedDomains.some(domain => src.startsWith(domain))
}

/**
 * Bloqueia drag & drop de arquivos/scripts
 */
function blockDragDrop() {
  document.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.stopPropagation()
  })
  
  document.addEventListener('drop', (e) => {
    e.preventDefault()
    e.stopPropagation()
    handleSecurityViolation('drag_drop_blocked')
  })
}

/**
 * Detecta se a página está sendo carregada em um iframe
 */
function detectIframeEmbedding() {
  try {
    if (window.self !== window.top) {
      // Página está em um iframe - possível clickjacking
      handleSecurityViolation('iframe_embedding_detected')
      
      // Tenta escapar do iframe
      if (window.top) {
        window.top.location = window.self.location
      }
    }
  } catch (_e) {
    // Se não conseguir acessar window.top, estamos em um iframe cross-origin
    handleSecurityViolation('cross_origin_iframe_detected')
    const warningDiv = document.createElement('div')
    warningDiv.style.cssText = 'padding:20px;text-align:center;'
    warningDiv.innerHTML = '<h1>Acesso não permitido</h1>'
    document.body.innerHTML = ''
    document.body.appendChild(warningDiv)
  }
}

/**
 * Monitora atividades suspeitas
 */
function monitorSuspiciousActivity() {
  // Detectar tentativas de copiar dados sensíveis
  document.addEventListener('copy', (e) => {
    const selection = window.getSelection()?.toString() || ''
    
    // Se tentar copiar algo que parece sensível
    if (selection.match(/Bearer|api[_-]?key|password|senha|token/i)) {
      e.preventDefault()
      handleSecurityViolation('sensitive_copy_blocked')
    }
  })
  
  // Detectar paste de scripts
  document.addEventListener('paste', (e) => {
    const pastedText = e.clipboardData?.getData('text') || ''
    
    // Detectar código JavaScript colado
    if (pastedText.match(/<script|javascript:|eval\(|Function\(|document\.|window\./i)) {
      e.preventDefault()
      handleSecurityViolation('script_paste_blocked', { content: pastedText.substring(0, 100) })
    }
  })
  
  // Bloquear eval
  try {
    Object.defineProperty(window, 'eval', {
      value: function() {
        handleSecurityViolation('eval_blocked')
        throw new Error('eval() is disabled for security reasons')
      },
      configurable: false,
      writable: false
    })
  } catch (_e) {
    // Ignora se não conseguir
  }
}

/**
 * Registra e trata violações de segurança
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleSecurityViolation(type: string, details?: any) {
  // Log no servidor (pode enviar para API de monitoramento)
  const violation = {
    type,
    details,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  }
  
  // Tentar enviar para o servidor (silenciosamente)
  try {
    fetch('/api/security-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(violation),
      keepalive: true
    }).catch(() => { /* silent */ })
  } catch (_e) {
    // Ignora erros de rede
  }
}

/**
 * Mostra aviso de segurança (opcional)
 */
export function showSecurityWarning() {
  const warning = document.createElement('div')
  warning.id = 'security-warning'
  
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    color: white;
    font-family: system-ui, sans-serif;
  `
  
  const title = document.createElement('h1')
  title.style.cssText = 'color: #ef4444; font-size: 2rem;'
  title.textContent = '⚠️ Atenção'
  
  const message = document.createElement('p')
  message.style.cssText = 'font-size: 1.2rem; max-width: 500px; text-align: center;'
  message.innerHTML = 'Ferramentas de desenvolvedor detectadas.<br>Se você não é um desenvolvedor autorizado,<br>feche esta janela imediatamente.'
  
  const button = document.createElement('button')
  button.style.cssText = `
    margin-top: 20px;
    padding: 10px 30px;
    background: #3b82f6;
    border: none;
    border-radius: 5px;
    color: white;
    cursor: pointer;
    font-size: 1rem;
  `
  button.textContent = 'Entendi'
  button.addEventListener('click', () => {
    warning.remove()
  })
  
  overlay.appendChild(title)
  overlay.appendChild(message)
  overlay.appendChild(button)
  warning.appendChild(overlay)
  document.body.appendChild(warning)
}
