# MeuBolso

MeuBolso é um controle financeiro pessoal para Android e iOS. Uma pessoa, um aparelho, offline.

## Objetivo

Registrar receita e despesa em centavos inteiros, ver o mês no início, definir um limite de gasto por categoria de despesa e ler alguns relatórios a partir do mesmo banco local. A cotação da Frankfurter pode ser consultada quando há rede. Ela não altera o razão.

O produto não tem contas, transferência, login, sincronização na nuvem, importação de extrato nem widget.

## Funcionalidades

O que o código atual faz:

- **Início.** Saudação pela hora, nome de exibição opcional, saldo total, receitas e despesas do mês civil selecionado, lançamentos recentes e gráficos alimentados por uma série já agregada no SQL.
- **Lançamentos.** Criar, editar, apagar e abrir um lançamento. Campos: descrição, valor, receita ou despesa, categoria, data civil e observação opcional. O valor é digitado em centavos e exibido em reais, no formato `pt-BR`. O histórico filtra por mês, tipo e categoria, e pesquisa a descrição.
- **Categorias.** Treze categorias padrão, além das personalizadas, com ícone e cor. Categoria padrão não é apagada. Categoria usada em lançamento ou orçamento não é apagada, e o tipo dela não muda enquanto estiver em uso. A lista mostra quantos lançamentos usam cada categoria.
- **Orçamentos.** Um limite mensal por categoria de despesa. O cartão mostra o limite, o valor usado, o que resta, uma barra de progresso e o percentual. Entra na conta só a despesa daquela categoria naquele mês civil. Aos 80% o estado é perto do limite. Aos 100% o limite foi atingido. Acima disso, foi ultrapassado.
- **Relatórios.** Um filtro atualiza todos os gráficos: mês atual, mês anterior, últimos 3 meses, últimos 6 meses, o ano civil corrente ou um período personalizado de no máximo 24 meses. O relatório tem receitas contra despesas, despesas por categoria, saldo acumulado, comparação com o mês anterior quando o intervalo é um único mês, e as cinco categorias que mais gastam. O que passa da quinta entra em “Outras”.
- **Ajustes.** Nome de exibição (até 40 caracteres), tema escuro ou claro, e o rótulo fixo Real (BRL). Dá para ligar notificação local, inclusive um lembrete mensal em um dia de 1 a 28. Limpar os dados locais pede confirmação, apaga lançamentos, orçamentos, cotações e categorias personalizadas, e restaura as preferências padrão. As categorias padrão permanecem.
- **Cotações.** Escolher duas moedas diferentes e ler uma taxa da Frankfurter, inclusive de uma data passada. A tela mostra a data da cotação e quando ela foi obtida.

## Tecnologias

| Peça               | Escolha                                                         |
| ------------------ | --------------------------------------------------------------- |
| App                | React Native 0.88 e Expo SDK 58                                 |
| Navegação          | Expo Router, por arquivos                                       |
| Linguagem          | TypeScript em modo `strict`                                     |
| Estado de servidor | TanStack Query, só em memória                                   |
| Preferências       | Zustand, hidratado a partir do SQLite                           |
| Formulários        | React Hook Form e Zod                                           |
| Banco              | Expo SQLite, arquivo `meubolso.db`                              |
| Gráficos           | React Native Gifted Charts, com a série pronta antes do desenho |
| Notificações       | Expo Notifications, só locais                                   |
| Testes             | Jest com `jest-expo` e React Native Testing Library             |
| Node.js            | 22.11 ou mais novo                                              |

## Arquitetura

As rotas em `app/` compõem a tela e leem os parâmetros. Elas não executam SQL nem validam formulário.

Cada funcionalidade em `src/features/` reúne componentes, hooks, schema Zod e apresentação. Regras e casos de uso ficam em `src/domain/`. O SQL fica em `src/database/`. Dinheiro, data civil e outros cálculos puros ficam em `src/lib/`.

O cliente de banco expõe `run`, `get`, `all` e `transaction`, para o teste usar um dublê. Repositório é função assíncrona, sem classe base. Depois de mudar um lançamento, o app invalida as queries de lançamento, início, orçamento e gráfico. Edição de categoria e de orçamento invalida as queries que os exibem.

Dinheiro é um inteiro em centavos. Percentual é um inteiro em pontos-base: 10000 é 100%. A data do lançamento é civil, `AAAA-MM-DD`. Ela não é convertida para UTC.

## Estrutura de pastas

```text
app/                  telas do Expo Router
  (tabs)/             início, lançamentos, orçamentos, relatórios
  transactions/       novo, detalhe, edição
  categories/         lista, nova, edição
  budgets/            novo, edição
  settings.tsx
  rates.tsx
src/
  features/           interface e hooks por funcionalidade
  components/         componentes usados em mais de uma tela
  database/           cliente, migrações, SQL
  domain/             tipos, regras, casos de uso
  services/           Frankfurter, notificações, preferências
  stores/             preferências e a sessão só em memória
  lib/                funções puras
  providers/
  theme/
docs/ci.md            o que o workflow do GitHub executa, e como o EAS entraria depois
```

## Modelo de dados

O SQLite usa tabelas `STRICT`. As migrações só avançam, com `PRAGMA user_version` (versões 1 a 5). Chave estrangeira usa `ON DELETE RESTRICT`.

| Tabela           | Papel                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `categories`     | `id`, `name`, `kind` (`income` ou `expense`), `color`, `icon`, `is_system`                                                                 |
| `transactions`   | `id`, `description`, `kind`, `amount_cents` (inteiro maior que zero), `category_id`, `occurred_on`, `note`, datas de criação e atualização |
| `budgets`        | Uma linha por categoria e `year_month`, `limit_cents`, só categoria de despesa                                                             |
| `exchange_rates` | `base`, `quote`, `rate` em texto decimal, `quoted_on`, `fetched_at`                                                                        |
| `preferences`    | Uma única linha, `id = 'local'`. A moeda fica restrita a `BRL`                                                                             |

O identificador vem de `crypto.randomUUID()`. Gatilhos mantêm o tipo do lançamento igual ao da categoria, impedem apagar categoria padrão e impedem mudar o tipo de uma categoria que ainda tem lançamento ou orçamento.

Categorias padrão:

- Receita: Salário, Investimentos, Freelance, Outros ganhos
- Despesa: Alimentação, Moradia, Transporte, Saúde, Educação, Lazer, Compras, Contas, Outros gastos

## Frankfurter

A cotação vem de `https://api.frankfurter.dev`, ou de `EXPO_PUBLIC_EXCHANGE_API_URL` quando essa variável está definida. A resposta entra como `unknown` e passa pelo Zod antes de ser gravada.

A consulta expira em 8 segundos. Uma cotação bem-sucedida fica em texto decimal, não em ponto flutuante. A query é considerada fresca por 6 horas. A tela sempre mostra a data a que a taxa se refere. Par da mesma moeda é recusado. Par ou data inexistente devolve uma mensagem fixa em português. O razão não é convertido.

## Funcionamento offline

O SQLite é a fonte da verdade. Início, histórico, filtros, categorias, orçamentos e relatórios não chamam a rede. O TanStack Query usa `networkMode: 'always'`, então essas leituras não pausam quando o aparelho está offline.

Se a consulta da cotação falha e existe uma taxa salva para o mesmo par e a mesma data pedida, o app mostra essa taxa. O título diz que não há conexão, e o texto diz que não é uma cotação ao vivo. Taxa de outro dia não é reaproveitada. Se não houver nada salvo, a tela diz que não há cotação neste aparelho. Um 404 continua como cotação indisponível. Ele não é rotulado como falta de rede.

Fechar e abrir o banco de novo mantém lançamentos e orçamentos. Uma gravação que falha não apaga as linhas já existentes. Não há sincronização com servidor, e o app não descreve dado local como sincronizado.

## Testes

Os testes usam Jest e React Native Testing Library. Os de persistência usam o SQLite embutido do Node (`node:sqlite`), com `--experimental-sqlite`. Eles não abrem o banco nativo do Expo.

A suíte tem hoje 149 casos `test()` em 49 arquivos. Eles cobrem cálculo em centavos, progresso de orçamento, validação de lançamento e categoria, casos de uso, o caminho de migração do SQLite, reabertura offline, modelos do início e dos relatórios, schemas de formulário, filtros e os estados de carregamento e erro das telas principais. A chamada à Frankfurter é simulada.

Na raiz do repositório:

```sh
npm test
```

Este README não registra percentual de cobertura. Rode o comando para ver o resultado atual.

`npm run typecheck` executa `tsc --noEmit`. `npm run lint` executa o ESLint do Expo, que inclui o Prettier. `npm run format:check` confere só a formatação.

No GitHub, `.github/workflows/ci.yml` instala dependências e roda typecheck, lint, formatação e testes em push para `main` e `develop`, e em pull request com uma dessas branches como destino.

## Como executar localmente

É preciso Node.js 22.11 ou mais novo, npm, e o conjunto nativo de Android ou iOS se a meta for um aparelho. O build de iOS precisa de um Mac.

```sh
npm ci
cp .env.example .env
npm start
```

Depois abra o projeto no Expo Go ou num development build. Na mesma pasta:

```sh
npm run android
npm run ios
```

`npm run ios` é para macOS.

## Configurações necessárias

Copie `.env.example` para `.env`. Os dois valores são públicos. Nenhum é segredo.

```text
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_EXCHANGE_API_URL=https://api.frankfurter.dev
```

Se `EXPO_PUBLIC_EXCHANGE_API_URL` estiver vazio, o cliente de cotação continua usando `https://api.frankfurter.dev`. Preferência não é segredo e fica no SQLite. O Expo SecureStore fica reservado para um segredo de verdade, como um token opcional de API. O app atual não guarda nenhum.

O workflow de CI define as mesmas duas variáveis públicas. Ele não lê um arquivo `.env` e não contém token.

## Como gerar builds

Um build de desenvolvimento, numa máquina que já tenha o SDK nativo:

```sh
npm run android
npm run ios
```

No Windows, `npm run android` pode falhar ao compilar `react-native-worklets` se o Git e o sistema ainda impuserem o limite de 260 caracteres no caminho. Ligar caminhos longos, ou compilar a partir de uma pasta mais curta, é ajuste da máquina. Isso não está configurado neste repositório.

Não há `eas.json` nem identificador de projeto na Expo. O workflow do GitHub não compila nem publica binário. Os passos para ligar o EAS depois, sem colocar token no YAML, estão em [`docs/ci.md`](docs/ci.md). O token de acesso da Expo, o keystore Android e o certificado Apple ficam fora do repositório.

## Limitações conhecidas

- O razão é só em reais. A cotação não converte um valor já gravado.
- O arquivo do banco não é cifrado. No Android, `allowBackup` está desligado. No iOS, o app marca a pasta `Documents/SQLite` e os arquivos do banco como excluídos do backup ao abrir e ao ir para segundo plano.
- As listas de lançamento, orçamento e categoria desenham o mês corrente num scroll. Elas não são virtualizadas.
- A tela de design system só entra no navegador em desenvolvimento. Num bundle de produção essa rota volta para o início.
- A versão do pacote npm em `package.json` é `0.0.1`. A versão mostrada em Ajustes vem de `app.config.ts` e é `1.0.0`.
- Não há captura de tela no repositório. Veja [Capturas de tela](#capturas-de-tela).
- A CI não gera binário nativo de release. Veja [Como gerar builds](#como-gerar-builds).

## Roadmap

Nada abaixo tem data. O escopo atual continua sendo uma pessoa, um aparelho e um razão offline.

Ainda não fazem parte deste app, e não foram começados: várias contas, transferência entre contas, login, backup na nuvem como funcionalidade, importação de extrato e widget na tela inicial.

Os buracos concretos já visíveis no repositório são: escolher uma licença, acrescentar capturas reais e ligar o EAS só depois que existirem a conta Expo e as credenciais das plataformas.

## Licença

Este repositório não inclui um arquivo de licença. Enquanto ele não existir, nenhuma licença de código aberto está concedida.
