import { ShapeFlags } from "./ShapeFlags";

export function createVNode(type, children?, props?) {
  const vnode = {
    type,
    props,
    children,
    el: null, //方便后续$el取值
    shapeFlag: getShapeFlag(type),
    key: props?.key, //方便后续patch比较
    component: null, //vnode对应的组件实例
  };
  if (typeof children === "string") {
    vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
  } else if (Array.isArray(children)) {
    vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
  }

  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof vnode.children === "object") {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
  }

  return vnode;
}

export function createTextVnode(text) {
  return createVNode("Text", text, {});
}

function getShapeFlag(type) {
  return typeof type === "string" ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT;
}
