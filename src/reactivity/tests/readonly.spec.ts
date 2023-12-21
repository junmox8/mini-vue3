import { readonly } from "../reactive";

describe("readonly", () => {
  it("happy path", () => {
    const o = {
      age: 1,
    };
    const obj = readonly(o);
    expect(obj.age).toBe(1);
    expect(obj).not.toBe(o);
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
});
