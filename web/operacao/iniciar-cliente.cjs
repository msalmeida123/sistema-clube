// Inicialização das instalações licenciadas. Lê Docker Secret sem registrar a chave.
const fs = require('node:fs')
try {
  const c = JSON.parse(fs.readFileSync(process.env.LICENCA_CONFIG_FILE || '/run/secrets/licenca_cliente', 'utf8'))
  const url = new URL(c.central)
  if (url.protocol !== 'https:' || url.username || url.password ||
      !/^CLUBE_[A-Za-z0-9_-]{43}$/.test(c.chave || '') ||
      !/^[0-9a-f-]{36}$/i.test(c.instalacao || '') ||
      !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(c.dominio || '') ||
      !['sandbox','production'].includes(c.ambiente)) throw Error()
  Object.assign(process.env, {
    LICENCA_EXIGIR: '1', GESTAO_LICENCAS_ATIVA: '0',
    LICENCA_CENTRAL_URL: url.origin, LICENCA_CHAVE: c.chave,
    LICENCA_INSTALACAO: c.instalacao, LICENCA_DOMINIO: c.dominio,
    LICENCA_AMBIENTE: c.ambiente,
  })
  require('../server.js')
} catch {
  console.error('Não foi possível iniciar: confira o segredo de licença da instalação.')
  process.exit(1)
}
