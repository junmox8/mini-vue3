import { ref, isRef } from "../ref";
import { effect } from "../effect";
import { reactive } from "../reactive";

describe("ref", () => {
  it("happy path", () => {
    const a = ref(1);
    expect(a.value).toBe(1);
  });
  it("reactivity", () => {
    const a = ref(1);
    let dummy;
    let callNum = 0;
    effect(() => {
      callNum++;
      dummy = a.value;
    });
    expect(callNum).toBe(1);
    expect(dummy).toBe(1);
    a.value = 2;
    expect(callNum).toBe(2);
    expect(dummy).toBe(2);
    a.value = 2;
    expect(callNum).toBe(2);
    expect(dummy).toBe(2);
  });
  it("ref传值为对象", () => {
    const a = ref({
      count: 1,
    });
    let dummy;
    effect(() => {
      dummy = a.value.count;
    });
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2);
  });
  it("isRef", () => {
    const a = ref(1);
    const b = reactive({ a: 1 });
    expect(isRef(a)).toBe(true);
    expect(isRef(b)).toBe(false);
    expect(1).toBe(false);
  });
});
