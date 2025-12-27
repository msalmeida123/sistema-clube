-- Inserir usuário admin na tabela usuarios
INSERT INTO usuarios (id, nome, email, setor, ativo)
SELECT 
    id,
    'Administrador',
    'the.marcelo.ms@gmail.com',
    'admin',
    true
FROM auth.users 
WHERE email = 'the.marcelo.ms@gmail.com';
