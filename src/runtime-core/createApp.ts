import { createVNode } from "./vnode";
import { render } from "./render";
export function createApp(rootComponent) {
  return {
    mount: function (rootContainer) {
      //后续操作都是基于vnode进行处理
      const vnode = createVNode(rootComponent);
      render(vnode, rootContainer, null);
    },
  };
}
