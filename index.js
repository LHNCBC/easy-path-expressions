module.exports.fhirconvert = function(str) {
    if (validate(str)){
        return varfind(convert(str));
    }
    else {
        return null;
    }

    function validate(str) {
        var vars = ["a", "b" ,"c", "d"];
        var funs = ["CEILING", "FLOOR", "ABS", "LOG", "TRUNCATE", "EXP", "SQRT", "LN"];
        var lcount = 0;
        var rcount = 0;
        var len = str.length;
        var func = "";
        for (i=0; i<len; i++) {
            if (str[i] = "(") {
                lcount += 1;
            }
            if (str[i] = ")") {
                rcount += 1;
            }
    
            if (((/[a-z]/).test(str[i]))) {
                if (!(/[a-zA-Z]/).test(str[i-1]) && !(/[a-zA-Z]/).test(str[i-1])) {
                    if(!vars.includes(str[i])) {
                        return false;
                    }
                }
            }
            if ((/[A-Z]/).test(str[i])) {
                func = func + str[i];
            }
            else {
                if (funs.includes(func) || func == "") {
                    func = "";
                }
                else {
                    return false;
                }
            }
        }
    
        return (lcount == rcount);
    }
    
    // converts to normal exp to fhirpath exp
    function convert(str) {
        var count = 0;
        if (str.includes("^")) {
            var i = str.indexOf("^");
            var base = lfind(str, i);
            var power = rfind(str, i);
            str = str.slice(0, i-base.length) + "(" + base + ".power(" + power + ")" + ")" + str.slice(i+power.length+1);
            count += 1;
        }
        if (str.includes("CEILING")) {
            str = funcappend(str, "CEILING");
            count += 1;
        }
        if (str.includes("FLOOR")) {
            str = funcappend(str, "FLOOR");
            count += 1;
        }
        if (str.includes("ABS")) {
            str = funcappend(str, "ABS");
            count += 1;
        }
        if (str.includes("SQRT")) {
            str = funcappend(str, "SQRT");
            count += 1;
        }
        if (str.includes("TRUNCATE")) {
            str = funcappend(str, "TRUNCATE");
            count += 1;
        }
        if (str.includes("EXP")) {
            str = funcappend(str, "EXP");
            count += 1;
        }
        if (str.includes("LN")) {
            str = funcappend(str, "LN");
            count += 1;
        }
        if (str.includes("LOG")) {
            str = logappend(str);
            count += 1;
        }
        if (count != 0) {
            return convert(str);
        }
        else {
            return str;
        }
    }
    
    function funcappend(str, func){
        var i = str.indexOf(func);
        var j = i + func.length;
        var k = j;
        var eq = false;
        var open = 0;
        var close = 0;
        while(!eq) {
            if (str[k] == "(") {
                open += 1;
            }
            if (str[k] == ")") {
                close += 1;
            }
    
            if (open == close) {
                eq = true;
            }
            else {
                k += 1;
            }
        }
        return "(" + str.slice(0, i).trim() + str.slice(j, k+1).trim() + "." + func.toLowerCase() + "()" + ")" + str.slice(k+1).trim();
    }
    
    function logappend(str){
        var i = str.indexOf("LOG");
        var j = i + 3;
        var k = j;
        var cma = -1;
        var eq = false;
        var open = 0;
        var close = 0;
    
        while(!eq) {
            if (str[k] == "(") {
                open += 1;
            }
            if (str[k] == ")") {
                close += 1;
            }
    
            if (open == (close + 1) && k != j && str[k] == ","){
                cma = k;
            }
            if (open == close) {
                eq = true;
            }
            else {
                k += 1;
            }
        }
    
        return str.slice(0, i).trim() + str.slice(cma + 1, k).trim() + ".log(" + str.slice(j+1, cma).trim() + ")" + str.slice(k+1).trim();
    }
    
    function lfind(str, i) {
        if (str[i-1] != ")") {
            end = true;
            lstr = "";
            while(end) {
                if(str[i-2] == undefined){
                    end = false; 
                }
                if((/[a-z]|[0-9]|[.]|[-]/).test(str[i-1])) {
                    lstr = str[i-1] + lstr;
                    i -= 1;
                }
                else {
                    end = false;
                }
            }
            return lstr;
        }
        else {
            var eq = false;
            var open = 0;
            var close = 0;
            var k = i-1;
        
            while(!eq) {
                if (str[k] == "(") {
                    open += 1;
                }
                if (str[k] == ")") {
                    close += 1;
                }
                if (open == close) {
                    eq = true;
                }
                else {
                    k -= 1;
                }
            }
            return str.slice(k, i);
        }
    }
    
    function rfind(str, i) {
        if (str[i+1] != "(") {
            end = true;
            rstr = "";
            while(end) {
                if(str[i+2] == undefined){
                    end = false; 
                }
                if((/[a-z]|[0-9]|[.]|[-]/).test(str[i+1])) {
                    rstr = rstr + str[i+1];
                    i += 1;
                }
                else {
                    end = false;
                }
            }
            return rstr;
        }
        else {
            return str.slice(i+1, str.slice(i).indexOf(")")+i+1);
        }
    }
    
    function varfind(str) {
        var vars = ["a", "b" ,"c", "d"];
        var funs = ["CEILING", "FLOOR", "ABS", "LOG", "TRUNCATE", "EXP", "SQRT", "LN"];
        var end = false;
        var i = 0;
        while(!end) {
            if (vars.includes(str[i])) {
                if (!((/[a-zA-Z]/).test(str[i+1])) || str[i+1] == null) {
                    str = str.slice(0, i) + "%" + str[i] + str.slice(i+1);
                    i += 1;               
                }
            }
            i += 1;
            if (str[i] == null) {
                end = true;
            }
        }
        return str;
    }
    
  }