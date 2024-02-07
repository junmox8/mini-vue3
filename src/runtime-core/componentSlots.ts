import { ShapeFlags } from "./ShapeFlags";
export function initSlot(instance, children) {
  const { vnode } = instance;
  const slots = {};
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    for (const key in children) {
      const val = children[key];
      //为什么组件实例的slots对象的每个key对应的value函数返回的值(如:a)都是数组 因为renderSlots中使用的是Fragment a需要作为Fragment节点的children
      slots[key] = (props) => formatValue(val(props));
    }
  }
  instance.slots = slots;
}

function formatValue(value) {
  return Array.isArray(value) ? value : [value];
}
