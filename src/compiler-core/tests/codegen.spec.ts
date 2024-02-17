import { baseParse } from "../parse";
import { generate } from "../codegen";
import { transform } from "../transform";

describe("codegen", () => {
  it("string", () => {
    const ast = baseParse("hi");
    transform(ast);
    const { code } = generate(ast);
    expect(code).toMatchSnapshot();
  });
});
