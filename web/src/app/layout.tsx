/** Layout raiz: providers globais, metadados e estilos compartilhados. */
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import {TemaProvider} from '@/components/providers/tema-provider'
import { QueryProvider } from '@/components/providers/query-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Clube',
  description: 'Sistema de gestão completo para clubes',
  manifest: '/api/tema/manifest',
  icons: {icon: [{url:'/api/tema/icone?size=32',sizes:'32x32',type:'image/png'}],apple: [{url:'/api/tema/icone?size=180',sizes:'180x180',type:'image/png'}]},
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryProvider>
          <TemaProvider>{children}</TemaProvider>
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
