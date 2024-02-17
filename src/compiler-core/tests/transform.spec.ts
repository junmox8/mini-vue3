/*
 * @Author: root 931097192@qq.com
 * @Date: 2024-02-16 16:26:20
 * @LastEditors: root 931097192@qq.com
 * @LastEditTime: 2024-02-17 14:33:44
 * @FilePath: \writing-vue3\src\compiler-core\tests\transform.spec.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { NodeTypes } from "../ast";
import { baseParse } from "../parse";
import { transform } from "../transform";
describe("transform", () => {
  it("case 1", () => {
    const ast = baseParse("<div>hi,{{message}}</div>");
    const plugin = (node) => {
      if (node.type === NodeTypes.TEXT) {
        node.content += "mini-vue";
      }
    };
    transform(ast, {
      nodeTransforms: [plugin],
    });
    const nodeText = ast.children[0].children[0];
    expect(nodeText.content).toBe("hi,mini-vue");
  });
});
