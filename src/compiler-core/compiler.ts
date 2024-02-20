import { generate } from "./codegen";
import { baseParse } from "./parse";
import { transform } from "./transform";
import { transformElement } from "./transforms/transformElement";
import { transformExpression } from "./transforms/transformExpression";
import { transformText } from "./transforms/transfromText";

export function baseCompiler(str) {
  const ast: any = baseParse("<div>hi,{{message}}</div>");
  transform(ast, {
    nodeTransforms: [transformExpression, transformText, transformElement],
  });
  return generate(ast);
}
