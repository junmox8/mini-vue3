import { reactive } from "../reactive";

describe("reactive", () => {
  it("happy path", () => {
    const original = { a: 1 };
    const obj = reactive(original);
    expect(obj).not.toBe(original);
    expect(obj.a).toBe(1);
  });
});
