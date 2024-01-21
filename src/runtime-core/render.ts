import { createComponentInstance, setupComponent } from "./component";
import { isObject } from "../shared";
export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  if (typeof vnode.type === "string") {
    processElement(vnode, container);
  } else if (isObject(vnode.type)) {
    processComponent(vnode, container);
  }
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountElement(vnode, container) {
  const { type, props, children } = vnode;
  const el = (vnode.el = document.createElement(type)); //进行vnode的el赋值
  if (props) {
    for (let key in props) {
      el.setAttribute(key, props[key]);
    }
  }
  if (typeof children === "string") {
    el.textContent = children;
  } else if (Array.isArray(children)) {
    mountChildren(children, el);
  }
  container.append(el);
}

function mountChildren(children, container) {
  children.forEach((child) => patch(child, container));
}

function mountComponent(vnode, container) {
  const instance = createComponentInstance(vnode);
  setupComponent(instance);
  setupRenderEffect(instance, vnode, container);
}

function setupRenderEffect(instance, vnode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  patch(subTree, container);
  vnode.el = subTree.el;
}
