/**
 * Full fhirConvert function: validates, converts, then identifies variables.
 * @param {string} str - inputted normal syntax expression
 * @param {Array} vars - array of usable variables entered by user
 * @returns converted fhirpath expression
 */
export function fhirConvert(str, vars) {
  if (validate(str, vars)) {
    return varFind(convert(str), vars);
  } else {
    return null;
  }
}

// Array of usable operators
const ops = [
  "+",
  "-",
  "*",
  "/",
  "^",
  "**",
  "||",
  "&&",
  "<",
  ">",
  "=",
  "!=",
  "!~",
  ">=",
  "<=",
  "xor",
  "XOR",
  "implies",
  "IMPLIES",
  "and",
  "or",
  "AND",
  "OR"
];

// Array of usable functions
const functions = [
  "CEILING",
  "FLOOR",
  "ABS",
  "TRUNCATE",
  "EXP",
  "SQRT",
  "LN",
  "LOG",
  "NOT",
  "LENGTH",
  "ceiling",
  "floor",
  "abs",
  "truncate",
  "exp",
  "sqrt",
  "ln",
  "log",
  "not",
  "length"
];

// Array of functions with no arguments
const noArgumentFunctions = [
  "CEILING",
  "FLOOR",
  "ABS",
  "TRUNCATE",
  "EXP",
  "SQRT",
  "LN",
  "NOT",
  "LENGTH",
  "ceiling",
  "floor",
  "abs",
  "truncate",
  "exp",
  "sqrt",
  "ln",
  "not",
  "length"
];

/**
 * Verifies normal syntax by confirming var names, function names,
 * syntax, and number of parenthesis.
 * @param {string} str - inputted normal syntax expression
 * @param {Array} vars - array of usable variables
 * @returns boolean, valid or invalid
 */
function validate(str, vars) {
  // Operator Validation
  let len = str.length;
  let op = "";
  // Loop to identify operator strings
  for (let j = 0; j < len; j++) {
    // If operator char, append to op
    if (!(/[a-zA-Z0-9.,'"\s()\\-]/.test(str[j]))) {
      op = op + str[j];
      if (j === len - 1 || j === 0) {
        return false;
      }
    }
    // Checks operator if length > 1 and operator string ends
    else if (op.length > 0) {
      if (!(ops.includes(op))) {
        return false;
      }
      // Validates expression to left of operator
      let lSearch = true;
      let op_l = j - op.length - 1;
      while(lSearch) {
        if (!(/[\s]/.test(str[op_l]))) {
          if (!(/[a-zA-Z0-9.,'")\\-]/.test(str[op_l]))) {
            return false;
          }
          lSearch = false;
        } else {
          op_l -= 1;
        }
      }
      // Validates expression to right of operator
      let rSearch = true;
      let op_r = j;
      if (op_r > len - 1) {
        return false;
      }
      while(rSearch) {
        if (!(/[\s]/.test(str[op_r]))) {
          if (!(/[a-zA-Z0-9.'"(\\-]/.test(str[op_r]))) {
            return false;
          }
          rSearch = false;
        } else {
          op_r += 1;
        }
      }
      op = "";
    }
    else {
      op = "";
    }
  }

  // Function validation
  let lCount = 0;
  let rCount = 0;
  let substr = "";
  let inString = false;
  let inEscape = false;
  // Loop to checks parenthesis, identify non-operator strings and check strings
  for (let i = 0; i < len; i++) {
    ({ inString, inEscape } = isInString(str, i, inString, inEscape));

    if (!inString) {
      if (str[i] === "(") {
        lCount += 1;
      }
      if (str[i] === ")") {
        rCount += 1;
      }
      if (rCount > lCount) {
        return false;
      }
      // If usable char, add to substring
      if (/[a-zA-Z0-9]/.test(str[i])) {
        substr = substr + str[i];
      }
      // Checks if substring is valid
      if ((str[i + 1] == null || !(/[[a-zA-Z0-9]/.test(str[i + 1])))) {
        if ((functions.includes(substr) && str[i + 1] === "(") || substr === "") {
          substr = "";
        } else if (vars.includes(substr) || (ops.includes(substr) || !(isNaN(substr)))) {
          substr = "";
        } else {
          return false;
        }
      }
    }
  }

  // Parentheses must be balanced and quotes should end
  return (lCount === rCount) && !inString;
}

/**
 * Identifies convertable functions in expression and converts them recursively.
 * @param {string} str - inputted normal syntax expression
 * @returns expression with converted functions
 */
function convert(str) {
  let count = 0;
  let stringMinusQuotes = getStringMinusQuotes(str);
  let stringParts = getStringParts(str);

  if (stringMinusQuotes.includes("^")) {
    let i = indexOutsideQuotes(str, stringParts, "^");
    let base = lFind(str, i);
    let power = rFind(str, i);
    str =
        str.slice(0, i - base.length) +
        base.trim() +
        ".power(" +
        power.trim() +
        ")" +
        str.slice(i + power.length + 1);
    count += 1;
  }

  if (stringMinusQuotes.includes("**")) {
    let i = indexOutsideQuotes(str, stringParts, "**");
    let base = lFind(str, i);
    let power = rFind(str, i+1);
    str =
        str.slice(0, i - base.length) +
        base.trim() +
        ".power(" +
        power.trim() +
        ")" +
        str.slice(i + power.length + 2);
    count += 1;
  }

  for (let f = 0; f < noArgumentFunctions.length; f++) {
    if (stringMinusQuotes.includes(noArgumentFunctions[f])) {
      if (str[indexOutsideQuotes(str, stringParts, noArgumentFunctions[f]) - 1] !== ".") {
        str = funcAppend(str, noArgumentFunctions[f]);
        count += 1;
      }
    }
  }

  if (stringMinusQuotes.includes("LOG")) {
    str = logAppend(str, "LOG");
    count += 1;
  }

  if (stringMinusQuotes.includes("log")) {
    if (str[indexOutsideQuotes(str, stringParts, "log") - 1] !== ".") {
      str = logAppend(str, "log");
      count += 1;
    }
  }

  if (str.includes("OR")) {
    str = replaceOutsideQuotes(str, stringParts, "OR", "or");
    count += 1;
  }

  if (str.includes("AND")) {
    str = replaceOutsideQuotes(str, stringParts, "AND", "and");
    count += 1;
  }

  if (str.includes("||")) {
    str = replaceOutsideQuotes(str, stringParts, "||", "or");
    count += 1;
  }

  if (str.includes("&&")) {
    str = replaceOutsideQuotes(str, stringParts, "&&", "and");
    count += 1;
  }

  // Replace double quotes with single quotes
  str = replaceOutsideQuotes(str, stringParts, '"', "'", true);

  if (count !== 0) {
    return convert(str);
  } else {
    return str;
  }
}

/**
 * Identifies functions and appends them in fhirpath form
 * @param {string} str - inputted normal syntax expression
 * @param {string} func - function in inputted normal syntax expression
 * @returns expression with converted function
 */
function funcAppend(str, func) {
  let i = str.indexOf(func);
  let j = i + func.length;
  let k = j;
  let eq = false;
  let open = 0;
  let close = 0;
  while (!eq) {
    if (str[k] === "(") {
      open += 1;
    }
    if (str[k] === ")") {
      close += 1;
    }

    if (open === close) {
      eq = true;
    } else {
      k += 1;
    }
  }
  return (
      str.slice(0, i).trim() +
      str.slice(j, k + 1).trim() +
      "." +
      func.toLowerCase() +
      "()" +
      str.slice(k + 1).trim()
  );
}

/**
 * Same as funcAppend, but in LOG format
 * @param {string} str - inputted normal syntax expression
 * @param {string} func - "LOG" or "log"
 * @returns expression with converted log function
 */
function logAppend(str, func) {
  let stringParts = getStringParts(str);
  let i = indexOutsideQuotes(str, stringParts, func);
  let j = i + 3;
  let k = j;
  let cma = -1;
  let eq = false;
  let open = 0;
  let close = 0;

  while (!eq) {
    if (str[k] === "(") {
      open += 1;
    }
    if (str[k] === ")") {
      close += 1;
    }

    if (open === close + 1 && k !== j && str[k] === ",") {
      cma = k;
    }
    if (open === close) {
      eq = true;
    } else {
      k += 1;
    }
  }

  return (
      str.slice(0, i).trim() +
      "(" +
      str.slice(cma + 1, k).trim() +
      ")" +
      ".log(" +
      str.slice(j + 1, cma).trim() +
      ")" +
      str.slice(k + 1).trim()
  );
}

/**
 * Identifies expression to left of operator
 * @param {string} str - inputted expression
 * @param {int} i - operator index
 * @returns expression to left of operator
 */
function lFind(str, i) {
  if (str[i - 1] !== ")") {
    let search = true;
    let lStr = "";
    while (search) {
      if (i < 2) {
        search = false;
      }
      if (/[a-zA-Z0-9.\-\s]/.test(str[i - 1])) {
        lStr = str[i - 1] + lStr;
        i -= 1;
      } else {
        search = false;
      }
    }
    return lStr;
  } else {
    let eq = false;
    let open = 0;
    let close = 0;
    let k = i - 1;

    while (!eq) {
      if (str[k] === "(") {
        open += 1;
      }
      if (str[k] === ")") {
        close += 1;
      }
      if (open === close) {
        eq = true;
      } else {
        k -= 1;
      }
    }
    return str.slice(k, i);
  }
}

/**
 * Identifies expression to right of operator
 * @param {string} str - inputted expression
 * @param {int} i - operator index
 * @returns expression to right of operator
 */
function rFind(str, i) {
  if (str[i + 1] !== "(") {
    let search = true;
    let rStr = "";
    while (search) {
      if (str[i + 2] === undefined) {
        search = false;
      }
      if (/[a-zA-Z0-9.\s()\\-]/.test(str[i + 1])) {
        rStr = rStr + str[i + 1];
        i += 1;
      } else {
        search = false;
      }
    }
    return rStr;
  } else {
    return str.slice(i + 1, str.slice(i).indexOf(")") + i + 1);
  }
}

/**
 * Identifies variables in expression and adds %
 * @param {string} str - converted expression
 * @param {Array} vars - array of usable variables
 * @returns converted expression with formatted variables
 */
function varFind(str, vars) {
  let end = false;
  let i = 0;
  let j = 0;
  let v = "";
  while (!end) {
    if (str[i] == null) {
      end = true;
    } else {
      if (/[a-zA-Z0-9'"]/.test(str[i])) {
        v = v + str[i];
      } else {
        j = i - v.length;
        if (vars.includes(v)) {
          str = str.slice(0, j) + "%" + str.slice(j);
          i += 1;
        }
        v = "";
      }
      if (str[i+1] == null) {
        j = i - v.length + 1;
        if (vars.includes(v)) {
          str = str.slice(0, j) + "%" + str.slice(j);
          i += 1;
        }
      }
      i += 1;
    }
  }
  return str;
}

/**
 * Check to see if we're in a string given the current status, string and
 * position
 * @param str {string} - string to check
 * @param i {number} - current string index
 * @param inString {boolean} - current status for in string
 * @param inEscape {boolean} - current status for escape
 * @return {{inString: boolean, inEscape: boolean}} inString true if position i
 *  is inside a string, inEscape true if position i is in an escape sequence
 */
function isInString(str, i, inString, inEscape) {
  const isQuote = str[i] === "'" || str[i] === '"';

  if (isQuote && !inString) {  // Check for quote start
    inString = true;
  } else if (isQuote && inString && !inEscape) {
    inString = false;
  } else if (inString && inEscape) {
    inEscape = false;
  } else if (inString && !inEscape && str[i] === "\\") {
    inEscape = true;
  }

  return {
    inString,
    inEscape
  }
}

/**
 * Get the parts of the string which are quotes
 * @param str - String to check
 * @return Array of booleans representing if position is part of quotes (which
 *  should not be processed)
 */
function getStringParts(str) {
  const parts = [];
  let inString = false;
  let inEscape = false;

  for (let i = 0; i < str.length; i++) {
    ({ inString, inEscape } = isInString(str, i, inString, inEscape));

    parts.push(inString);
  }

  return parts;
}

/**
 * Get only the parts of the string which are not quoted
 * @param str {string} - String to process
 * @return {string} - String without quotes
 */
function getStringMinusQuotes(str) {
  const parts = [];
  let inString = false;
  let inEscape = false;

  for (let i = 0; i < str.length; i++) {
    ({inString, inEscape} = isInString(str, i, inString, inEscape));

    if (!inString) {
      parts.push(str[i]);
    }
  }

  return parts.join("");
}

/**
 * Get the index for the search value but ignore quotes
 * @param str {string} - String to search
 * @param stringParts - Array of booleans indicating if inside string.
 *  Use `getStringParts`
 * @param value {string} - Value to look for
 * @return {number} - Index of match, -1 if none (not including quotes)
 */
function indexOutsideQuotes(str, stringParts, value) {
  let insideQuote = false;
  let searchIndex = 0;
  let index;

  do {
    index = str.indexOf(value, searchIndex);

    if (index !== -1 && stringParts[index]) {
      // The index fell as part of a quote, we should find the next match
      insideQuote = true;
      searchIndex = index + 1;
    } else {
      insideQuote = false;
    }
  } while (index !== -1 && insideQuote);

  return index;
}

/**
 * Replace values not inside quotes
 * @param str {string} - String to search
 * @param stringParts - Array of booleans indicating if inside string.
 *  Use `getStringParts`
 * @param searchValue {string} - Value to look for
 * @param replaceValue {string} - Value to replace with
 * @param replaceAll {boolean} - Replace all matches. Default false.
 * @return {string} - String with matches replaced outside of quotes
 */
function replaceOutsideQuotes(str, stringParts, searchValue, replaceValue, replaceAll = false) {
  let insideQuote = false;
  let searchIndex = 0;
  let tmpStr = str.split("");
  let index;

  do {
    index = str.indexOf(searchValue, searchIndex);

    if (index !== -1 && stringParts[index] && searchValue !== '"') {
      // The index fell as part of a quote, we should find the next match
      // Special case when replacing surrounding quotes
      insideQuote = true;
      searchIndex = index + 1;
    } else if (index !== -1) {
      insideQuote = false;
      tmpStr.splice(index, searchValue.length, ...replaceValue.split(""));
      searchIndex += searchValue.length - replaceValue.length;
      str = tmpStr.join("");
    }
  } while (index !== -1 && replaceAll);

  return tmpStr.join("");
}
