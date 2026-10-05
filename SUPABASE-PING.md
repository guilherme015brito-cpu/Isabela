# Ping diário do Supabase

Projeto: `https://wraaibushaomimtrufrq.supabase.co`.

O workflow `.github/workflows/supabase-ping.yml` executa diariamente às 09:17 no fuso `America/Sao_Paulo`, e também pode ser iniciado manualmente em GitHub → Actions → Supabase - ping diario → Run workflow.

Cada execução faz três consultas pequenas ao Postgres via Data API, verifica HTTP de sucesso e valida a resposta `[{"id":1}]`. Tem tentativas em falhas temporárias e limite de cinco minutos. Não altera registros.

## Configuração

- Variável do repositório: `SUPABASE_URL`.
- Secret do repositório: `SUPABASE_PUBLISHABLE_KEY`.
- A chave publishable é enviada somente no header `apikey`; não use uma chave de administrador ou `service_role`.
- `supabase/healthcheck.sql` cria a tabela exclusiva `public.app_healthcheck`, com a linha fixa `id=1`, RLS ativo e acesso anônimo somente de leitura. Não contém dados pessoais nem libera as tabelas do app.

O SQL é repetível e foi aplicado ao projeto informado. Uma consulta real pela API retornou HTTP 200 e a linha esperada. O resultado da execução no GitHub é registrado em `VERIFICACAO.md`.

## Limites

A documentação atual do Supabase Free considera baixa atividade por **7 dias**, não 15. Algumas consultas ao banco por dia normalmente bastam; esse workflow ajuda a gerar atividade, mas não garante ausência de pausa. A garantia contra pausa por inatividade é do plano pago. Se o projeto já estiver pausado, precisa ser retomado no painel.

O GitHub pode atrasar ou deixar de executar um cron em períodos de carga. Em repositórios públicos, ele desativa os agendamentos depois de 60 dias sem atividade no repositório. Nesse caso, reative em Actions e faça uma atualização normal no repositório. O workflow não cria commits artificiais.

O app continua salvando tarefas e finanças no navegador. Este ping configura a manutenção do projeto; a sincronização dos dados do app com Supabase é uma etapa separada.

Fontes: [Supabase — Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Supabase — API Keys](https://supabase.com/docs/guides/getting-started/api-keys), [GitHub — Schedule](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).
