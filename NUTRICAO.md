# Nutrição

A aba 🥑 Nutrição foi adicionada com prioridade para o iPhone. Alimentação e Antropometria ficam em duas seções internas. A consulta é livre; o botão Nutricionista libera a edição pelo PIN `0000`. A edição expira após 15 minutos e bloqueia ao sair da aba ou colocar o app em segundo plano. O PIN controla os formulários do app; a autenticação e o acesso privado à nuvem continuam sendo feitos pelo Supabase.

## Planejamentos e refeições

- Crie vários planejamentos com nome, emoji, orientações e água diária em litros.
- Escolha qual planejamento consultar pelo seletor. Essa seleção é local e não altera o planejamento dos outros aparelhos.
- Cadastre cada refeição com nome, horário, emoji e alimentos com suas quantidades, um por linha.
- Digite manualmente kcal, proteína, carboidratos e lipídios por refeição. Não há cálculo automático a partir dos alimentos.
- A parte superior soma kcal e proteína das refeições daquele planejamento e mostra a água cadastrada. Carboidratos e lipídios aparecem no rodapé de cada refeição.
- Refeições são ordenadas pelo horário. Edição e exclusão estão disponíveis no acesso de nutricionista; exclusões pedem confirmação.

## Antropometria

Cadastre avaliações com data, peso em kg, altura em cm, gordura corporal em porcentagem e observações opcionais. A última avaliação fica destacada e o histórico aparece em ordem de data. Os registros podem ser editados ou excluídos após desbloquear com o PIN. Valores com vírgula decimal são aceitos.

## Preservação e sincronização

Os dados ficam em `settings.nutrition` no armazenamento do app e nas cópias JSON. O estado de edição e o PIN digitado não são gravados no backup nem na nuvem. Os dados usam a tabela privada de configurações e as funções de sincronização existentes: não foi necessário alterar o SQL.

A regra existente de prioridade dos dados locais continua valendo na primeira sincronização. Caso dois aparelhos alterem simultaneamente Nutrição, a revisão de conflitos apresenta os planejamentos e as avaliações como um conjunto. Escolha a versão que deseja manter antes de continuar.

Não foram adicionadas dietas ou medidas de exemplo ao app publicado. As imagens de demonstração usam dados fictícios de uma prévia local separada.

## Referências

O MagicPath foi consultado por "nutrition" e "health", mas não retornou componentes nutricionais acessíveis. A busca Mobbin estava indisponível sem plano pago. Como referência pública de organização, foram consultados os diários por refeição e resumos de macros de MyFitnessPal e Lifesum:

- https://support.myfitnesspal.com/hc/en-us/articles/39985611667341-Your-Today-tab
- https://help.lifesum.com/en/article/quick-track-add-calories-and-macros-quickly-mgdy5l/

A implementação usa a identidade rosa neve do app, campos de 16px para evitar zoom automático, alvos de toque de ao menos 44px e seis destinos na barra mobile.
