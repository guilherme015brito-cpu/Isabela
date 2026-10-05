# Isabela · Meu espaço

App responsivo de rotina e finanças, sem tela de login do app.

## Usar

Abra `dist/index.html` no navegador ou use a prévia local. Os dados ficam no armazenamento local do navegador. Celular e desktop ainda não sincronizam. Em Configurações, exporte uma cópia JSON para backup ou transferência. Os dados iniciais são vazios; o botão “Adicionar exemplos” inclui registros demonstrativos.

## Recursos

- Dashboard com gráficos calculados a partir das tarefas e finanças, com acesso às abas.
- Calendário anual, mensal, semanal, diário e de 15 dias. Navegação por swipe no celular, filtros e etiquetas com limite por bloco.
- Tarefas com descrição, emoji, cor, categoria, início, limite, edição, exclusão e conclusão.
- Caixa com entradas e saídas, bancos com saldo inicial e projetos PLAN. Transações associadas atualizam o progresso dos projetos.
- Cinco temas, posição e estética da navegação no desktop, menu com recolhimento automático ao escolher uma aba. Posições: esquerda, direita, superior e inferior. Use o botão de menu para expandir.
- Importação da escala por foto usando Tesseract.js no aparelho; precisa de internet na primeira leitura. A revisão manual é obrigatória. A fotografia enviada também foi transcrita e pode ser aplicada pelo botão específico.

## Escala enviada

Isabela: cozinha na 1ª e 3ª semanas; banheiro na 2ª e 4ª semanas; lavanderia e garagem na 4ª semana. A imagem informa outubro, sem ano. O ano e as datas das semanas são escolhidos na revisão. Por padrão, os intervalos são 1–7, 8–14, 15–21 e 22–28; ajuste se a casa usa outra convenção. Uma tarefa de limpeza ocupa o intervalo inteiro, desaparecendo de todos os dias quando concluída. A 5ª semana não é inferida.

O reconhecimento automático identifica a grade, corrige a perspectiva e lê cada célula separadamente em tabelas como a fornecida. A foto enviada passou no teste real: todas as cinco atribuições de Isabela foram reconhecidas. Fotos inclinadas, borradas ou com outro formato podem exigir preenchimento manual. A foto e o texto reconhecido não são armazenados nem enviados para um serviço de IA.

## Próxima etapa: Supabase

A lógica de dados está centralizada em `db` e `save()` no arquivo `dist/app.js`. Não há integração, credenciais ou banco remoto nesta versão. A migração deve incluir tarefas, categorias, bancos, transações, projetos, configurações e lotes de importação. A versão hospedada pelo Sites é privada e pode exigir o acesso da conta proprietária; essa proteção é da hospedagem, não uma tela de login implementada no app.

## Arquivos

`dist/` contém todos os arquivos do app: HTML, estilos, lógica, seletores e módulos de leitura da escala. Não requerem compilação. Fontes externas possuem alternativas locais; o leitor OCR usa biblioteca e modelo de idioma carregados pela internet.


## Atualização dos controles

Ícones selecionáveis, paleta com anel cromático, lixeira com confirmação nos detalhes, categorias financeiras e filtros do caixa. Consulte VERIFICACAO.md para os testes realizados e suas limitações.

Notificações: em Configurações você pode salvar frequência, dias, até três horários, intervalo, antecedência, descanso, categorias, resumo, atrasadas e fuso horário. Essas preferências ainda não enviam notificações; aguardam integração com um servidor.
