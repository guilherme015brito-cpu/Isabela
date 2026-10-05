# Instalar Isabela no iPhone

A logo de tulipa está aplicada no menu, favicon e ícones da tela de início. A pasta `dist/icons` contém a logo de 1024 px, favicon de 16/32 px, ícone Apple de 180 px e ícones PWA de 192/512 px.

1. Publique a pasta `dist` em uma hospedagem HTTPS. O endereço local do computador não é um link público para o iPhone.
2. Abra o endereço publicado no Safari.
3. Toque em Compartilhar → Adicionar à Tela de Início e confirme.
4. Abra o aplicativo pelo ícone Isabela.

O manifest solicita abertura independente do navegador. O service worker guarda os arquivos básicos após a primeira visita; a leitura OCR ainda depende de baixar seu mecanismo e modelo pela internet. Dados continuam locais ao navegador/dispositivo; faça uma cópia JSON antes de mudar de endereço ou reinstalar.

## Notificações: próxima integração

O envio de notificações ainda não está implementado. No iPhone é necessário iOS 16.4 ou posterior, instalar na Tela de Início e permitir notificações após tocar em um botão do aplicativo. Não é preciso publicar na App Store.

Na integração com Supabase: salvar o horário escolhido para cada lembrete e o fuso horário; cadastrar a assinatura Web Push do aparelho; executar um agendador no servidor para enviar os lembretes de tarefas pendentes; tratar o evento push no service worker para exibir a notificação e abrir a tarefa ao tocá-la. As chaves de envio ficam no servidor. Ao concluir, editar ou excluir a tarefa, o agendamento precisa ser atualizado. Evitar envio duplicado e remover assinaturas expiradas.

Um temporizador dentro da página não garante lembretes quando o aplicativo está fechado. Web Push depende de conectividade e das configurações de notificações/Foco do iPhone.

Referência oficial: https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/
