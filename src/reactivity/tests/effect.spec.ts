import { reactive } from "../reactive";
import { effect } from "../effect";
describe("test", () => {
  it("happy path", () => {
    const obj = reactive({ age: 1 });
    let value = 0;
    effect(() => {
      value = obj.age + 1;
    });
    expect(value).toBe(2);

    obj.age++;
    expect(value).toBe(3);
  });
});
