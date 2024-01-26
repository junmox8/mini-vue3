import { createVNode } from "./vnode";
export function h(type, children?, props?) {
  return createVNode(type, children, props);
}
