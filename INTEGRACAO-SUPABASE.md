# Integração com Supabase — ativação por senha

O banco foi aplicado e verificado em 06/10/2026. O app usa e-mail e senha exclusiva para vincular cada aparelho; não precisa de SMTP, código de e-mail ou aba de login. A sessão é guardada e renovada pelo SDK. Os dados locais só são enviados depois de revisar e confirmar a primeira sincronização.

## 1. Criar o usuário

1. Abra o projeto Isabela no Supabase → Authentication → Users.
2. Selecione Add user → Create new user.
3. Digite o mesmo e-mail que foi autorizado na tabela privada.
4. Em User Password, defina uma senha exclusiva do app. Não use a senha da caixa de e-mail.
5. Mantenha Auto confirm user? marcado e clique em Create user.

Essa confirmação se aplica ao usuário criado manualmente. Não é necessário desabilitar a confirmação de e-mail para novos cadastros do projeto. A senha deve ser definida diretamente pelo proprietário no painel. Não publique senhas ou o e-mail pessoal no GitHub.

## 2. Ativar no iPhone

1. Abra https://isabela-meu-espaco.vercel.app/ pelo ícone instalado na Tela de Início.
2. Vá a Configurações → Sincronização.
3. Informe o e-mail autorizado e a senha criada no passo anterior.
4. Toque em Ativar este aparelho.
5. Confira os totais locais e os da nuvem. Se a nuvem estiver vazia, toque em Enviar dados deste aparelho. Se já houver dados, toque em Sincronizar mantendo meus dados: a versão local de cada registro prevalece e os registros exclusivos da nuvem são adicionados.
6. Aguarde a indicação Sincronizado.

Uma cópia anterior à ativação fica disponível para download. Safari e o app instalado podem ter armazenamentos diferentes: use o app que contém seus dados. Se precisar transferir dados do Safari, exporte uma cópia antes e restaure no app instalado antes da primeira sincronização.

## 3. Ativar no computador

Abra o app, vá a Configurações → Sincronização e use o mesmo e-mail e senha. Em um navegador sem dados locais, os dados da nuvem são carregados. Se já existir uma rotina local, o app pede confirmação e mantém os registros locais em caso de identificadores iguais.

A sessão normalmente permanece ativa. Será preciso entrar novamente após desvincular, limpar os dados do navegador ou se a sessão for revogada. Sem SMTP, uma senha esquecida deve ser redefinida pelo proprietário no painel do Supabase.

## Dados e proteção

Tarefas, categorias, bancos, movimentações, planos, escalas, aparência e preferências de notificações são sincronizados. A posição recolhida do menu é temporária e não é enviada. A senha é passada ao Supabase Auth; o app não a grava na base local, nos backups ou no código. O SDK persiste os tokens de sessão.

As nove tabelas pessoais têm RLS habilitado e acesso direto bloqueado. As funções autenticadas verificam o dono e o e-mail autorizado. `supabase/integration.sql` pode ser usado para reinstalação. O e-mail autorizado é provisionado separadamente em `private.isabela_allowed_emails` e não é incluído no arquivo público. A chave publishable não concede acesso aos dados privados; nenhuma chave administrativa fica no cliente.

O app verifica a nuvem ao abrir, voltar ao foco e enquanto está visível. Sem internet, grava localmente e tenta novamente. Na primeira sincronização, os registros e as preferências locais têm prioridade, com backup anterior ao envio. Essa prioridade continua se houver falha de rede até a confirmação do primeiro envio. Nas sincronizações seguintes, alterações em registros diferentes são combinadas; no mesmo registro, Configurações mostra uma revisão. A revisão do banco impede sobrescrever uma versão mais recente.

Sincronização acontece com o app aberto. Notificações push com o app fechado continuam dependendo de inscrições Web Push e agendamento no servidor; autenticação por senha não ativa notificações. Exporte cópias regularmente.

## SDK

`dist/vendor/supabase.js`: @supabase/supabase-js 2.117.2, empacotado com esbuild 0.28.2 como IIFE (`IsabelaSupabase`), browser, ES2020. Licenças em `dist/vendor/THIRD-PARTY.txt`.
