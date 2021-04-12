js-to-fhirpath is a syntax parser that converts normal mathematical expressions
into FHIRpath notation. 

USAGE

Normal syntax expressions utilize traditional operators and function statements.
Expressions can be written using variable names, mathematical operators, and various
functions. 

In addition to passing in the expression, an array of usable variables must
also be passed as a parameter.

USABLE OPERATORS: +, -, *, /, ^, **
USABLE FUNCTIONS: 
CEILING(), FLOOR(), ABS(), LOG(), TRUNCATE(), EXP(), SQRT(), LN()
    -Usage: CEILING([expression]), FLOOR([expression])
LOG()
    -Usage: LOG([Base], [Value])
USABLE VARIABLES: Any string of letters and numbers differing from the aforementioned functions.

EXAMPLE EXPRESSIONS:
2+2
(a+b)^3
CEILING(LOG(2, 17))
TRUNCATE(ABS(-3.3)) + SQRT(LN(a+b+c))

The function fhirconvert takes an inputted normal expression as a string
and converts it into FHIRpath syntax. This also includes validating variable and 
functions usage and prefixing all variables with "%". 

It is used in the following format: fhirconvert([expression], [vars])
Where the expression is a String in normal syntax and vars is an array
of usable variables. It returns a string representing a converted
FHIRpath expression.

fhirconvert will return null if the expression fails validation.

EXAMPLE EXPRESSION OUTPUTS:

INPUT: fhirconvert("2+2", [a, b, c, d])
OUTPUT: "2+2"

INPUT: fhirconvert("(a+b)^3", [a, b, c, d])
OUTPUT: "((%a+%b).power(3))"

INPUT: fhirconvert("CEILING(LOG(2, 17))", [a, b, c, d])
OUTPUT: "((17.log(2)).ceiling())"

INPUT: fhirconvert("TRUNCATE(ABS(-3.3))+SQRT(LN(a+b+c))", [a, b, c, d])
OUTPUT: "((-3.3).abs()).truncate()+((%a+%b+%c).ln()).sqrt()"
