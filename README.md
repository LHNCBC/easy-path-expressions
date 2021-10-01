# Easy Path Expressions

Easy-path-expressions is a syntax parser that converts basic mathematical
expressions into FHIRPath notation. 

# Local Installation

```bash
npm install
```

To test that easy-path-expressions is working correctly:

```bash
npm test
```

# Usage

```javascript
import * as easyPathExpressions from 'easy-path-expressions';
easyPathExpressions.fhirconvert("(a+b)^2", [a, b]); // returns ($a+$b).power(2)
easyPathExpressions.fhirconvert("CEILING(a*b)", [a, b]); // returns ($a*$b).ceiling()
```

***fhirconvert*** is the main function of easy-path-expressions, which validates and converts an
inputted expression to fhirpath. fhirconvert will also return null if the expression fails validation.


fhirconvert takes in two inputs: the mathematical expression for conversion and 
an array of usable variables. The format is as follows:

```javascript
fhirconvert([expression], [vars])
```

Basic syntax expressions utilize traditional operators and function statements.
Expressions can be written using variable names, mathematical operators, and various
functions. The syntax guide is bellow.

# Syntax Guide

***USABLE OPERATORS:*** +, -, *, /, ^, **, !=, !~, >=, <=, =, &&, ||, xor, and, or, implies

***USABLE FUNCTIONS:***
CEILING(), FLOOR(), ABS(), LOG(), TRUNCATE(), EXP(), SQRT(), LN(), NOT()  
* Usage: CEILING([expression]), FLOOR([expression]), etc.

LOG()  
* Usage: LOG([Base], [Value])
    
***USABLE VARIABLES:***
Any string of letters and numbers differing from the aforementioned functions.

***EXAMPLE EXPRESSIONS (vars: [a, b, c]):***
2+2
(a+b)^3
CEILING(LOG(2, 17))
TRUNCATE(ABS(-3.3)) + SQRT(LN(a+b+c))

# EXAMPLE OUTPUTS:

INPUT: fhirconvert("2+2", [a, b, c, d])
OUTPUT: "2+2"

INPUT: fhirconvert("(a+b)^3", [a, b, c, d])
OUTPUT: "((%a+%b).power(3))"

INPUT: fhirconvert("CEILING(LOG(2, 17))", [a, b, c, d])
OUTPUT: "((17.log(2)).ceiling())"

INPUT: fhirconvert("TRUNCATE(ABS(-3.3))+SQRT(LN(a+b+c))", [a, b, c, d])
OUTPUT: "((-3.3).abs()).truncate()+((%a+%b+%c).ln()).sqrt()"
