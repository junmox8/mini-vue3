import { reactive, isReactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = { a: 1 };
    const obj = reactive(original);
    expect(obj).not.toBe(original);
    expect(obj.a).toBe(1);
  });
  it("isReactive", () => {
    const o = {
      age: 1,
    };
    const obj = reactive(o);
    expect(isReactive(obj)).toBe(true);
  });
  it("嵌套reactive", () => {
    const obj = reactive({
      a: 1,
      b: [1, 2],
      c: {
        a: 1,
        b: [1, 2],
      },
    });
    expect(isReactive(obj)).toBe(true);
    expect(isReactive(obj.c)).toBe(true);
    expect(isReactive(obj.c.b)).toBe(true);
  });
});
