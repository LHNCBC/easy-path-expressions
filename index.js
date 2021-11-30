/**
 * Full fhirconvert function: validates, converts, then identifies variables.
 * @param {string} str - inputted normal syntax expression
 * @param {Array} vars - array of usable variables entered by user
 * @returns converted fhirpath expression
 */
 export function fhirconvert(str, vars) {
  if (validate(str, vars)) {
    return varfind(convert(str), vars);
  } else {
    return null;
  }
}

// Array of usable operators
let ops = [
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
let funs = [
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
let funs2 = [
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
export function validate(str, vars) {
  // Operator Validation
  var len = str.length;
  var op = "";
  // Loop to identify operator strings
  for (var j = 0; j < len; j++) {
    // If operator char, append to op
    if (!(/[a-zA-Z0-9.,'"\s()\\-]/.test(str[j]))) {
      op = op + str[j];
      if (j == len - 1 || j == 0) {
        return false;
      }
    }
    // Checks operator if length > 1 and operator string ends
    else if (op.length > 0) {
      if (!(ops.includes(op))) {
        return false;
      }
      // Validates expression to left of operator
      var lsearch = true;
      var op_l = j - op.length - 1;
      while(lsearch) {
        if (!(/[\s]/.test(str[op_l]))) {
          if (!(/[a-zA-Z0-9.,'")\\-]/.test(str[op_l]))) {
            return false;
          }
          lsearch = false;
        } else {
          op_l -= 1;
        }
      }
      // Validates expression to right of operator
      var rsearch = true;
      var op_r = j;
      if (op_r > len - 1) {
        return false;
      }
      while(rsearch) {
        if (!(/[\s]/.test(str[op_r]))) {
          if (!(/[a-zA-Z0-9.'"(\\-]/.test(str[op_r]))) {
            return false;
          }
          rsearch = false;
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
  var lcount = 0;
  var rcount = 0;
  var substr = "";
  var instring = false;
  // Loop to checks parenthesis, identify non-operator strings and check strings
  for (var i = 0; i < len; i++) {
    instring = isinstring(str, i, instring);

    if (!instring) {
      if (str[i] == "(") {
        lcount += 1;
      }
      if (str[i] == ")") {
        rcount += 1;
      }
      if (rcount > lcount) {
        return false;
      }
      // If usable char, add to substring
      if (/[a-zA-Z0-9]/.test(str[i])) {
        substr = substr + str[i];
      }
      // Checks if substring is valid
      if ((str[i + 1] == null || !(/[[a-zA-Z0-9]/.test(str[i + 1])))) {
        if ((funs.includes(substr) && str[i + 1] == "(") || substr == "") {
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
  return (lcount == rcount) && !instring;
}

/**
 * Identifies convertable functions in expression and converts them recursively.
 * @param {string} str - inputted normal syntax expression
 * @returns expression with converted functions
 */
export function convert(str) {
  var count = 0;
  var stringminusquotes = getstringminusquotes(str);
  var stringparts = getstringparts(str);

  if (stringminusquotes.includes("^")) {
    var i = indexofoutsidequotes(str, stringparts, "^");
    var base = lfind(str, i);
    var power = rfind(str, i);
    str =
      str.slice(0, i - base.length) +
      base.trim() +
      ".power(" +
      power.trim() +
      ")" +
      str.slice(i + power.length + 1);
    count += 1;
  }
  if (stringminusquotes.includes("**")) {
    var i = indexofoutsidequotes(str, stringparts, "**");
    var base = lfind(str, i);
    var power = rfind(str, i+1);
    str =
      str.slice(0, i - base.length) +
      base.trim() +
      ".power(" +
      power.trim() +
      ")" +
      str.slice(i + power.length + 2);
    count += 1;
  }
  for (let f = 0; f < funs2.length; f++) {
    if (stringminusquotes.includes(funs2[f])) {
      if (str[indexofoutsidequotes(str, stringparts, funs2[f]) - 1] != ".") {
        str = funcappend(str, funs2[f]);
        count += 1;
      }
    }
  }
  if (stringminusquotes.includes("LOG")) {
    str = logappend(str, "LOG");
    count += 1;
  }
  if (stringminusquotes.includes("log")) {
    if (str[indexofoutsidequotes(str, stringparts, "log") - 1] != ".") {
      str = logappend(str, "log");
      count += 1;
    }
  }
  if (str.includes("OR")) {
    str = replaceoutsidequotes(str, stringparts, "OR", "or");
    count += 1;
  }
  if (str.includes("AND")) {
    str = replaceoutsidequotes(str, stringparts, "AND", "and");
    count += 1;
  }
  if (str.includes("||")) {
    str = replaceoutsidequotes(str, stringparts, "||", "or");
    count += 1;
  }
  if (str.includes("&&")) {
    str = replaceoutsidequotes(str, stringparts, "&&", "and");
    count += 1;
  }

  // Replace double quotes with single quotes
  str = replaceoutsidequotes(str, stringparts, '"', "'", true);

  if (count != 0) {
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
export function funcappend(str, func) {
  var i = str.indexOf(func);
  var j = i + func.length;
  var k = j;
  var eq = false;
  var open = 0;
  var close = 0;
  while (!eq) {
    if (str[k] == "(") {
      open += 1;
    }
    if (str[k] == ")") {
      close += 1;
    }

    if (open == close) {
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
 * Same as funcappend, but in LOG format
 * @param {string} str - inputted normal syntax expression
 * @param {string} func - "LOG" or "log"
 * @returns expression with converted log function
 */
export function logappend(str, func) {
  var stringparts = getstringparts(str);
  var i = indexofoutsidequotes(str, stringparts, func);
  var j = i + 3;
  var k = j;
  var cma = -1;
  var eq = false;
  var open = 0;
  var close = 0;

  while (!eq) {
    if (str[k] == "(") {
      open += 1;
    }
    if (str[k] == ")") {
      close += 1;
    }

    if (open == close + 1 && k != j && str[k] == ",") {
      cma = k;
    }
    if (open == close) {
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
export function lfind(str, i) {
  if (str[i - 1] != ")") {
    var search = true;
    var lstr = "";
    while (search) {
      if (i < 2) {
        search = false;
      }
      if (/[a-zA-Z0-9.-\s]/.test(str[i - 1])) {
        lstr = str[i - 1] + lstr;
        i -= 1;
      } else {
        search = false;
      }
    }
    return lstr;
  } else {
    var eq = false;
    var open = 0;
    var close = 0;
    var k = i - 1;

    while (!eq) {
      if (str[k] == "(") {
        open += 1;
      }
      if (str[k] == ")") {
        close += 1;
      }
      if (open == close) {
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
export function rfind(str, i) {
  if (str[i + 1] != "(") {
    var search = true;
    var rstr = "";
    while (search) {
      if (str[i + 2] == undefined) {
        search = false;
      }
      if (/[a-zA-Z0-9.\s()\\-]/.test(str[i + 1])) {
        rstr = rstr + str[i + 1];
        i += 1;
      } else {
        search = false;
      }
    }
    return rstr;
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
export function varfind(str, vars) {
  var end = false;
  var i = 0;
  var j = 0;
  var v = "";
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
 * @param instring {boolean} - current status for in string
 * @return {boolean} - in string
 */
function isinstring(str, i, instring) {
  var isquote = str[i] == "'" || str[i] =='"';

  if (isquote && !instring) {
    // Check for quote start
    return true;
  } else if (isquote && instring &&
      ((i == 0) || (i > 0 && str[i - 1] != '\\'))) {
    // Check for quote end unless the quote is escaped
    return false;
  } else {
    return instring;
  }
}

/**
 * Get the parts of the string which are quotes
 * @param str - String to check
 * @return Array of booleans representing if position is part of quotes (which
 *  should not be processed)
 */
function getstringparts(str) {
  var parts = [];
  var instring = false;

  for (var i = 0; i < str.length; i++) {
    instring = isinstring(str, i, instring);

    parts.push(instring);
  }

  return parts;
}

/**
 * Get only the parts of the string which do are not quotes
 * @param str {string} - String to process
 * @return {string} - String without quotes
 */
function getstringminusquotes(str) {
  var parts = [];
  var instring = false;

  for (var i = 0; i < str.length; i++) {
    instring = isinstring(str, i, instring);

    if (!instring) {
      parts.push(str[i]);
    }
  }

  return parts.join('');
}

/**
 * Get the index for the search value but ignore quotes
 * @param str {string} - String to search
 * @param stringparts - Array of booleans indicating if inside string.
 *  Use `getstringparts`
 * @param value {string} - Value to look for
 * @return {number} - Index of match, -1 if none (not including quotes)
 */
function indexofoutsidequotes(str, stringparts, value) {
  var insidequote = false;
  var searchindex = 0;

  do {
    var index = str.indexOf(value, searchindex);

    if (index !== -1 && stringparts[index]) {
      // The index fell as part of a quote, we should find the next match
      insidequote = true;
      searchindex = index + 1;
    } else {
      insidequote = false;
    }
  } while (index !== -1 && insidequote);

  return index;
}

/**
 * Replace values not inside quotes
 * @param str {string} - String to search
 * @param stringparts - Array of booleans indicating if inside string.
 *  Use `getstringparts`
 * @param searchvalue {string} - Value to look for
 * @param replacevalue {string} - Value to replace with
 * @param replaceall {boolean} - Replace all matches. Default false.
 * @return {string} - String with matches replaced outside of quotes
 */
function replaceoutsidequotes(str, stringparts, searchvalue, replacevalue, replaceall = false) {
  var insidequote = false;
  var searchindex = 0;
  var tmpstr = str.split('');

  do {
    var index = str.indexOf(searchvalue, searchindex);

    if (index !== -1 && stringparts[index] && searchvalue !== '"') {
      // The index fell as part of a quote, we should find the next match
      // Special case when replacing surrounding quotes
      insidequote = true;
      searchindex = index + 1;
    } else if (index !== -1) {
      insidequote = false;
      tmpstr.splice(index, searchvalue.length, ...replacevalue.split(''));
      searchindex += searchvalue.length - replacevalue.length;
      str = tmpstr.join('');
    }
  } while (index !== -1 && replaceall);

  return tmpstr.join('');
}
