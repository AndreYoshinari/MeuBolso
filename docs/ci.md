# Integração contínua

O workflow `.github/workflows/ci.yml`, na raiz do repositório, roda em push para `main` e `develop` e em pull request com uma dessas branches como destino.

Cada execução, na raiz do repositório:

1. Instala com `npm ci`, usando o `package-lock.json`.
2. Verifica TypeScript (`npm run typecheck`).
3. Roda o ESLint (`npm run lint`).
4. Confere a formatação (`npm run format:check`).
5. Roda os testes (`npm test`).

Node.js 22, a linha exigida em `package.json`. O cache de dependências usa o lockfile. As variáveis `EXPO_PUBLIC_APP_ENV` e `EXPO_PUBLIC_EXCHANGE_API_URL` estão no workflow com os mesmos valores públicos de `.env.example`. Não são segredo. O arquivo `.env` continua fora do Git.

Se a instalação falha, as outras etapas nem começam. Se a instalação passa, tipo, lint, formatação e testes rodam mesmo quando uma delas falha, para o pull request mostrar todos os problemas de uma vez. O job fica vermelho se qualquer etapa falha.

Não há compilação nativa nem publicação nesta pipeline.

## Build com EAS

O projeto ainda não tem `eas.json` nem `extra.eas.projectId`. A pipeline não chama `eas build`. Esse comando precisa de conta Expo e de credenciais que não ficam no YAML.

Para ligar um build depois, fora deste workflow:

1. Entre na [conta Expo](https://expo.dev) do projeto. O nome da conta e o identificador do projeto vêm de lá; não invente esses valores.
2. Na raiz do repositório, rode `npx eas-cli login` e `npx eas-cli init`. O `init` grava o `projectId` real em `app.config.ts`.
3. Rode `npx eas-cli build:configure` para criar o `eas.json` com os perfis que o Expo oferecer.
4. No GitHub, em Settings → Secrets and variables → Actions, crie um secret com o token gerado em [expo.dev/accounts](https://expo.dev/settings/access-tokens). O nome usual do secret é `EXPO_TOKEN`. O valor não entra no repositório nem no YAML.
5. Um job futuro de build usa esse secret só como variável de ambiente, por exemplo `EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}`, e chama `npx eas-cli build --platform android --profile production --non-interactive`. Sem o secret configurado no GitHub, o job deve falhar em vez de publicar.
6. Keystore Android e certificado iOS ficam na Expo ou no cofre do time. Não commite `.jks`, `.p8`, `.p12` nem senha. O `eas credentials` pergunta esses dados na hora de configurar; a resposta não vai para o workflow.

iOS na Expo exige a conta Apple Developer do time. Android pode usar o keystore gerenciado pela Expo. Os dois dependem dessa configuração externa.
