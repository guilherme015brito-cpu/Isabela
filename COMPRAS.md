# Listas de compras

A aba **Compras** permite criar listas com nome próprio, como “Mercado da semana”, e incluir os produtos um por linha. Na criação, é possível colar vários itens, separados por quebras de linha. Dentro da lista, digite um produto e pressione Enter ou toque no botão de adicionar.

Cada item tem uma caixa de seleção. Ao marcar, o nome fica riscado. Uma lista com pelo menos um item fica finalizada automaticamente quando todos estão marcados; desmarcar ou adicionar um produto reabre a lista. Uma lista vazia permanece em andamento. Itens marcados continuam visíveis e podem ser editados ou excluídos. Excluir o último item deixa a lista vazia, em andamento.

Listas e itens têm ações de edição e exclusão. Exclusões pedem confirmação e excluir uma lista remove também seus itens. Os filtros Todas, Em andamento e Finalizadas ajudam a encontrar cada lista.

## Visual e acessibilidade

Usa as variáveis dos cinco temas existentes, os cartões, ícones, diálogos e a navegação do Isabela. Os sete destinos continuam acessíveis no celular; em telas muito estreitas, o menu aceita rolagem horizontal. Os campos possuem rótulos, os botões de ícone têm nomes acessíveis e os checkboxes nativos funcionam por toque e teclado (Espaço). O foco é mantido após marcar e adicionar itens.

Referências consultadas:

- [Google Keep — Criar uma lista](https://support.google.com/keep/answer/6395451?co=GENIE.Platform%3DDesktop&hl=pt-BR): título, itens individuais e caixas de seleção, com inclusão ao final.
- [Apple Lembretes — Listas de compras](https://support.apple.com/pt-br/105086): lista de compras com nome próprio e fluxo de adicionar itens. A categorização automática da Apple não faz parte desta implementação.
- [W3C — Checkbox Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/): estado marcado/desmarcado, rótulo acessível e interação por teclado.

## Persistência e Supabase

Os dados ficam em `db.settings.shopping = { lists: [{ id, name, items: [{ id, name, done }] }] }`. Nomes de listas têm até 100 caracteres e nomes de itens, até 200. A conclusão é calculada a partir dos itens, evitando um status separado que possa ficar desatualizado.

O campo `settings` já é persistido integralmente pelas funções autenticadas `isabela_load` e `isabela_sync` na tabela privada `isabela_settings`. **Não requer migração SQL**, nova tabela, alteração de RLS ou novas credenciais. Backups e sincronização incluem as compras automaticamente. Cópias antigas sem `shopping` continuam válidas; restaurar um backup mantém o comportamento existente de substituir os dados atuais, inclusive remover compras se elas não estiverem no backup.

A combinação entre aparelhos usa os IDs das listas e dos itens. Compras em itens diferentes e alterações de nome/checkbox independentes podem ser combinadas. Renomes divergentes ou exclusão versus edição do mesmo registro abrem a revisão existente em Configurações. Na primeira sincronização, a versão local dos IDs repetidos tem prioridade e os registros exclusivos da nuvem são preservados. Alterações durante o envio são reaplicadas e enviadas no ciclo seguinte.

Falha ao gravar no armazenamento local reverte a alteração em memória. O service worker inclui os dois novos arquivos e passa para `isabela-shell-v12`. Após publicar, feche todas as janelas do app e reabra com internet para ativar a nova versão do cache. Uma versão antiga ainda aberta não exibe a nova aba.

## Validação reproduzível

Sem dependências adicionais:

```sh
node --test tests/shopping.test.cjs tests/shopping.cloud.test.cjs
```

Para os testes de navegador e PostgreSQL local, instale dependências somente de desenvolvimento:

```sh
npm install --no-save --package-lock=false playwright @electric-sql/pglite
npx playwright install chromium
node tests/shopping.browser.cjs
node tests/shopping.database.cjs
```

O teste de navegador serve `dist` localmente e bloqueia chamadas externas; nenhum teste usa o Supabase publicado. `PLAYWRIGHT_CHANNEL=msedge` permite usar o Edge instalado. `SHOPPING_SCREENSHOTS` indica uma pasta opcional para capturas. Os módulos também podem ser indicados por `PLAYWRIGHT_MODULE` e `PGLITE_MODULE`.

Resultados: 20 testes de modelo/cliente de sincronização, 66 verificações de navegador e 7 verificações do SQL existente em PostgreSQL local (PGlite). Cobrem criação/edição/exclusão, conclusão e reabertura, restauração/exportação, persistência, falta de rede, conflitos, gravação durante envio, proteção por usuário, bloqueio de acesso anônimo e leitura direta, cinco temas e navegação em 320/390/768/1280 px. As abas existentes também foram abertas sem erros de JavaScript. O navegador usado foi o Edge; não substitui uma conferência no Safari/iPhone real.

## Publicação

Incorpore a alteração ao repositório conectado ao Vercel e publique `dist` pelo fluxo existente. Não execute novamente `supabase/integration.sql`: não há mudança de esquema nesta funcionalidade. O código foi validado localmente, sem gravar dados de teste em produção.
