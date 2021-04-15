import * as fhir from "../index.js";
import chai from "chai";
let expect = chai.expect;

let vars = ["a", "b", "c", "d", "e"];
let vars2 = ["Patient", "HeartRate", "Age"];
let vars3 = ["Patient1", "HeartRate2", "Age3"];

describe("#fhirconvert()", function () {
  context("Exponent", function () {
    it("2 vars", function () {
      expect(fhir.fhirconvert("a^b", vars)).to.equal("%a.power(%b)");
    });
    it("1 var v1", function () {
      expect(fhir.fhirconvert("a^3", vars)).to.equal("%a.power(3)");
    });
    it("1 var v2", function () {
      expect(fhir.fhirconvert("3^a", vars)).to.equal("3.power(%a)");
    });
    it("2 nums", function () {
      expect(fhir.fhirconvert("3^3", vars)).to.equal("3.power(3)");
    });
    it("Decimals", function () {
      expect(fhir.fhirconvert("3.3^4.2", vars)).to.equal("3.3.power(4.2)");
    });
    it("Parenthesis", function () {
      expect(fhir.fhirconvert("(a+b)^(3+4)", vars)).to.equal("(%a+%b).power((3+4))");
    });
    it("Negative", function () {
      expect(fhir.fhirconvert("-a^-3.3", vars)).to.equal("-%a.power(-3.3)");
    });
    it("**", function () {
      expect(fhir.fhirconvert("a**b", vars)).to.equal("%a.power(%b)");
    });
    it("** Exp", function () {
      expect(fhir.fhirconvert("(a+b)  ** LN(c)", vars)).to.equal("(%a+%b).power((%c).ln())");
    });
    it("^ Exp", function () {
      expect(fhir.fhirconvert("(a+b)  ^ LN(c)", vars)).to.equal("(%a+%b).power((%c).ln())");
    });
  });

  context("Functions", function () {
    it("CEILING", function () {
      expect(fhir.fhirconvert("CEILING(a)", vars)).to.equal("(%a).ceiling()");
    });
    it("CEILING Exp", function () {
      expect(fhir.fhirconvert("CEILING(a+b*3)", vars)).to.equal(
        "(%a+%b*3).ceiling()"
      );
    });
    it("FLOOR", function () {
      expect(fhir.fhirconvert("FLOOR(a)", vars)).to.equal("(%a).floor()");
    });
    it("FLOOR Exp", function () {
      expect(fhir.fhirconvert("FLOOR(a+b*3)", vars)).to.equal(
        "(%a+%b*3).floor()"
      );
    });
    it("ABS", function () {
      expect(fhir.fhirconvert("ABS(a)", vars)).to.equal("(%a).abs()");
    });
    it("ABS Exp", function () {
      expect(fhir.fhirconvert("ABS(a+b*3)", vars)).to.equal(
        "(%a+%b*3).abs()"
      );
    });
    it("SQRT", function () {
      expect(fhir.fhirconvert("SQRT(a)", vars)).to.equal("(%a).sqrt()");
    });
    it("SQRT Exp", function () {
      expect(fhir.fhirconvert("SQRT(a+b*3)", vars)).to.equal(
        "(%a+%b*3).sqrt()"
      );
    });
    it("TRUNCATE", function () {
      expect(fhir.fhirconvert("TRUNCATE(a)", vars)).to.equal(
        "(%a).truncate()"
      );
    });
    it("TRUNCATE Exp", function () {
      expect(fhir.fhirconvert("TRUNCATE(a+b*3)", vars)).to.equal(
        "(%a+%b*3).truncate()"
      );
    });
    it("EXP", function () {
      expect(fhir.fhirconvert("EXP(a)", vars)).to.equal("(%a).exp()");
    });
    it("EXP Exp", function () {
      expect(fhir.fhirconvert("EXP(a+b*3)", vars)).to.equal(
        "(%a+%b*3).exp()"
      );
    });
    it("LN", function () {
      expect(fhir.fhirconvert("LN(a)", vars)).to.equal("(%a).ln()");
    });
    it("LN Exp", function () {
      expect(fhir.fhirconvert("LN(a+b*3)", vars)).to.equal("(%a+%b*3).ln()");
    });
    it("LOG", function () {
      expect(fhir.fhirconvert("LOG(a, b)", vars)).to.equal("(%b).log(%a)");
    });
    it("LOG Exp", function () {
      expect(fhir.fhirconvert("LOG(a+c, a+b*3)", vars)).to.equal(
        "(%a+%b*3).log(%a+%c)"
      );
    });
  });

  context("Nested Functions", function () {
    it("Nested 1", function () {
      expect(fhir.fhirconvert("CEILING(FLOOR(ABS(a+b*3)))", vars)).to.equal(
        "(((%a+%b*3).abs()).floor()).ceiling()"
      );
    });
    it("Nested 2", function () {
      expect(fhir.fhirconvert("CEILING(LOG(2, ABS(a+b*3)))", vars)).to.equal(
        "(((%a+%b*3).abs()).log(2)).ceiling()"
      );
    });
  });

  context("Validation", function () {
    it("Non var", function () {
      expect(fhir.fhirconvert("a+b+z", vars)).to.equal(null);
    });
    it("Non func", function () {
      expect(fhir.fhirconvert("NOTAFUNCTION(a+b)", vars)).to.equal(null);
    });
    it("Non op", function () {
      expect(fhir.fhirconvert("a$b", vars)).to.equal(null);
    });
    it("Op invalid", function () {
      expect(fhir.fhirconvert("a++b", vars)).to.equal(null);
    });
    it("Op invalid 2", function () {
      expect(fhir.fhirconvert("Patient#HeartRate", vars2)).to.equal(null);
    });
    it("Op invalid 3", function () {
      expect(fhir.fhirconvert("#", vars2)).to.equal(null);
    });
    it("Op invalid 4", function () {
      expect(fhir.fhirconvert("+583", vars2)).to.equal(null);
    });
    it("Op invalid 5", function () {
      expect(fhir.fhirconvert("a+", vars)).to.equal(null);
    });
    it("Parenthesis", function () {
      expect(fhir.fhirconvert(")(a+b)", vars)).to.equal(null);
    });
    it("Parenthesis 2", function () {
      expect(fhir.fhirconvert("CEILING(ABS(a+b)", vars)).to.equal(null);
    });
    it("Full Exp", function () {
      expect(fhir.fhirconvert("CEILING(a+b) ** ABS(c^)", vars)).to.equal(null);
    });
    it("Full Exp 2", function () {
      expect(fhir.fhirconvert("CEILING(a+b) ** ABS(c^2)", vars)).to.equal(("(%a+%b).ceiling().power((%c.power(2)).abs())"));
    });
    it("Full Exp 3", function () {
      expect(fhir.fhirconvert("25+CEILING(a+b)**ABS(c^2)", vars)).to.equal(("25+(%a+%b).ceiling().power((%c.power(2)).abs())"));
    });
    it("fun as op test", function () {
      expect(fhir.fhirconvert("a NOT b", vars)).to.equal((null));
    });
  });

  context("Operators", function () {
    it("and", function () {
      expect(fhir.fhirconvert("a and b", vars)).to.equal("%a and %b");
    });
    it("and 2", function () {
      expect(fhir.fhirconvert("(a < 3) and b", vars)).to.equal("(%a < 3) and %b");
    });
    it("or", function () {
      expect(fhir.fhirconvert("a or b", vars)).to.equal("%a or %b");
    });
    it("equals", function () {
      expect(fhir.fhirconvert("a = b", vars)).to.equal("%a = %b");
    });
    it("not equals", function () {
      expect(fhir.fhirconvert("a != b", vars)).to.equal("%a != %b");
    });
    it("or convert", function () {
      expect(fhir.fhirconvert("a || b", vars)).to.equal("%a or %b");
    });
    it("and convert", function () {
      expect(fhir.fhirconvert("a && b", vars)).to.equal("%a and %b");
    });
    it("not", function () {
      expect(fhir.fhirconvert("NOT(a)", vars)).to.equal("(%a).not()");
    });
  });

  context("Variables 2", function () {
    it("String vars", function () {
      expect(fhir.fhirconvert("Patient + Age", vars2)).to.equal("%Patient + %Age");
    });
    it("String vars 2", function () {
      expect(fhir.fhirconvert("Patient^Age", vars2)).to.equal("%Patient.power(%Age)");
    });
    it("String vars 3", function () {
      expect(fhir.fhirconvert("Patient**Age", vars2)).to.equal("%Patient.power(%Age)");
    });
    it("String vars 4", function () {
      expect(fhir.fhirconvert("ABS(FLOOR(Patient^(Age+HeartRate)))", vars2)).to.equal("((%Patient.power((%Age+%HeartRate))).floor()).abs()");
    });
    it("String vars3 1", function () {
      expect(fhir.fhirconvert("Patient1 + Age3", vars3)).to.equal("%Patient1 + %Age3");
    });
  });
});
