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
  it("effect返回值", () => {
    let value = 0;
    const runner = effect(() => {
      value++;
      return value;
    });
    expect(value).toBe(1);
    const test = runner();
    expect(value).toBe(2);
    expect(test).toBe(value);
  });
  it("schedule", () => {
    let dummy;
    let run;
    const schedule = jest.fn(() => {
      run = fn;
    });
    const obj = reactive({
      age: 0,
    });
    const fn = effect(
      () => {
        dummy = obj.age + 1;
      },
      { schedule }
    );
    expect(schedule).not.toHaveBeenCalled();
    expect(dummy).toBe(1);

    obj.age++;
    expect(dummy).toBe(1);
    expect(schedule).toHaveBeenCalledTimes(1);

    run();
    expect(dummy).toBe(2);
  });
});
