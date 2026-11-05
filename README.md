# NOIR AI — site mobile + projeto Android

Este pacote inclui:
- Site responsivo para celular e computador.
- PWA instalável (quando hospedado em HTTPS).
- Cache da interface para abrir a estrutura do app mesmo sem conexão.
- Projeto configurado para gerar um app Android com Capacitor.
- Backend Node.js para conversar com a API OpenAI sem expor a chave no navegador.

## 1. Configurar a IA
Requer Node.js 18+.
1. Copie `.env.example` para `.env`.
2. Coloque sua chave em `OPENAI_API_KEY`.
3. Opcional: ajuste `OPENAI_MODEL`.
4. Rode `npm install` e `npm start`.
5. Abra `http://localhost:3000`.

A API precisa de internet. A interface pode abrir offline depois de carregada, mas o chat não responde sem conexão.

## 2. Instalar como app pelo navegador
Para instalar como PWA, publique o site em um endereço HTTPS.
No Android, abra esse endereço no Chrome e use o menu ⋮ > "Instalar app" ou "Adicionar à tela inicial" (o nome pode variar).

## 3. Gerar o APK Android
É necessário um computador com Node.js, Android Studio e Android SDK.
1. Na pasta do projeto: `npm install`
2. Gere a plataforma Android: `npx cap add android`
3. Sincronize: `npx cap sync android`
4. Abra: `npx cap open android`
5. No Android Studio, aguarde a sincronização do Gradle.
6. Use Build > Build Bundle(s) / APK(s) > Build APK(s).

O APK de depuração normalmente aparece em `android/app/build/outputs/apk/debug/app-debug.apk`.
Para distribuir publicamente, configure assinatura de release no Android Studio.

## 4. Publicação e segurança
Hospede o servidor Node.js em um serviço compatível e configure as variáveis `OPENAI_API_KEY`, `OPENAI_MODEL` e `PORT` no painel do serviço. Use HTTPS. O app Android deve apontar para o endereço HTTPS publicado se for distribuído fora do ambiente local; configure isso no Capacitor conforme o seu ambiente.

**Não coloque a chave de API no JavaScript do navegador nem no aplicativo.** Mantenha a chave somente no servidor. Adicione autenticação e limites de uso antes de disponibilizar publicamente, para evitar que outras pessoas consumam sua cota.

## Limitações atuais
- O histórico fica em memória no navegador e é perdido ao recarregar a página.
- O pacote contém o projeto-fonte Android preparado para gerar APK, não um APK já compilado.
- O NOIR é um assistente próprio conectado à API configurada; não é o Claude.
