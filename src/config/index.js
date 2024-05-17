import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import zhTW from "./zh-TW.json"
import ko from "./ko.json";
import vi from "./vi.json";

export const resources = {
  en: {
    translation: en,
  },
  ko: {
    translation: ko,
  },
  vi: {
    translation: vi,
  },
  "zh-TW": {
    translation: zhTW,
  }
};

const resourcesArr = [];

for (let key in resources) {
  resourcesArr.push(key);
}

console.log('window.navigator.language', window.navigator.language)

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("lang")
    ? resourcesArr.includes(localStorage.getItem("lang"))
      ? localStorage.getItem("lang")
      : "en"
    : resourcesArr.includes(window.navigator.language)
    ? window.navigator.language
    : "en", //设置默认语言（可用三元表达式进行动态切换）
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
