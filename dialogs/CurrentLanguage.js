module.exports = class CurrentLanguage {
  constructor() {
    this.curr_lang = "en";
    this.prev_lang = "en";
  }
  static set(lang) {
    this.prev_lang = this.curr_lang;
    this.curr_lang = lang;
  }
  static get() {
    return this.curr_lang;
  }
  static swap() {
    let temp = this.curr_lang;
    this.curr_lang = this.prev_lang;
    this.prev_lang = temp;
  }
};
