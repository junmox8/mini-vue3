import { reactive } from "../reactive";
import { effect, stop } from "../effect";
describe("effect", () => {
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

    //使用jest.fn创建模拟函数,方便搜集函数相关信息,如:参数,调用次数等。
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
  it("stop", () => {
    const obj = reactive({
      age: 0,
    });
    let dummy;
    const fn = effect(() => {
      dummy = obj.age + 1;
    });
    expect(dummy).toBe(1);
    stop(fn);
    obj.age = 3;
    expect(dummy).toBe(1);
    fn();
    expect(dummy).toBe(4);
  });
  it("opStop", () => {
    const obj = reactive({
      age: 0,
    });
    let dummy;
    const onStop = jest.fn(() => {
      console.log("我被调用了");
    });
    const fn = effect(
      () => {
        dummy = obj.age + 1;
      },
      {
        onStop,
      }
    );
    expect(dummy).toBe(1);
    stop(fn);
    obj.age = 3;
    expect(dummy).toBe(1);
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});
