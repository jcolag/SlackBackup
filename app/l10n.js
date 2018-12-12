import { FluentBundle } from 'fluent/compat';
import { negotiateLanguages } from 'fluent-langneg/compat';

const MESSAGES_ALL = {
  pl: `
title = Witaj świecie!
today-is = Dziś jest { DATETIME($date, month: "long", day: "numeric") }.
  `,
  'en-US': `
title = Configuration
token = Token
add-token = Add
save-folder = Save Folder
delete-files = Delete Files
days-older = days old or more
save-empty = Save Empty Conversations
save-unsub = Save Unsubscribed Channels
use-comparative = Use Comparative Sentiment
use-recipient = Use Recipient Users' Colors
list-conv = List Conversations
save-conf = Save Configuration
  `,
};

export const LANGUAGES_SUPPORTED = Object.keys(MESSAGES_ALL);

/**
 * Generates the language bundles.
 *
 * @export
 * @param {*} userLocales Set of locales
 * @param {string} defaultLocale The default locale to use
 * @returns {void} Nothing
 */
export function* generateBundles(userLocales, defaultLocale = 'en-US') {
  // Choose locales that are best for the user.
  const currentLocales = negotiateLanguages(
    userLocales,
    LANGUAGES_SUPPORTED,
    { defaultLocale }
  );

  for (const locale of currentLocales) {
    const bundle = new FluentBundle(locale);
    bundle.addMessages(MESSAGES_ALL[locale]);
    yield bundle;
  }
}
