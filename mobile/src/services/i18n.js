// Simple i18n implementation for AURA
import * as Localization from 'expo-localization';

const translations = {
  en: {
    welcome: "Welcome to AURA",
    login: "Log In",
    send: "Send",
    receive: "Receive",
    balance: "Balance",
    transactions: "Transactions",
    settings: "Settings",
    disputes: "Disputes",
    pay: "Pay",
  },
  hi: {
    welcome: "AURA में आपका स्वागत है",
    login: "लॉग इन करें",
    send: "भेजें",
    receive: "प्राप्त करें",
    balance: "शेष",
    transactions: "लेन-देन",
    settings: "सेटिंग्स",
    disputes: "विवाद",
    pay: "भुगतान करें",
  },
  te: {
    welcome: "AURA కి స్వాగతం",
    login: "లాగిన్ చేయండి",
    send: "పంపండి",
    receive: "స్వీకరించండి",
    balance: "బ్యాలెన్స్",
    transactions: "లావాదేవీలు",
    settings: "సెట్టింగులు",
    disputes: "వివాదాలు",
    pay: "చెల్లించండి",
  }
};

class I18nService {
  constructor() {
    this.locale = 'en'; // default fallback
    this.init();
  }

  init() {
    // Try to get device language, e.g., 'en-US' -> 'en'
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const languageCode = locales[0].languageCode;
      if (translations[languageCode]) {
        this.locale = languageCode;
      }
    }
  }

  setLanguage(langCode) {
    if (translations[langCode]) {
      this.locale = langCode;
    }
  }

  t(key) {
    return translations[this.locale][key] || translations['en'][key] || key;
  }
}

export default new I18nService();
