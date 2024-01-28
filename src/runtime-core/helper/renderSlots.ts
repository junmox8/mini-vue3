import { createVNode } from "../vnode";
export function renderSlots(slots, name, props = {}) {
  //这里的slots一定是数组，在initSlot中进行了处理
  if (slots[name]) {
    if (typeof slots[name] === "function") {
      return createVNode("div", slots[name](props), {});
    }
    return createVNode("div", slots[name], {});
  }
}
