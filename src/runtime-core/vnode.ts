export function createVNode(type, children?, props?) {
  const vnode = {
    type,
    props,
    children,
    el: null, //方便后续$el取值
  };
  return vnode;
}
