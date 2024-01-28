import { ShapeFlags } from "./ShapeFlags";
export function initSlot(instance, children) {
  const { vnode } = instance;
  const slots = {};
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    for (const key in children) {
      const val = children[key];
      slots[key] = (props) => formatValue(val(props));
    }
  }
  instance.slots = slots;
}

function formatValue(value) {
  return Array.isArray(value) ? value : [value];
}
