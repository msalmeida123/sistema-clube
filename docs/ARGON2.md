# Senhas do aplicativo do associado

Novas senhas definitivas e temporárias usam Argon2id (64 MiB, 3 iterações, paralelismo 1), com salt aleatório e formato PHC. A senha original não é armazenada.

Os hashes scrypt existentes continuam verificáveis. Após autenticação bem-sucedida, o hash usado é convertido para Argon2id. A atualização exige que o hash anterior permaneça igual no banco; uma troca concorrente impede a criação da sessão com a credencial antiga. Senhas temporárias mantêm sua expiração e a exigência de troca.

O banco usa campos text, sem alteração de esquema. Não há conversão em massa: ela exige a senha fornecida no próximo login. O limite de tentativas continua centralizado no Redis.

O login administrativo permanece sob responsabilidade do Supabase Auth, sem alteração de seus hashes ou fluxo de recuperação.

Validação: testes de Argon2id, salt independente, compatibilidade scrypt, entradas inválidas, migração com comparação do hash anterior e limites Redis. O módulo nativo deve ser verificado também na imagem Docker Alpine antes de publicar.
