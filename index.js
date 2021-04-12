/**
 * Full fhirconvert function: validates, converts, then identifies variables.
 * @param {string} str - inputted normal syntax expression
 * @param {Array} vars - array of usable variables entered by user
 * @returns converted fhirpath expression
 */
 export function fhirconvert(str, vars) {
  if (validate(str, vars)) {
    return varfind(convert(str.trim()), vars);
  } else {
    return null;
  }
}

/**
 * Verifies normal syntax by confirming var names, function names,
 * syntax, and number of parenthesis.
 * @param {string} str - inputted normal syntax expression
 * @param {Array} vars - array of usable variables
 * @returns boolean, valid or invalid
 */
export function validate(str, vars) {
  var len = str.length;
  let funs = [
    "CEILING",
    "FLOOR",
    "ABS",
    "TRUNCATE",
    "EXP",
    "SQRT",
    "LN",
    "LOG",
    "ceiling",
    "floor",
    "abs",
    "truncate",
    "exp",
    "sqrt",
    "ln",
    "log"
  ];
  var lcount = 0;
  var rcount = 0;
  var substr = "";
  for (var i = 0; i < len; i++) {
    if (str[i] == "(") {
      lcount += 1;
    }
    if (str[i] == ")") {
      rcount += 1;
    }
    if (rcount > lcount) {
      return false;
    }
    if (/[a-z]|[A-Z]/.test(str[i])) {
      substr = substr + str[i];
    }
    if (str[i + 1] == null || !/[a-zA-Z]/.test(str[i + 1])) {
      if (funs.includes(substr) || vars.includes(substr) || substr == "") {
        substr = "";
      } else {
        return false;
      }
    }
  }
  return lcount == rcount;
}

/**
 * Identifies convertable functions in expression and converts them recursively.
 * @param {string} str - inputted normal syntax expression
 * @returns expression with converted functions
 */
export function convert(str) {
  let funs = [
    "CEILING",
    "FLOOR",
    "ABS",
    "TRUNCATE",
    "EXP",
    "SQRT",
    "LN",
    "ceiling",
    "floor",
    "abs",
    "truncate",
    "exp",
    "sqrt",
    "ln"
  ];
  var count = 0;
  if (str.includes("^")) {
    var i = str.indexOf("^");
    var base = lfind(str, i);
    var power = rfind(str, i);
    str =
      str.slice(0, i - base.length) +
      base +
      ".power(" +
      power +
      ")" +
      str.slice(i + power.length + 1);
    count += 1;
  }
  if (str.includes("**")) {
    var i = str.indexOf("**");
    var base = lfind(str, i);
    var power = rfind(str, i+1);
    str =
      str.slice(0, i - base.length) +
      base +
      ".power(" +
      power +
      ")" +
      str.slice(i + power.length + 2);
    count += 1;
  }
  for (let f = 0; f < funs.length; f++) {
    if (str.includes(funs[f])) {
      if (str[str.indexOf(funs[f]) - 1] != ".") {
        str = funcappend(str, funs[f]);
        count += 1;
      }
    }
  }
  if (str.includes("LOG")) {
    str = logappend(str, "LOG");
    count += 1;
  }
  if (str.includes("log")) {
    if (str[str.indexOf("log") - 1] != ".") {
      str = logappend(str, "log");
      count += 1;
    }
  }
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
  var i = str.indexOf(func);
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
      if (/[a-z]|[A-Z]|[0-9]|[.]|[-]/.test(str[i - 1])) {
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
      if (/[a-z]|[A-Z]|[0-9]|[.]|[-]/.test(str[i + 1])) {
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
      if (/[a-z]|[A-Z]|[0-9]/.test(str[i])) {
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
