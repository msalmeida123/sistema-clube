/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Headers de segurança
  async headers() {
    return [
      {
        // Aplicar a todas as rotas
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            // Content Security Policy - ajuste conforme necessário
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js precisa
              "style-src 'self' 'unsafe-inline'", // Para CSS inline
              "img-src 'self' data: blob: https://*.supabase.co https://pps.whatsapp.net https://*.whatsapp.net",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.wasenderapi.com https://www.wasenderapi.com https://api.openai.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          }
        ],
      },
      {
        // Headers específicos para API
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ]
      }
    ]
  },

  // Configuração de imagens
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gkwwmigflhyntdwyqpip.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'pps.whatsapp.net',
      },
      {
        protocol: 'https',
        hostname: '*.whatsapp.net',
      },
    ],
  },

  // Desabilitar powered-by header
  poweredByHeader: false,

  // Configuração de redirecionamentos de segurança
  async redirects() {
    return [
      // Redirecionar HTTP para HTTPS em produção
      // (normalmente feito pelo Traefik, mas backup aqui)
    ]
  },

  // Variáveis de ambiente expostas ao cliente
  // NUNCA exponha chaves secretas aqui
  env: {
    // Apenas variáveis públicas
  },

  // Experimental features
  experimental: {
    // Habilitar melhorias de segurança
  },
}

module.exports = nextConfig
