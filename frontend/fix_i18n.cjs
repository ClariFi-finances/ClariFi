const fs = require('fs');

function updateLocale(file, isPt) {
  const content = JSON.parse(fs.readFileSync(file, 'utf8'));
  content.notifications = {
    title: isPt ? "Notificações" : "Notifications",
    empty: isPt ? "Nenhuma notificação nova." : "No new notifications.",
    markRead: isPt ? "Marcar como lido" : "Mark as read",
    budgetAlertTitle: isPt ? "Alerta de Orçamento" : "Budget Alert",
    budgetAlertMessage: isPt ? "Atenção: Você gastou mais do que ganhou este mês!" : "Attention: You've spent more than you earned this month!",
    goalProgressTitle: isPt ? "Progresso de Meta!" : "Goal Progress!",
    goalProgressMessage: isPt ? "Parabéns! Você alcançou 50% da sua meta '{{goalName}}'!" : "Congratulations! You reached 50% of your '{{goalName}}' goal!",
    goalCompletedTitle: isPt ? "Meta Concluída! 🎉" : "Goal Completed! 🎉",
    goalCompletedMessage: isPt ? "Incrível! Você alcançou 100% da sua meta '{{goalName}}'!" : "Amazing! You reached 100% of your '{{goalName}}' goal!"
  };
  fs.writeFileSync(file, JSON.stringify(content, null, 2));
}

updateLocale('./src/translations/pt-BR.json', true);
updateLocale('./src/translations/en-US.json', false);
console.log('Locales updated!');
