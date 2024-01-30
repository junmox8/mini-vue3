import { createVNode } from "./vnode";

export function createAppAPI(render) {
  return function createApp(rootComponent) {
    return {
      mount: function (rootContainer) {
        //后续操作都是基于vnode进行处理
        const vnode = createVNode(rootComponent);
        render(vnode, rootContainer, null);
      },
    };
  };
}
