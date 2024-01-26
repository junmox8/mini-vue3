import { PublicInstanceProxyHandler } from "./componentPublicInstance";
import { initProps } from "./componentProps";
import { shallowReadonly } from "../reactivity/reactive";

export function createComponentInstance(vnode) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
  };
  return component;
}

export function setupComponent(instance) {
  //TODO initSlot
  initProps(instance, instance.vnode.props);
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type; //组件实例内部包含vnode
  const { setup } = Component;

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandler);

  if (setup) {
    //可能是object/function类型
    const setupResult = setup(shallowReadonly(instance.props)) || {};
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
