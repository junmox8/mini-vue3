import { readonly, isReadonly, shallowReadonly, isProxy } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const o = {
      age: 1,
    };
    const obj = readonly(o);
    expect(obj.age).toBe(1);
    expect(obj).not.toBe(o);
    expect(isProxy(obj)).toBe(true);
  });
  it("warning when set value", () => {
    console.warn = jest.fn();
    const o = {
      age: 1,
    };
    const obj = readonly(o);
    obj.age = 2;
    expect(console.warn).toHaveBeenCalled();
  });
  it("isReadonly", () => {
    const o = {
      age: 1,
    };
    const obj = readonly(o);
    expect(isReadonly(obj)).toBe(true);
  });
  it("嵌套readOnly", () => {
    const obj = readonly({
      a: 1,
      b: [1, 2],
      c: {
        a: 1,
        b: [1, 2],
      },
    });
    expect(isReadonly(obj)).toBe(true);
    expect(isReadonly(obj.c)).toBe(true);
    expect(isReadonly(obj.c.b)).toBe(true);
  });
  it("shallowReadonly", () => {
    const obj = shallowReadonly({ a: 1 });
    expect(isReadonly(obj)).toBe(true);
    expect(isReadonly(obj.a)).toBe(false);
  });
  it("isProxy", () => {
    const obj = readonly({ a: 1 });
    expect(isProxy(obj)).toBe(true);
  });
});
