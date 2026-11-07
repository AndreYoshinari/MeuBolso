# AGENTS.md — MeuBolso

Referência permanente do MeuBolso. Siga este arquivo em toda implementação.

O aplicativo é um controle financeiro pessoal para Android e iOS. Um usuário, um aparelho, uso offline. O razão é em reais. A cotação de moedas é informativa e não converte lançamentos.

O código do app fica nesta pasta. Nomes de código em inglês. Textos de interface em português.

Não antecipe contas múltiplas, transferência, login, nuvem, importação de extrato nem widget.

## Tecnologias

- React Native com Expo SDK 58. O entry point é o Expo Router, não `index.js` nem `App.tsx` do template CLI.
- TypeScript em `strict`. Sem `any`. Em fronteira externa use `unknown` e refine o tipo.
- Expo Router para navegação por arquivos. A rota compõe a tela e lê params. Não coloca SQL, conta nem validação.
- TanStack Query para lançamentos, categorias, orçamentos, séries e cotações. O SQLite é a fonte da verdade. Não persista o cache do Query em disco.
- Zustand só para preferências (tema, moeda de exibição, notificações). A tabela `settings` é a fonte da verdade. Hidrate a store depois das migrações e grave nela a cada alteração.
- React Hook Form e Zod nos formulários. O schema Zod é o contrato do formulário.
- Expo SQLite (`meubolso.db`) para dados do app. Migrações só para frente, com `PRAGMA user_version`.
- Expo SecureStore apenas para segredo, como um token opcional de API. Preferências não vão para o SecureStore.
- Jest com `jest-expo` e React Native Testing Library. Não dependa do SQLite nativo em teste unitário.
- Expo Notifications só para aviso local de orçamento. Permissão negada não desfaz lançamento.
- React Native Gifted Charts recebe a série pronta. A agregação fica no SQL ou em função pura.

Instale pacotes do Expo com `npx expo install`, alinhados ao SDK 58.

Chaves de query:

- `['transactions', filters]`
- `['transaction', id]`
- `['categories']`
- `['dashboard', yearMonth]`
- `['budgets', yearMonth]`
- `['charts', from, to]`
- `['rates']`

Depois de criar, editar ou apagar um lançamento, invalide `transactions`, `dashboard`, `budgets` e `charts`.

## Arquitetura

Organização por funcionalidade. Separe apresentação, domínio e infraestrutura quando isso deixar o código mais claro. Não crie use case, gateway nem repositório genérico.

```text
app/                       # rotas finas
  (tabs)/                  # início, lançamentos, orçamentos, gráficos, ajustes
  transactions/new.tsx
  transactions/[id].tsx
  categories/index.tsx
  rates.tsx
src/
  features/<nome>/         # components, hooks, schema, repository, types, mappers
  components/              # UI usada por mais de uma feature
  database/                # abrir, migrar, tipo mínimo do cliente
  services/                # integração externa
  stores/preferences.ts
  lib/                     # dinheiro, período, erros, funções puras
  providers/
  theme/
```

| Peça                       | Faz                                   | Não faz                     |
| -------------------------- | ------------------------------------- | --------------------------- |
| `app/`                     | Layout, params, composição            | Regra de negócio            |
| `features/*/components`    | UI da feature                         | Calcular saldo ou orçamento |
| `features/*/hooks.ts`      | Query, mutation, estado de tela       | JSX extenso                 |
| `features/*/schema.ts`     | Validar formulário                    | Acessar banco ou rede       |
| `features/*/repository.ts` | SQL daquele agregado                  | Formatar moeda ou navegar   |
| `src/services/`            | API externa, um módulo por integração | Regra de tela               |
| `src/lib/`                 | Cálculo puro e testável               | React                       |
| `src/components/`          | Componente reutilizado                | Regra de negócio            |
| `src/database/`            | Cliente, migração, tipos de linha     | Conhecer telas              |

Regras de desenho:

- Crie um hook quando a mesma leitura ou gravação for usada em mais de um lugar, ou quando a tela ficar só com composição.
- Serviço é integração externa. A cotação tem um serviço. Lançamento local não tem serviço HTTP.
- Repositório é acesso a dados: funções assíncronas por agregado, sem classe base.
- O cliente de banco expõe só `run`, `get` e `all`, para o teste usar um dublê.
- Componente de gráfico recebe a série pronta. Quem agrega é SQL ou função pura.
- Pasta nova só quando houver mais de um arquivo com o mesmo motivo.

Filtros do histórico ficam nos search params da rota: `type`, `categoryId`, `from`, `to`. Sem params, use o mês corrente e todos os tipos.

Modelo de dados:

- `categories`: `id`, `name`, `kind` (`income` ou `expense`), `color`, `icon`, `is_system`.
- `transactions`: `id`, `kind`, `amount_cents`, `category_id`, `occurred_on`, `note`.
- `budgets`: único por `(category_id, year_month)`, só categoria de despesa, `limit_cents`.
- `exchange_rates`: par `base` + `quote`, `rate` em texto decimal, `fetched_at`.
- `settings`: `key`, `value`.
- Ids com `crypto.randomUUID()`.
- Foreign key com `ON DELETE RESTRICT`. Categoria em uso não é apagada.
- Trigger garante que o `kind` do lançamento seja o mesmo da categoria.
- `amount_cents` inteiro e maior que zero. O `kind` indica receita ou despesa.
- `occurred_on` é `YYYY-MM-DD`, data civil, sem converter para UTC.
- `created_at` e `updated_at` em ISO UTC.
- Dinheiro do usuário nunca é `number` decimal nem `REAL`.
- Dashboard, orçamento e gráfico usam `SUM` e `GROUP BY` no SQL.

## Código

- Funções pequenas, com um motivo para mudar. Nome diz o que a função faz.
- Sem duplicar regra de dinheiro, período ou orçamento. Extraia para `src/lib/` no segundo uso.
- Prefira `type` para dados e props. Use `interface` quando o tipo for estendido.
- Exporte o tipo do retorno nos repositórios e nos hooks públicos.
- Componente de interface não decide saldo, limite, filtro nem payload de API.
- Evite componente grande. Extraia bloco visual com nome próprio ou hook da feature.
- Sem `catch` vazio. Sem `any` para calar o compilador.

Erros previstos: `ValidationError`, `DatabaseError`, `NotFoundError`, `NetworkError`. Traduza falha de constraint no cliente de banco. A tela mostra texto fixo em português, sem SQL e sem resposta crua.

| Origem            | Tratamento                                        |
| ----------------- | ------------------------------------------------- |
| Formulário        | Zod e React Hook Form, mensagem no campo          |
| Query             | Estado de erro com tentativa de novo              |
| Mutation          | Mensagem curta. O formulário permanece preenchido |
| Cotação           | Cache com data, ou erro se nunca houve sucesso    |
| Notificação       | Falha de permissão não desfaz o lançamento        |
| Render inesperado | Error Boundary na raiz                            |

```ts
// Evite
catch (e) {}

// Faça
catch (error) {
  throw new DatabaseError('Não foi possível salvar o lançamento.', { cause: error });
}
```

## React Native

- Componentes funcionais e hooks.
- Prefira componentes nativos do React Native. Não use `div`, `span` nem elemento web.
- Respeite safe area no layout raiz e em tela com ação fixa na borda.
- Layout deve caber em tela estreita e larga. Evite largura fixa que corte texto.
- Não filtre, ordene milhares de itens nem monte série de gráfico na thread de interface. Agregue no SQL ou em função pura antes do render.
- Lista do mês corrente na primeira versão. Não adicione paginação sem necessidade.
- Toda tela com dados remotos ou locais trata loading, erro e vazio.
- Toque tem área confortável. Texto de moeda não quebra o layout em valores longos.
- Não importe `react-native/Libraries`. No React Native 0.88 isso é erro de tipo.

## Segurança

- Nunca grave credencial, token ou chave no código-fonte. Use variável de ambiente ou SecureStore.
- Não use AsyncStorage para segredo.
- Não registre em log valor, saldo, nota, categoria ou resposta completa de cotação. Logue o tipo do erro e a operação.
- Valide com Zod todo dado de API antes de usar ou gravar.
- A cotação exibe `fetched_at`. Valor antigo não aparece como cotação ao vivo.
- `staleTime` da cotação: 6 horas. Sem rede, leia `exchange_rates`. Sem cache, mostre erro.

## Testes

Prioridade:

1. Funções puras: centavos, formato `pt-BR`, mês, progresso de orçamento, série e filtro.
2. Mappers e schemas Zod, inclusive a resposta da API.
3. Repositório com cliente falso (`run`, `get`, `all`).
4. Componente de formulário, linha, vazio, erro e progresso de orçamento, com `QueryClient` novo por teste.

Cada etapa leva os testes da regra que ela introduz. Não persiga cobertura percentual.

## Git

Commits no formato Conventional Commits, em português, com o motivo da mudança:

- `feat`: funcionalidade nova
- `fix`: correção
- `refactor`: mudança interna sem alterar comportamento
- `test`: teste
- `chore`: tarefa de projeto, dependência ou script
- `docs`: documentação
- `style`: formatação, sem mudança de comportamento

```text
feat(transactions): registra despesa em centavos

O razão precisa de valor inteiro para o saldo do mês não divergir.
```

Escopo opcional: `transactions`, `categories`, `budgets`, `charts`, `rates`, `settings`, `database`.

Não crie commit sem pedido explícito. Não altere `git config`. Não use `--no-verify`, `--amend` nem push forçado, salvo pedido explícito.
