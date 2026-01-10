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

  // 1. Detectar DevTools aberto
  detectDevTools()
  
  // 2. Bloquear atalhos de DevTools
  blockDevToolsShortcuts()
  
  // 3. Sobrescrever console (dificulta debug)
  disableConsole()
  
  // 4. Detectar manipulação do DOM
  protectDOM()
  
  // 5. Bloquear drag de scripts
  blockDragDrop()
  
  // 6. Detectar iframes maliciosos
  detectIframeEmbedding()
  
  // 7. Monitorar alterações suspeitas
  monitorSuspiciousActivity()
}

/**
 * Detecta se o DevTools está aberto
 */
function detectDevTools() {
  const threshold = 160
  
  const checkDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > threshold
    const heightThreshold = window.outerHeight - window.innerHeight > threshold
    
    if (widthThreshold || heightThreshold) {
      handleSecurityViolation('devtools_open')
    }
  }
  
  // Verifica periodicamente
  setInterval(checkDevTools, 1000)
  
  // Método alternativo usando debugger
  const detectDebugger = () => {
    const start = performance.now()
    // debugger é pausado quando DevTools está aberto
    // eslint-disable-next-line no-debugger
    debugger
    const end = performance.now()
    
    // Se demorou mais de 100ms, provavelmente DevTools está aberto
    if (end - start > 100) {
      handleSecurityViolation('debugger_detected')
    }
  }
  
  // Verifica a cada 5 segundos (não muito frequente para não impactar performance)
  setInterval(detectDebugger, 5000)
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
  const noop = () => {}
  
  // Aviso antes de desabilitar
  console.log('%c⚠️ ATENÇÃO', 'color: red; font-size: 40px; font-weight: bold;')
  console.log('%cEste é um recurso do navegador destinado a desenvolvedores.', 'font-size: 16px;')
  console.log('%cSe alguém pediu para você colar algo aqui, isso é uma fraude.', 'font-size: 16px; color: red;')
  console.log('%cNão cole nenhum código aqui!', 'font-size: 20px; color: red; font-weight: bold;')
  
  // Sobrescrever métodos do console
  const methods = ['log', 'debug', 'info', 'warn', 'error', 'table', 'trace', 'dir', 'dirxml', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp', 'memory']
  
  methods.forEach(method => {
    if ((console as any)[method]) {
      (console as any)[method] = noop
    }
  })
  
  // Congelar o objeto console para impedir restauração
  try {
    Object.freeze(console)
  } catch (e) {
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
    'https://unpkg.com',
    'https://_next' // Next.js
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
  if (window.self !== window.top) {
    // Página está em um iframe - possível clickjacking
    handleSecurityViolation('iframe_embedding_detected')
    
    // Tenta escapar do iframe
    try {
      window.top!.location = window.self.location
    } catch (e) {
      // Se não conseguir, esconde o conteúdo
      document.body.innerHTML = '<h1>Acesso não permitido</h1>'
    }
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
  
  // Bloquear eval e Function constructor
  const originalEval = window.eval
  ;(window as any).eval = function() {
    handleSecurityViolation('eval_blocked')
    throw new Error('eval() is disabled for security reasons')
  }
  
  // Tentar preservar a referência original bloqueada
  try {
    Object.defineProperty(window, 'eval', {
      configurable: false,
      writable: false
    })
  } catch (e) {}
}

/**
 * Registra e trata violações de segurança
 */
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
    }).catch(() => {})
  } catch (e) {}
  
  // Ações baseadas no tipo de violação
  switch (type) {
    case 'devtools_open':
    case 'debugger_detected':
      // Pode redirecionar ou mostrar aviso
      // showSecurityWarning()
      break
      
    case 'script_injection_blocked':
    case 'eval_blocked':
      // Violação grave - pode fazer logout
      // window.location.href = '/login?security=violation'
      break
  }
}

/**
 * Mostra aviso de segurança (opcional)
 */
export function showSecurityWarning() {
  const warning = document.createElement('div')
  warning.id = 'security-warning'
  warning.innerHTML = `
    <div style="
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
    ">
      <h1 style="color: #ef4444; font-size: 2rem;">⚠️ Atenção</h1>
      <p style="font-size: 1.2rem; max-width: 500px; text-align: center;">
        Ferramentas de desenvolvedor detectadas.<br>
        Se você não é um desenvolvedor autorizado,<br>
        feche esta janela imediatamente.
      </p>
      <button onclick="document.getElementById('security-warning').remove()" style="
        margin-top: 20px;
        padding: 10px 30px;
        background: #3b82f6;
        border: none;
        border-radius: 5px;
        color: white;
        cursor: pointer;
        font-size: 1rem;
      ">Entendi</button>
    </div>
  `
  document.body.appendChild(warning)
}
