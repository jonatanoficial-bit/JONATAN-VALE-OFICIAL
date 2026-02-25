// Atualiza o selo de build com a data e hora atuais em formato brasileiro
document.addEventListener('DOMContentLoaded', () => {
  const buildEl = document.getElementById('build');
  if (buildEl) {
    const date = new Date();
    // Format date/time for São Paulo timezone (America/Sao_Paulo)
    const formatted = date.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    buildEl.textContent = `BUILD: ${formatted}`;
  }
});