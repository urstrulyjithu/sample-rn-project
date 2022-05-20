import * as Localization from "react-native-localize";
import i18n from "i18n-js";
import memoize from "lodash.memoize";

export const translationGetters = {
  en: () => require("./en.json"),
  //   "es-US": () => require("./es.json"),
  //   "fr-FR": () => require("./fr.json"),
};

export const localize = memoize(
  (key, config) =>
    i18n.t(key, config).includes("missing") ? key : i18n.t(key, config),
  (key, config) => (config ? key + JSON.stringify(config) : key),
);

export const init = () => {
  const fallback = {languageTag: "en"};
  const {languageTag} =
    Localization.findBestAvailableLanguage(Object.keys(translationGetters)) ||
    fallback;

  localize.cache.clear();

  i18n.translations = {
    [languageTag]: translationGetters[languageTag](),
  };
  i18n.locale = languageTag;
};
