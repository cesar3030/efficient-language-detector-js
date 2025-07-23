"use strict";
/*
Copyright 2023 Nito T.M.
License https://www.apache.org/licenses/LICENSE-2.0 Apache-2.0
Author Nito T.M. (https://github.com/nitotm)
Package npmjs.com/package/eld
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.languageData = void 0;
exports.loadNgrams = loadNgrams;
const avgScore_js_1 = require("./avgScore.js");
const ngramsM60_js_1 = require("./ngrams/ngramsM60.js");
exports.languageData = {
    langCodes: {},
    langScore: [],
    ngrams: {},
    type: "",
    avgScore: avgScore_js_1.avgScore,
};
/**
 * @param {string} file File inside /ngrams/, with ELD ngrams data format
 * @returns {boolean|undefined} true if file was loaded
 */
function loadNgrams() {
    setNgrams(ngramsM60_js_1.ngramsData);
    if (exports.languageData.type) {
        return true;
    }
}
// setNgrams(ngramsData) // Used to create minified files with import { ngramsData }
/**
 * @param {Object} data
 */
function setNgrams(data) {
    exports.languageData.langCodes = data.languages;
    exports.languageData.langScore = Array(Object.keys(data.languages).length).fill(0);
    exports.languageData.ngrams = data.ngrams;
    exports.languageData.type = data.type;
}
/* ISO 639-1 codes, for the 60 languages set.
 * ['am', 'ar', 'az', 'be', 'bg', 'bn', 'ca', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'eu', 'fa', 'fi', 'fr', 'gu',
 * 'he', 'hi', 'hr', 'hu', 'hy', 'is', 'it', 'ja', 'ka', 'kn', 'ko', 'ku', 'lo', 'lt', 'lv', 'ml', 'mr', 'ms', 'nl',
 * 'no', 'or', 'pa', 'pl', 'pt', 'ro', 'ru', 'sk', 'sl', 'sq', 'sr', 'sv', 'ta', 'te', 'th', 'tl', 'tr', 'uk', 'ur',
 * 'vi', 'yo', 'zh']
 *
 * ['Amharic', 'Arabic', 'Azerbaijani (Latin)', 'Belarusian', 'Bulgarian', 'Bengali', 'Catalan', 'Czech', 'Danish',
 * 'German', 'Greek', 'English', 'Spanish', 'Estonian', 'Basque', 'Persian', 'Finnish', 'French', 'Gujarati',
 * 'Hebrew', 'Hindi', 'Croatian', 'Hungarian', 'Armenian', 'Icelandic', 'Italian', 'Japanese', 'Georgian', 'Kannada',
 * 'Korean', 'Kurdish (Arabic)', 'Lao', 'Lithuanian', 'Latvian', 'Malayalam', 'Marathi', 'Malay (Latin)', 'Dutch',
 * 'Norwegian', 'Oriya', 'Punjabi', 'Polish', 'Portuguese', 'Romanian', 'Russian', 'Slovak', 'Slovene', 'Albanian',
 * 'Serbian (Cyrillic)', 'Swedish', 'Tamil', 'Telugu', 'Thai', 'Tagalog', 'Turkish', 'Ukrainian', 'Urdu',
 * 'Vietnamese', 'Yoruba', 'Chinese']
 */
