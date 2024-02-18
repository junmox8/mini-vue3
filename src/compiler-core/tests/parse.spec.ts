import { baseParse } from "../parse";
import { NodeTypes } from "../ast";
describe("parse", () => {
  describe("interpolation", () => {
    it("simple interpolation", () => {
      const ast = baseParse("{{ message }}");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: "message",
        },
      });
    });
  });

  describe("element", () => {
    it("element div", () => {
      const ast = baseParse("<div></div>");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
        children: [],
      });
    });
  });

  describe("text", () => {
    it("simple text", () => {
      const ast = baseParse("some text");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: "some text",
      });
    });
  });

  describe("联合类型", () => {
    it("case 1", () => {
      const ast = baseParse("<p>hi,{{message}}</p>");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "p",
        children: [
          {
            type: NodeTypes.TEXT,
            content: "hi,",
          },
          {
            type: NodeTypes.INTERPOLATION,
            content: {
              type: NodeTypes.SIMPLE_EXPRESSION,
              content: "message",
            },
          },
        ],
      });
    });

    it("case 2", () => {
      const ast = baseParse("<div><p>hi</p>{{message}}</div>");
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: "div",
        children: [
          {
            type: NodeTypes.ELEMENT,
            tag: "p",
            children: [
              {
                type: NodeTypes.TEXT,
                content: "hi",
              },
            ],
          },
          {
            type: NodeTypes.INTERPOLATION,
            content: {
              type: NodeTypes.SIMPLE_EXPRESSION,
              content: "message",
            },
          },
        ],
      });
    });

    it("case 3", () => {
      expect(() => {
        baseParse("<div><span></div>");
      }).toThrow("缺少结束标签:span");
    });
  });
});
