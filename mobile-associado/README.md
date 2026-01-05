# Clube do Associado - App Mobile

App móvel para associados do clube. Disponível como PWA e apps nativos (iOS/Android).

## 🌐 PWA (Web)

Acesse: https://app.mindforge.dev.br

Para instalar no celular:
- **Android:** Chrome → Menu (⋮) → "Adicionar à tela inicial"
- **iOS:** Safari → Compartilhar → "Adicionar à Tela de Início"

---

## 📱 Apps Nativos (App Store / Play Store)

### Pré-requisitos

1. **Para iOS:** Mac com Xcode instalado
2. **Para Android:** Android Studio instalado
3. Node.js 18+

### Setup Inicial

```bash
cd mobile-associado
npm install

# Adicionar plataformas
npx cap add ios
npx cap add android
```

### Build para iOS (App Store)

```bash
# 1. Sincronizar código
npx cap sync ios

# 2. Abrir no Xcode
npx cap open ios

# 3. No Xcode:
#    - Selecione Team (Apple Developer Account)
#    - Configure Bundle Identifier: br.com.clube.associado
#    - Product → Archive
#    - Distribute App → App Store Connect
```

**Requisitos App Store:**
- Apple Developer Account ($99/ano)
- Ícones em todos os tamanhos (use https://appicon.co)
- Screenshots para iPhone e iPad
- Descrição, palavras-chave, categoria
- Política de privacidade URL

### Build para Android (Play Store)

```bash
# 1. Sincronizar código
npx cap sync android

# 2. Abrir no Android Studio
npx cap open android

# 3. No Android Studio:
#    - Build → Generate Signed Bundle / APK
#    - Escolha Android App Bundle (.aab)
#    - Crie ou use uma keystore existente
#    - Build
```

**Requisitos Play Store:**
- Google Play Developer Account ($25 único)
- Ícone 512x512
- Feature Graphic 1024x500
- Screenshots para celular e tablet
- Descrição curta e longa
- Política de privacidade URL
- Classificação de conteúdo

---

## 🎨 Assets Necessários

### Ícones

Crie os ícones em https://appicon.co com uma imagem 1024x1024:

```
ios/App/App/Assets.xcassets/AppIcon.appiconset/
android/app/src/main/res/mipmap-*/
```

### Splash Screen

```
ios/App/App/Assets.xcassets/Splash.imageset/
android/app/src/main/res/drawable/splash.png
```

---

## 🔧 Configuração do App

### capacitor.config.json

```json
{
  "appId": "br.com.clube.associado",
  "appName": "Clube do Associado",
  "webDir": "out",
  "server": {
    "url": "https://app.mindforge.dev.br"
  }
}
```

O app carrega o conteúdo diretamente do servidor web, garantindo que sempre tenha a versão mais atualizada.

---

## 📋 Checklist para Publicação

### App Store (iOS)
- [ ] Apple Developer Account ativa
- [ ] Certificados e Provisioning Profiles configurados
- [ ] Ícones em todos os tamanhos
- [ ] Screenshots iPhone (6.5", 5.5")
- [ ] Screenshots iPad (12.9")
- [ ] Descrição do app
- [ ] Palavras-chave
- [ ] URL de suporte
- [ ] URL política de privacidade
- [ ] Categoria: Estilo de Vida ou Utilitários
- [ ] Classificação etária

### Play Store (Android)
- [ ] Google Play Developer Account
- [ ] Keystore para assinatura
- [ ] Ícone 512x512 PNG
- [ ] Feature Graphic 1024x500
- [ ] Screenshots celular (mín. 2)
- [ ] Screenshots tablet 7" (mín. 1)
- [ ] Screenshots tablet 10" (mín. 1)
- [ ] Título (máx. 30 caracteres)
- [ ] Descrição curta (máx. 80 caracteres)
- [ ] Descrição completa (máx. 4000 caracteres)
- [ ] Política de privacidade URL
- [ ] Questionário de classificação de conteúdo
- [ ] Declaração de anúncios

---

## 🚀 Fluxo de Atualização

Como o app carrega do servidor web:

1. Faça alterações no código Next.js
2. Commit e push para GitHub
3. GitHub Actions faz build e deploy automático
4. Usuários recebem atualização automaticamente!

**Não precisa republicar nas lojas** para atualizações de conteúdo.

Só republique se mudar:
- Ícone do app
- Nome do app
- Permissões nativas
- Versão mínima do OS

---

## 📞 Suporte

Para dúvidas sobre publicação:
- [Apple App Store Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Policy Center](https://play.google.com/console/about/guides/)
