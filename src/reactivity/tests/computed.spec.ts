import { computed } from "../computed";
import { ref } from "../ref";
import { reactive } from "../reactive";
describe("computed", () => {
  it("happy path", () => {
    const a = ref(1);
    const c = computed(() => a.value);
    expect(c.value).toBe(1);
  });
  it("lazy", () => {
    const obj = reactive({
      a: 1,
    });
    const getter = jest.fn(() => obj.a);
    const c = computed(getter);
    expect(getter).toHaveBeenCalledTimes(0);

    expect(c.value).toBe(1);
    expect(getter).toHaveBeenCalledTimes(1);

    c.value;
    expect(getter).toHaveBeenCalledTimes(1);

    obj.a = 2;
    expect(getter).toHaveBeenCalledTimes(1);
    expect(c.value).toBe(2);
    expect(getter).toHaveBeenCalledTimes(2);
  });
});
