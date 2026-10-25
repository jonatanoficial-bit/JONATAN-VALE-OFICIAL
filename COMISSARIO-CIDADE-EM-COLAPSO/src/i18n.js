// One supported locale today. Keep shared labels and formatters independent of
// rendering so future translations can be added without changing game state.
export const DEFAULT_LOCALE = 'pt-BR';
export const supportedLocales = [DEFAULT_LOCALE];
export const messages = Object.freeze({
  'pt-BR': Object.freeze({
    'common.save': 'Salvar gestão', 'common.load': 'Carregar',
    'common.close': 'Fechar', 'common.continue': 'Continuar gestão',
    'common.settings': 'Preferências', 'common.back': 'Voltar',
    'save.autosave': 'Salvamento automático', 'save.export': 'Exportar backup',
    'save.import': 'Importar backup', 'save.empty': 'Nenhuma campanha neste arquivo.',
    'save.restored': 'Campanha recuperada. Sua gestão continua.',
    'save.saved': 'Gestão salva no arquivo {slot}.',
    'game.day': 'Dia {day}', 'game.version': 'Versão {version}',
    'game.paused': 'Simulação pausada', 'game.install': 'Instalar jogo'
  })
});

export function t(key, parameters = {}, locale = DEFAULT_LOCALE) {
  const template = (messages[locale] || messages[DEFAULT_LOCALE])[key] || key;
  return template.replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(parameters, name) ? String(parameters[name]) : match);
}
export function formatCurrency(value, locale = DEFAULT_LOCALE) {
  return new Intl.NumberFormat(supportedLocales.includes(locale) ? locale : DEFAULT_LOCALE, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}
export function formatDate(value, locale = DEFAULT_LOCALE) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data indisponível' : new Intl.DateTimeFormat(supportedLocales.includes(locale) ? locale : DEFAULT_LOCALE, { dateStyle: 'short', timeStyle: 'short' }).format(date);
}
