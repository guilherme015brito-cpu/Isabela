# Verificação da versão atualizada

Data: 05/10/2026.

## Correções solicitadas

- Ícones agora são escolhidos em uma grade, sem campo de texto. O mesmo seletor é usado em tarefas, categorias, bancos e planos.
- Cores possuem uma paleta pronta e uma seção de anel cromático com controles de matiz, saturação e luminosidade.
- Detalhes da tarefa têm lixeira com confirmação dentro do app e lápis para editar todos os campos.
- A data do calendário usa um quadrado arredondado, separado do nome do dia.
- O botão de conclusão possui fundo contrastante e borda mais definida.
- Entrada/saída recebem categoria. É possível criar a categoria no cadastro, editá-la nas configurações e filtrar o caixa por categoria, banco e tipo.

## Testes automatizados de comportamento

21 grupos passaram, executando os formulários e eventos sobre um DOM isolado, sem alterar os dados da usuária:

- Bancos: criação, ícone selecionável e saldo inicial
- PLAN: criação e meta
- Entrada, categoria criada no cadastro e progresso do plano
- Saída e categoria predefinida
- Edição de transação recalcula saldos; filtros por categoria e tipo
- Exclusão de transação recalcula saldos
- Edição de banco e proteção de banco com transações
- Meta editável e porcentagem atualizada
- Tarefa: seleção de ícone e cor, categoria no cadastro, descrição e intervalo
- Detalhes: lápis, edição de data/categoria, seletor sincronizado e validação de datas
- Conclusão/reabertura, filtros de tarefas e busca
- Lixeira: confirmação própria do app, cancelamento e exclusão
- Importação: cinco tarefas, prevenção de duplicação e conclusão em todos os dias da semana
- Calendário: cinco períodos, passagem de ano e blocos de data arredondados
- Calendário: limite de etiquetas e indicador de tarefas extras
- Cinco temas, quatro posições, três estilos e recolhimento automático/manual
- Categorias de tarefas e financeiras editáveis nas configurações
- Persistência, restauração válida e rejeição de cópia inválida
- Exportação de cópia JSON
- Gesto lateral avança uma semana sem interferir na rolagem vertical
- Anel cromático: controle de matiz produz e atualiza a cor selecionada

## Teste real da foto fornecida

O leitor Tesseract.js 5.1.1, em português, processou o arquivo anexado. O teste usa o mesmo código de identificação da grade, correção de perspectiva e leitura das células que o app usa. A conversão dos pixels em imagem PNG foi feita por Sharp no teste; no app, essa conversão usa canvas.

Resultado reconhecido automaticamente, sem carregar a transcrição predefinida:

- 1ª semana: Cozinha
- 2ª semana: Banheiro
- 3ª semana: Cozinha
- 4ª semana: Banheiro; Lavanderia e garagem

As cinco atribuições e os quatro cabeçalhos foram reconhecidos. O problema anterior vinha do tratamento da grade e da leitura conjunta de texto com bordas, não de uma imagem ilegível. A nova versão identifica a grade, corrige a perspectiva, separa as células e preserva a revisão antes de importar. Outras fotos podem ter leitura parcial e continuam exigindo revisão.

## Conferência no navegador

No Edge, foram conferidos cadastro de tarefa, escolha de ícone, paleta e anel cromático, salvamento, detalhes, cancelamento da exclusão, calendário com a escala e layout mobile. O layout de teste mobile não apresentou rolagem horizontal: largura do conteúdo e do viewport de 375 px, em uma emulação solicitada de 390×844.

A tentativa de selecionar o arquivo da foto pela extensão do navegador foi bloqueada pela permissão de acesso a arquivos da extensão. Essa etapa de seleção/upload não foi validada automaticamente no navegador; o processamento da foto foi validado no teste real descrito acima. Não foram alteradas permissões da extensão.

Os testes simulam o gesto de swipe; não foi testado em um celular físico. A revisão visual está em preview-controles.jpg e preview-mobile.jpg.

## Dados e acesso

O app continua usando armazenamento local. Está publicado no Vercel em https://isabela-meu-espaco.vercel.app/. O projeto Supabase tem uma tabela exclusiva para o ping diário; a sincronização das tarefas e finanças ainda não foi implementada.

Logo/PWA: tamanhos dos três ícones do manifest conferidos, scripts de instalação e service worker validados; os 21 grupos de testes continuam passando. Instalação real e push no iPhone ainda não testados. Consulte INSTALAR-NO-IPHONE.md.

Importação: reproduzido aviso de escala duplicada atrás do dialog. Avisos agora ficam na camada do modal; resultado sem tarefas novas tem botões clicáveis Revisar escala/Ver calendário. Fluxo confirmado no Edge e regressão verificada nos 21 grupos de testes.

Importação corrigida: avisos dentro do dialog, confirmação acessível para escala duplicada e botão Ver calendário validado no Edge. Os 21 grupos de testes passaram, incluindo a posição do aviso e fechamento do modal.

Preferências de notificações: 22 grupos passaram. Verificados salvamento local, recarregamento, categorias/dias, horários duplicados, faixa de repetição inválida e desativação preservando as escolhas. Formulário e confirmação de salvamento também verificados no Edge.

Calendário mobile: 13 verificações específicas passaram, além dos 22 grupos gerais e teste de instalação. Corrigidas as trocas Mês→Semana/15dias para preservar o dia escolhido. Espaçamento atualizado conforme a imagem do iPhone: semanas com altura fixa, divisórias discretas, até duas etiquetas e contador de excedentes. Manifest, ícone Apple e HTML publicados verificados por HTTP200. A instalação real no iPhone depende do aparelho.

Vercel: versão nova confirmada em produção; teste de navegador390×844 sem rolagemhorizontal(clientWidth375=scrollWidth375), semanas110px, toque→lista do dia, criação na dataescolhida, detalhes e conclusão removendo etiqueta. Ajuda Isabela na Tela de Início visível nas Configurações.

## Filtros mobile e ping diário

Passaram oito verificações específicas dos filtros: abrir/recolher, estado preservado, busca combinada com categoria/cor/status/datas, intervalo de tarefas, limpeza dos filtros, criação e importação acessíveis. Também passaram os 22 grupos gerais, 13 de calendário mobile e a verificação de instalação do iPhone.

A tabela `public.app_healthcheck` foi criada no projeto Supabase informado. A consulta REST retornou HTTP 200 e a linha `id=1`. Conferidos no banco: RLS ativo, `anon` com SELECT e sem INSERT, UPDATE ou DELETE. A URL foi configurada como variável e a chave publishable como secret no repositório GitHub.

Workflow ativo e primeira execução manual concluída com sucesso: [run 37376986565](https://github.com/guilherme015brito-cpu/Isabela/actions/runs/37376986565). As três consultas foram confirmadas no runner do GitHub. Programado diariamente às 09:17 no fuso America/Sao_Paulo. A sincronização dos dados do app ainda não faz parte desta configuração.

Layout publicado conferido no Edge: painel aberto em viewports de 390×844 e 320×844, sem rolagem horizontal (375=375 e 305=305 px de largura efetiva). Campos com fonte 16px e altura 46px. Categoria, status e datas combinados mantiveram o painel aberto e retornaram a tarefa de teste correta; limpar voltou ao padrão. Desktop sem rolagem horizontal (1358=1358 px), com busca e seletores na primeira linha e datas/importação na segunda. Não houve teste em iPhone físico. Captura: `filtros-tarefas-mobile.jpg`.


## Preparação da sincronização

- 12 testes do cliente: migração com backup, segundo aparelho, concorrência, conflitos, indisponibilidade e alterações durante envio. SDK de autenticação simulado; nenhum e-mail real enviado.
- 10 testes no PostgreSQL local (PGlite): SQL compila, coleções e configurações preservadas, revisão impede sobrescrita, referências inválidas rejeitadas, exclusões por dono, funções protegidas e RLS nas nove tabelas.
- Verificações existentes: 22 fluxos gerais, 13 do calendário mobile, 8 dos filtros e instalação iPhone passaram.
- Ainda não aplicado no Supabase publicado. SMTP, modelos OTP e ativação real no iPhone dependem de configuração. Push permanece pendente.

- Publicação confirmada pelo status de sucesso do Vercel no commit 366fc1fb613621d45e76a48cb151afc385a61c40.
- Tela publicada em 390 × 844: sem rolagem horizontal, painel dentro da largura e solicitação de código desabilitada enquanto SMTP está pendente. Evidência: sincronizacao-mobile.png.


## Banco publicado — 06/10/2026

SQL aplicado com sucesso após autorização do usuário. Consulta no Supabase confirmou 9 tabelas pessoais, RLS em todas, acesso direto bloqueado, e-mail autorizado, chamadas anônimas bloqueadas e sincronização permitida apenas pela função autenticada. Zero aparelhos sincronizados: dados locais ainda não enviados. SMTP e ativação real continuam pendentes.


## Ativação por senha — 06/10/2026

OTP substituído por e-mail e senha em Configurações. Sem SMTP ou tela de cadastro pública. Quinze verificações do cliente passaram, incluindo senha incorreta, usuário não confirmado, limpeza do campo e entrada por SDK preservando a sincronização. Autenticação simulada: a criação do usuário e a entrada com senha real ficam a cargo do proprietário, diretamente no Supabase e no app.


## Prioridade local na primeira sincronização

18 testes do cliente passaram. A primeira combinação mantém a versão local em todos os tipos de registro e nas preferências, adiciona registros exclusivos da nuvem sem duplicar identificadores, guarda backup antes da alteração e mantém a prioridade durante a recuperação de falhas de rede. Após o primeiro envio confirmado, a revisão de conflitos entre aparelhos volta ao funcionamento normal.


## Nutrição

15 verificações da nova aba passaram: PIN correto/incorreto, planos, água e vírgula decimal, refeições e horários, alimentos e quantidades, macros manuais e totais, múltiplos planos, antropometria e histórico, edição, validação, expiração e bloqueio ao sair, exclusões com confirmação, persistência e cópias. O teste PostgreSQL preservou planejamentos, refeições e avaliações no snapshot de settings. Regressões existentes de tarefas, finanças, calendário e sincronização passaram.
Conferência visual da versão publicada em 390×844 e 320×740: navegação com seis destinos, PIN incorreto/correto, cancelamento de cadastro com estado de edição atualizado, bloqueio manual e formulário de antropometria. Nenhuma dieta ou avaliação de teste foi salva na versão publicada.
19 grupos de testes de Nutrição passaram, incluindo variações com alimentos/macros/cores independentes, giro e ciclo, totais sem duplicação, edição da principal preservando alternativas, exclusão confirmada apenas da substituição, compatibilidade com dados antigos e validação de sincronização.
