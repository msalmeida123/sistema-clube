# Guia de Publicação nas Lojas

## 📱 Ícones e Assets

Os arquivos SVG estão na pasta `assets/`:
- `icon.svg` - Ícone do app (1024x1024)
- `splash.svg` - Tela de splash (2732x2732)
- `feature-graphic.svg` - Banner Play Store (1024x500)

### Converter SVG para PNG

Use um desses serviços online:
1. **https://cloudconvert.com/svg-to-png** - Converta o icon.svg para 1024x1024 PNG
2. **https://appicon.co** - Upload do PNG e gera todos os tamanhos automaticamente

### Tamanhos necessários:

**iOS (App Store):**
- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 76x76 (iPad @1x)

**Android (Play Store):**
- 512x512 (Play Store)
- 192x192 (xxxhdpi)
- 144x144 (xxhdpi)
- 96x96 (xhdpi)
- 72x72 (hdpi)
- 48x48 (mdpi)

---

## 🍎 Publicação na App Store (iOS)

### 1. Requisitos
- Mac com macOS
- Xcode instalado
- Apple Developer Account ($99/ano): https://developer.apple.com

### 2. Criar conta de desenvolvedor
1. Acesse https://developer.apple.com/programs/enroll/
2. Faça login com seu Apple ID
3. Pague a taxa anual de $99
4. Aguarde aprovação (24-48h)

### 3. Preparar o projeto
```bash
cd mobile-associado
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

### 4. Configurar no Xcode
1. Selecione o projeto no navegador
2. Em "Signing & Capabilities":
   - Team: Selecione sua conta
   - Bundle Identifier: `br.com.clube.associado`
3. Em "General":
   - Version: 1.0.0
   - Build: 1

### 5. Adicionar ícones
1. No Xcode, abra `Assets.xcassets`
2. Clique em `AppIcon`
3. Arraste os ícones nos tamanhos corretos

### 6. Build e envio
1. Product → Archive
2. Distribute App → App Store Connect
3. Upload

### 7. App Store Connect
1. Acesse https://appstoreconnect.apple.com
2. Meus Apps → + → Novo App
3. Preencha:
   - Nome: Clube do Associado
   - Idioma: Português (Brasil)
   - Bundle ID: br.com.clube.associado
   - SKU: clube-associado-001
4. Adicione screenshots
5. Preencha descrição
6. URL de privacidade: https://app.mindforge.dev.br/politica-privacidade.html
7. Enviar para revisão

---

## 🤖 Publicação na Play Store (Android)

### 1. Requisitos
- Android Studio instalado
- Google Play Developer Account ($25 único): https://play.google.com/console

### 2. Criar conta de desenvolvedor
1. Acesse https://play.google.com/console/signup
2. Pague a taxa única de $25
3. Complete o perfil

### 3. Preparar o projeto
```bash
cd mobile-associado
npm install
npx cap add android
npx cap sync android
npx cap open android
```

### 4. Criar Keystore (primeira vez)
```bash
keytool -genkey -v -keystore clube-release.keystore -alias clube -keyalg RSA -keysize 2048 -validity 10000
```
⚠️ **GUARDE a keystore e senha em local seguro! Você precisará dela para todas as atualizações futuras.**

### 5. Configurar assinatura
No Android Studio, edite `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('clube-release.keystore')
            storePassword 'SUA_SENHA'
            keyAlias 'clube'
            keyPassword 'SUA_SENHA'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### 6. Gerar AAB (Android App Bundle)
1. Build → Generate Signed Bundle / APK
2. Selecione Android App Bundle
3. Escolha a keystore
4. Build

### 7. Google Play Console
1. Acesse https://play.google.com/console
2. Criar app
3. Preencha:
   - Nome: Clube do Associado
   - Idioma: Português (Brasil)
   - App ou jogo: App
   - Gratuito ou pago: Gratuito
4. Configure:
   - Ficha da loja (descrição, screenshots)
   - Classificação de conteúdo
   - Público-alvo
   - Política de privacidade: https://app.mindforge.dev.br/politica-privacidade.html
5. Upload do AAB
6. Publicar

---

## 📝 Textos para as Lojas

### Título
```
Clube do Associado
```

### Subtítulo (iOS) / Descrição curta (Android)
```
Seu acesso digital ao clube
```

### Descrição
```
O Clube do Associado é o aplicativo oficial para membros do clube. 

📱 ACESSO RÁPIDO
Use seu QR Code digital para entrar no clube sem precisar de carteirinha física. Basta abrir o app e mostrar na portaria.

💰 MENSALIDADES
Acompanhe suas mensalidades, veja os pagamentos realizados e pendentes, tudo em um só lugar.

👤 SEU PERFIL
Acesse suas informações pessoais, dados de contato e informações do seu plano.

🔐 SEGURO
Login com CPF e senha, seus dados protegidos com a mais alta segurança.

Funcionalidades:
• QR Code de acesso digital
• Visualização de mensalidades
• Perfil do associado
• Recuperação de senha por email

Baixe agora e tenha o clube na palma da sua mão!
```

### Palavras-chave (iOS)
```
clube,associado,qrcode,acesso,mensalidade,membro,sócio,carteirinha
```

### Categoria
- iOS: Estilo de Vida ou Utilitários
- Android: Estilo de vida

---

## 📸 Screenshots

Você precisará de screenshots do app em uso. Tire prints das telas:
1. Tela de login
2. QR Code
3. Mensalidades
4. Perfil

**Tamanhos necessários:**

**iOS:**
- iPhone 6.5" (1284 x 2778) - iPhone 14 Pro Max
- iPhone 5.5" (1242 x 2208) - iPhone 8 Plus

**Android:**
- Celular (1080 x 1920 ou similar)
- Tablet 7" (opcional)
- Tablet 10" (opcional)

---

## ✅ Checklist Final

### App Store
- [ ] Apple Developer Account ativa
- [ ] Ícones todos os tamanhos
- [ ] Screenshots iPhone
- [ ] Descrição preenchida
- [ ] Política de privacidade URL
- [ ] Classificação etária respondida
- [ ] App enviado para revisão

### Play Store
- [ ] Google Play Developer Account
- [ ] Keystore criada e guardada
- [ ] Ícone 512x512
- [ ] Feature Graphic 1024x500
- [ ] Screenshots celular
- [ ] Descrição preenchida
- [ ] Política de privacidade URL
- [ ] Classificação de conteúdo respondida
- [ ] AAB uploaded
- [ ] App publicado

---

## ❓ Dúvidas Frequentes

**P: Quanto tempo demora a aprovação?**
- App Store: 24-48 horas (pode demorar mais na primeira vez)
- Play Store: Algumas horas a 7 dias

**P: Preciso atualizar o app nas lojas quando mudar algo?**
- Não! O app carrega do servidor, então mudanças são automáticas.
- Só precisa atualizar se mudar ícone, nome ou permissões.

**P: Posso usar o mesmo app para vários clubes?**
- Este app é específico para um clube. Para múltiplos clubes, seria necessário criar apps separados ou um sistema multi-tenant.
