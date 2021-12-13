import { fhirConvert } from '../index.js';

if (process.argv.length === 2) {
  console.log('Usage:');
  console.log('\teasy-path-expressions var1 var2 "var1 + var2"\n');
  console.log('\tLast argument is the expression, all other arguments are interpreted as variables.\n')
} else {
  const args = process.argv.slice(2);
  const expression = args.pop();

  console.log(fhirConvert(expression, args));
}
