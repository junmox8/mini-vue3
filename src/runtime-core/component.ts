import { PublicInstanceProxyHandler } from "./componentPublicInstance";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
  };
  return component;
}

export function setupComponent(instance) {
  //TODO initProps initSlot
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type; //组件实例内部包含vnode
  const { setup } = Component;

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandler);

  if (setup) {
    //可能是object/function类型
    const setupResult = setup();
    handleSetupResult(instance, setupResult);
  }
}
function handleSetupResult(instance, setupResult) {
  //TODO function类型
  if (typeof setupResult === "object") {
    instance.setupState = setupResult;
  }
  finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
  const Component = instance.type;
  if (Component.render) {
    instance.render = Component.render; //设置组件实例的render函数
  }
}
