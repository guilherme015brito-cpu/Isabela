# Integração com Supabase

## Estado desta entrega

O app contém o cliente de sincronização, ativação por código de e-mail nas Configurações e cópia local para uso sem internet. O SQL foi validado em PostgreSQL local. A aplicação do SQL no projeto publicado e o envio de e-mails ainda precisam ser concluídos. `emailDeliveryReady` permanece `false` para impedir pedidos de código que não funcionariam.

## 1. Estrutura do banco

No SQL Editor do projeto Isabela, execute `supabase/integration.sql`. Depois, autorize o e-mail real informado pelo usuário na tabela privada:

```sql
insert into private.isabela_allowed_emails(email)
values (lower('SEU_EMAIL_REAL')) on conflict do nothing;
```

Não publique o e-mail pessoal no GitHub. As nove tabelas têm RLS habilitado e acesso direto bloqueado. As funções autenticadas verificam o dono e o e-mail autorizado. O app usa somente a chave pública; nenhuma chave `service_role` pertence ao cliente.

## 2. Envio dos códigos

Em Supabase → Authentication → Emails → SMTP Settings, configure um provedor SMTP. Um caminho possível é Brevo: crie a conta, verifique um remetente e obtenha as credenciais em SMTP & API. Use host, porta, usuário e chave SMTP apresentados pelo próprio provedor. A chave SMTP é diferente da senha de login. Insira os dados diretamente no painel do Supabase.

Documentação: https://help.brevo.com/hc/pt/articles/7959631848850-Criar-e-gerenciar-suas-chaves-SMTP

O remetente verificado é quem envia o código; o e-mail de ativação é quem recebe. O SMTP padrão do Supabase só envia para integrantes da equipe: https://supabase.com/docs/guides/auth/auth-smtp

## 3. Modelos de e-mail

Em Emails → Templates, ajuste **Confirm sign up** e **Magic link or OTP** para conter o código, por exemplo:

```html
<h2>Ative seu espaço</h2>
<p>Digite este código nas Configurações do app Isabela:</p>
<p style="font-size:28px;font-weight:bold">{{ .Token }}</p>
<p>Se você não solicitou este código, ignore esta mensagem.</p>
```

Use `{{ .Token }}` nos dois modelos. Mantenha a confirmação de e-mail habilitada. Em URL Configuration, configure o Site URL para `https://isabela-meu-espaco.vercel.app/`.

Somente após banco, SMTP e modelos prontos, altere `emailDeliveryReady` para `true` em `dist/cloud-config.js` e publique no Vercel. Esse valor só controla a interface; a autorização efetiva é feita no banco.

## 4. Ativação no app

No iPhone, abra pelo ícone instalado na Tela de Início. Vá a Configurações → Sincronização, informe o e-mail autorizado, solicite e digite o código. Na primeira conexão, revise os totais e envie os dados deste aparelho ou combine com a nuvem. Uma cópia anterior fica disponível para download. Repita no computador usando o mesmo e-mail.

A sessão fica guardada no aparelho e é renovada pelo SDK. Safari e o app instalado podem ter armazenamentos diferentes; ative dentro do app que será usado.

## Funcionamento e limites

Tarefas, categorias, bancos, movimentações, planos, escalas importadas, aparência e preferências de notificações são sincronizados. A posição recolhida do menu é uma preferência temporária e não é enviada.

O app verifica a nuvem ao abrir, voltar ao foco e enquanto está visível. Sem internet, grava localmente e tenta novamente. Alterações simultâneas em registros diferentes são combinadas; no mesmo registro, as Configurações mostram a revisão. A revisão do banco impede sobrescrever uma versão mais recente.

Sincronização ocorre com o app aberto. Notificações push com o app fechado ainda exigem serviço de envio, inscrições Web Push e agendamento no servidor; SMTP envia os códigos de ativação e não ativa push.

O navegador precisa manter o armazenamento local. Exportar cópias continua disponível. A primeira migração de dados financeiros reais ainda não foi executada nesta entrega.

## SDK

`dist/vendor/supabase.js` contém @supabase/supabase-js 2.117.2, empacotado com esbuild 0.28.2 como IIFE (`IsabelaSupabase`), plataforma browser, alvo ES2020. Licenças em `dist/vendor/THIRD-PARTY.txt`. Não depende de CDN para carregar o cliente Supabase.
