export function createVNode(type, children?, props?) {
  const vnode = {
    type,
    props,
    children,
  };
  return vnode;
}
