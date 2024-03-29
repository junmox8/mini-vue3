/*
 * @Author: root 931097192@qq.com
 * @Date: 2024-02-05 13:42:35
 * @LastEditors: root 931097192@qq.com
 * @LastEditTime: 2024-02-20 15:34:22
 * @FilePath: \writing-vue3\src\runtime-core\component.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { PublicInstanceProxyHandler } from "./componentPublicInstance";
import { initProps } from "./componentProps";
import { shallowReadonly } from "../reactivity/reactive";
import { emit } from "./componentEmit";
import { initSlot } from "./componentSlots";
import { proxyRef } from "../reactivity";

export function createComponentInstance(vnode, parent) {
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    props: {},
    slots: {},
    provides: parent ? parent.provides : {},
    parent,
    isMounted: false, //代表该组件实例是否初始化
    subTree: {},
    emit: () => {},
    next: null,
  };
  component.emit = emit.bind(null, component) as any;
  return component;
}

export function setupComponent(instance) {
  initSlot(instance, instance.vnode.children);
  initProps(instance, instance.vnode.props);
  setupStatefulComponent(instance);
}

function setupStatefulComponent(instance) {
  const Component = instance.type; //组件实例内部包含vnode
  const { setup } = Component;

  instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandler);

  if (setup) {
    setCurrentInstance(instance);
    //可能是object/function类型
    const setupResult =
      setup(shallowReadonly(instance.props), {
        emit: instance.emit,
      }) || {};
    setCurrentInstance(null);
    handleSetupResult(instance, setupResult);
  }
}

function handleSetupResult(instance, setupResult) {
  //TODO function类型
  if (typeof setupResult === "object") {
    instance.setupState = proxyRef(setupResult);
  }
  finishComponentSetup(instance);
}

function finishComponentSetup(instance) {
  const Component = instance.type;
  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template);
    }
  }
  instance.render = Component.render; //设置组件实例的render函数
}

let currentInstance = null;

export function getCurrentInstance() {
  return currentInstance;
}

export function setCurrentInstance(instance) {
  currentInstance = instance;
}

//传入template 返回render
let compiler;

export function registerRuntimeCompiler(_compiler) {
  compiler = _compiler;
}
