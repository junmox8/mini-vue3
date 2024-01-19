import { ref, isRef, unRef, proxyRef } from "../ref";
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
    expect(isRef(1)).toBe(false);
  });
  it("unRef", () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1);
    expect(unRef(1)).toBe(1);
  });
  it("proxyRef", () => {
    const obj = {
      a: 1,
      b: ref(2),
    };
    const proxy = proxyRef(obj);
    expect(proxy.a).toBe(1);
    expect(proxy.b).toBe(2);

    proxy.b = 3;
    expect(proxy.b).toBe(3);
    expect(obj.b.value).toBe(3);

    proxy.b = ref(1);
    expect(proxy.b).toBe(1);
    expect(obj.b.value).toBe(1);
  });
});
