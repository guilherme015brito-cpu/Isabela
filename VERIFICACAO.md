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

O app continua usando armazenamento local. A versão desta pasta não depende de Supabase. A publicação no Sites não foi concluída por causa do bloqueio de permissões já registrado na conversa. A prévia local é http://127.0.0.1:4173/ enquanto o servidor estiver ativo.

Logo/PWA: tamanhos dos três ícones do manifest conferidos, scripts de instalação e service worker validados; os 21 grupos de testes continuam passando. Instalação real e push no iPhone ainda não testados. Consulte INSTALAR-NO-IPHONE.md.

Importação: reproduzido aviso de escala duplicada atrás do dialog. Avisos agora ficam na camada do modal; resultado sem tarefas novas tem botões clicáveis Revisar escala/Ver calendário. Fluxo confirmado no Edge e regressão verificada nos 21 grupos de testes.

Importação corrigida: avisos dentro do dialog, confirmação acessível para escala duplicada e botão Ver calendário validado no Edge. Os 21 grupos de testes passaram, incluindo a posição do aviso e fechamento do modal.

Preferências de notificações: 22 grupos passaram. Verificados salvamento local, recarregamento, categorias/dias, horários duplicados, faixa de repetição inválida e desativação preservando as escolhas. Formulário e confirmação de salvamento também verificados no Edge.
