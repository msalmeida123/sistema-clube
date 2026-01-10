import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { QueryProvider } from '@/components/providers/query-provider'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Clube',
  description: 'Sistema de gestão completo para clubes',
}

// Script de proteção que executa imediatamente
const securityScript = `
(function() {
  // Bloquear F12 e atalhos de DevTools
  document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }, true);
  
  // Bloquear clique direito
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  }, true);
  
  // Aviso no console
  console.log('%c⚠️ ATENÇÃO', 'color: red; font-size: 40px; font-weight: bold;');
  console.log('%cEste é um recurso do navegador destinado a desenvolvedores.', 'font-size: 16px;');
  console.log('%cSe alguém pediu para você colar algo aqui, isso é uma fraude.', 'font-size: 16px; color: red;');
  console.log('%cNão cole nenhum código aqui!', 'font-size: 20px; color: red; font-weight: bold;');
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <Script
          id="security-protection"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: securityScript }}
        />
      </head>
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
