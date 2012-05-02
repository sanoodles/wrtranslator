/*
 * 
 * For developers: Please use ISO 639-1 for original and destination languages
 *  http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 * 
 */

/* original language */
const wrt_lang1_list = [
  "en","es",
  "en","fr",
  "en","it",
  "en","de",
  "en","ru",
  "en","pt",
  "en","pl",
  "en","ro",
  "en","cs",
  "en","el",
  "en","tr",
  "en","zh",
  "en","jp",
  "en","ko",
  "en","ar",
  "",
  "es","fr",
  "es","pt",
];

/* destination language */
const wrt_lang2_list = [
  "es","en",
  "fr","en",
  "it","en",
  "de","en",
  "ru","en",
  "pt","en",
  "pl","en",
  "ro","en",
  "cs","en",
  "el","en",
  "tr","en",
  "zh","en",
  "jp","en",
  "ko","en",
  "ar","en",
  "",
  "fr","es",
  "pt","es",
];



/*
 * 
 * The next paths depend entirely on what is implemented at 
 * wordreference.com . So, some do not match with the ISO codes.
 * ISO codes come from the name of the language in its own language.
 * By contrast, path prefixes come from the _english_ translation of 
 * the name of the language.
 * 
 */

/* translation path prefix */
const wrt_urlspans_list = [
  "es/translation.asp?tranword=","es/en/translation.asp?spen=",
  "enfr/","fren/",
  "enit/","iten/",
  "ende/","deen/",
  "enru/","ruen/",
  "enpt/","pten/",
  "enpl/","plen/",
  "enro/","roen/",
  "encz/","czen/",
  "engr/","gren/",
  "entr/","tren/",
  "enzh/","zhen/",
  "enja/","jaen/",
  "enko/","koen/",
  "enar/","aren/",
  "",
  "esfr/","fres/",
  "espt/","ptes/",
];
