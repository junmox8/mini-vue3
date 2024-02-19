import { baseParse } from "../parse";
import { generate } from "../codegen";
import { transform } from "../transform";
import { transformExpression } from "../transforms/transformExpression";
import { transformElement } from "../transforms/transformElement";
import { transformText } from "../transforms/transfromText";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");
    transform(ast);
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });

  it("interpolation", () => {
    const ast = baseParse("{{message}}");
    transform(ast, {
      nodeTransforms: [transformExpression],
    });
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });

  it("element", () => {
    const ast: any = baseParse("<div>hi,{{message}}</div>");
    transform(ast, {
      nodeTransforms: [transformElement, transformExpression, transformText],
    });
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
});
