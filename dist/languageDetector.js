"use strict";
/*
Copyright 2023 Nito T.M.
License https://www.apache.org/licenses/LICENSE-2.0 Apache-2.0
Author Nito T.M. (https://github.com/nitotm)
Package npmjs.com/package/eld
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.eld = void 0;
const languageData_js_1 = require("./languageData.js");
const regexPatterns_js_1 = require("./regexPatterns.js");
const dictionary_js_1 = require("./dictionary.js");
const isoLanguages_js_1 = require("./isoLanguages.js");
const LanguageResult_js_1 = require("./LanguageResult.js");
const saveLanguageSubset_dev_js_1 = require("./saveLanguageSubset.dev.js");
(0, languageData_js_1.loadNgrams)();
// Project is ES2015
const eld = (function () {
    return {
        detect: detect,
        cleanText: cleanText,
        dynamicLangSubset: dynamicLangSubset,
        saveSubset: saveSubset,
        loadNgrams: languageData_js_1.loadNgrams,
        info: info,
    };
})();
exports.eld = eld;
/** @type {boolean|Array} */
let subset = false;
/** @type {boolean} When true, detect() cleans input text with getCleanTxt() */
let doCleanText = false;
/**
 * detect() identifies the natural language of a UTF-8 string
 * Returns an object, with a variable named 'language', with an ISO 639-1 code or empty string
 * { language: 'es', getScores(): {'es': 0.5, 'et': 0.2}, isReliable(): true }
 *
 * @param {string} text UTF-8
 * @returns {{language: string, getScores(): Object, isReliable(): boolean}} class LanguageResult
 */
function detect(text) {
    if (typeof text !== "string")
        return new LanguageResult_js_1.LanguageResult("", 0, 0, {});
    if (doCleanText) {
        // Removes Urls, emails, alphanumerical & numbers
        text = getCleanTxt(text);
    }
    const byteWords = textProcessor(text);
    const byteNgrams = getByteNgrams(byteWords);
    const numNgrams = Object.keys(byteNgrams).length;
    let results = calculateScores(byteNgrams, numNgrams);
    let language = "";
    if (subset) {
        results = filterLangSubset(results);
    }
    if (results.length > 0) {
        results.sort((a, b) => b[1] - a[1]);
        language = languageData_js_1.languageData.langCodes[results[0][0]];
    }
    return new LanguageResult_js_1.LanguageResult(language, results, numNgrams, languageData_js_1.languageData.langCodes);
}
/**
 * Public function to change doCleanText value
 *
 * @param {boolean} bool
 */
function cleanText(bool) {
    doCleanText = Boolean(bool);
}
/**
 * Removes parts of a string, that may be considered as "noise" for language detection
 *
 * @param {string} str
 * @returns {string}
 */
function getCleanTxt(str) {
    // Remove URLS
    str = str.replace(/[hw]((ttps?:\/\/(www\.)?)|ww\.)([^\s/?.#-]+\.?)+(\/\S*)?/gi, " ");
    // Remove emails
    str = str.replace(/[a-zA-Z0-9.!$%&’+_`-]+@[A-Za-z0-9.-]+\.[A-Za-z0-9-]{2,64}/g, " ");
    // Remove .com domains
    str = str.replace(regexPatterns_js_1.matchDomains, " ");
    // Remove alphanumerical/number codes
    str = str.replace(/[a-zA-Z]*[0-9]+[a-zA-Z0-9]*/g, " ");
    return str;
}
/**
 * @param {string} text
 * @returns {Array}
 */
function textProcessor(text) {
    text = text.substring(0, 1000);
    // Normalize special characters/word separators
    text = text.replace(regexPatterns_js_1.separators, " ");
    text = text.trim().toLowerCase();
    return strToUtf8Bytes(text); // returns array of words
}
/**
 * Gets Ngrams from a given array of words
 *
 * @param {Array} words
 * @returns {Object}
 */
function getByteNgrams(words) {
    let byteNgrams = {};
    let countNgrams = 0;
    let thisBytes;
    let j;
    for (let key in words) {
        let word = words[key];
        let len = word.length;
        if (len > 70) {
            len = 70;
        }
        for (j = 0; j + 4 < len; j += 3, ++countNgrams) {
            thisBytes = (j === 0 ? " " : "") + word.substring(j, j + 4);
            byteNgrams[thisBytes] =
                typeof byteNgrams[thisBytes] !== "undefined"
                    ? byteNgrams[thisBytes] + 1
                    : 1;
        }
        thisBytes =
            (j === 0 ? " " : "") + word.substring(len !== 3 ? len - 4 : 0) + " ";
        byteNgrams[thisBytes] =
            typeof byteNgrams[thisBytes] !== "undefined"
                ? byteNgrams[thisBytes] + 1
                : 1;
        countNgrams++;
    }
    // Frequency is multiplied by 15000 at the ngrams database. A reduced number (13200) seems to work better.
    // Linear formulas were tried, decreasing the multiplier for fewer ngram strings, no meaningful improvement.
    for (let bytes in byteNgrams) {
        byteNgrams[bytes] = (byteNgrams[bytes] / countNgrams) * 13200;
    }
    return byteNgrams;
}
/**
 * Calculate scores for each language from the given Ngrams
 *
 * @param {Object} byteNgrams
 * @param {number} numNgrams
 * @returns {Array}
 */
function calculateScores(byteNgrams, numNgrams) {
    let bytes, globalFrequency, relevancy, langCount, frequency, lang, thisByte;
    let langScore = [...languageData_js_1.languageData.langScore];
    for (bytes in byteNgrams) {
        frequency = byteNgrams[bytes];
        thisByte = languageData_js_1.languageData.ngrams[bytes];
        if (thisByte) {
            langCount = Object.keys(thisByte).length;
            // Ngram score multiplier, the fewer languages found the more relevancy. Formula can be fine-tuned.
            if (langCount === 1) {
                relevancy = 27; // Handpicked relevance multiplier, trial-error
            }
            else {
                if (langCount < 16) {
                    relevancy = (16 - langCount) / 2 + 1;
                }
                else {
                    relevancy = 1;
                }
            }
            // Most time-consuming loop, do only the strictly necessary inside
            for (lang in thisByte) {
                globalFrequency = thisByte[lang];
                langScore[lang] +=
                    (frequency > globalFrequency
                        ? globalFrequency / frequency
                        : frequency / globalFrequency) *
                        relevancy +
                        2;
            }
        }
    }
    // This divisor will produce a final score between 0 - ~1, score could be >1. Can be improved.
    let resultDivisor = numNgrams * 3.2;
    let results = [];
    for (lang in langScore) {
        if (langScore[lang]) {
            // Javascript does Not guarantee object order, so a multi-array is used
            results.push([parseInt(lang), langScore[lang] / resultDivisor]); // * languageData.scoreNormalizer[lang];
        }
    }
    return results;
}
/**
 * Converts each byte to a single character, using our own dictionary, since javascript does not allow raw byte
 * strings or invalid UTF-8 characters. We could use TextEncoder() to create an Uint8Array, and then translate to our
 * dictionary, but this function is overall faster as it does both jobs at once
 *
 * Alternatives such as just using Uint8Array/hex for detection adds complexity and or a bigger database
 *
 * @param {string} str
 * @returns {Array}
 */
function strToUtf8Bytes(str) {
    let encoded = "";
    let words = [];
    let countBytes = 0;
    const cutAfter = 350; // Cut to first whitespace after 350 byte length offset
    const enforceCutAfter = 380; // Cut after any UTF-8 character when surpassing 380 byte length
    for (let ii = 0; ii < str.length; ii++) {
        let charCode = str.charCodeAt(ii);
        if (charCode < 0x80) {
            if (charCode === 32) {
                if (encoded !== "") {
                    words.push(encoded);
                    encoded = "";
                }
                if (countBytes > cutAfter) {
                    break;
                }
            }
            else {
                encoded += str[ii];
            }
            countBytes++;
        }
        else if (charCode < 0x800) {
            encoded +=
                dictionary_js_1.dictionary[0xc0 | (charCode >> 6)] +
                    dictionary_js_1.dictionary[0x80 | (charCode & 0x3f)];
            countBytes += 2;
        }
        else if (charCode < 0xd800 || charCode >= 0xe000) {
            encoded +=
                dictionary_js_1.dictionary[0xe0 | (charCode >> 12)] +
                    dictionary_js_1.dictionary[0x80 | ((charCode >> 6) & 0x3f)] +
                    dictionary_js_1.dictionary[0x80 | (charCode & 0x3f)];
            countBytes += 3;
        }
        else {
            // UTF-16
            ii++;
            charCode =
                0x10000 + (((charCode & 0x3ff) << 10) | (str.charCodeAt(ii) & 0x3ff));
            encoded +=
                dictionary_js_1.dictionary[0xf0 | (charCode >> 18)] +
                    dictionary_js_1.dictionary[0x80 | ((charCode >> 12) & 0x3f)] +
                    dictionary_js_1.dictionary[0x80 | ((charCode >> 6) & 0x3f)] +
                    dictionary_js_1.dictionary[0x80 | (charCode & 0x3f)];
            countBytes += 4;
        }
        if (countBytes > enforceCutAfter) {
            break;
        }
    }
    if (encoded !== "") {
        words.push(encoded);
        // It is faster to build the array than to words.split(/ +/).filter((x) => x !== ' ') later
    }
    return words;
}
/**
 * Filters languages not included in the subset, from the result scores
 *
 * @param {Array} results
 * @returns {Array}
 */
function filterLangSubset(results) {
    let subResults = [];
    for (let key in results) {
        if (subset.indexOf(results[key][0]) > -1) {
            subResults.push(results[key]);
        }
    }
    return subResults;
}
/**
 * Validates an expected array of ISO 639-1 language code strings, given by the user, and creates a subset of the valid
 * languages compared against the current database available languages
 *
 * @param {Array|boolean} languages
 * @returns {Array|boolean}
 */
function makeSubset(languages) {
    if (languages) {
        subset = [];
        for (let key in languages) {
            // Validate languages, by checking if they are available at languageData
            let lang = Object.keys(languageData_js_1.languageData.langCodes).find((lkey) => languageData_js_1.languageData.langCodes[lkey] === languages[key]);
            if (lang) {
                subset.push(parseInt(lang));
            }
        }
        if (subset.length) {
            subset.sort();
        }
        else {
            subset = false;
        }
    }
    else {
        subset = false;
    }
    return subset;
}
/**
 * Creates a subset of languages, from which detect() will filter excluded languages from the results
 * Call dynamicLangSubset(false) to delete the subset
 *
 * @param {Array|boolean} languages
 * @returns {Object} Returns list of the validated languages for the new subset
 */
function dynamicLangSubset(languages) {
    let result = makeSubset(languages);
    if (result) {
        return (0, isoLanguages_js_1.isoLanguages)(result, languageData_js_1.languageData.langCodes);
    }
    return {};
}
/**
 * Creates a download, only available for the web browser, with a file containing the ngrams database, of the validated
 * languages from the array argument
 *
 * @param {Array} languages
 */
function saveSubset(languages) {
    const langArray = makeSubset(languages);
    makeSubset(false); // remove the global subset, we only need the filtered langArray
    saveLanguageSubset_dev_js_1.saveLanguageSubset.saveSubset(langArray, languageData_js_1.languageData.ngrams, languageData_js_1.languageData.langCodes, languageData_js_1.languageData.type);
}
function info() {
    return {
        "Data type": languageData_js_1.languageData.type,
        Languages: languageData_js_1.languageData.langCodes,
        "Dynamic subset": subset
            ? (0, isoLanguages_js_1.isoLanguages)(subset, languageData_js_1.languageData.langCodes)
            : false,
    };
}
