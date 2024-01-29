import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "./ShapeFlags";
export function render(vnode, container) {
  patch(vnode, container);
}

function patch(vnode, container) {
  const { type, shapeFlag } = vnode;
  switch (type) {
    case "Fragment":
      processFragment(vnode, container);
      break;
    case "Text":
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container);
      }
      break;
  }
}

function processFragment(vnode, container) {
  //跳过生成父节点
  mountChildren(vnode.children, container);
}

function processText(vnode, container) {
  const { children } = vnode;
  const node = (vnode.el = document.createTextNode(children));
  container.append(node);
}

function processElement(vnode, container) {
  mountElement(vnode, container);
}

function processComponent(vnode, container) {
  mountComponent(vnode, container);
}

function mountElement(vnode, container) {
  const { type, props, children, shapeFlag } = vnode;
  const el = (vnode.el = document.createElement(type)); //进行vnode的el赋值
  if (props) {
    for (let key in props) {
      if (isOn(key)) {
        el.addEventListener(key.slice(2).toLowerCase(), props[key]);
      } else {
        el.setAttribute(key, props[key]);
      }
    }
  }
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
    el.textContent = children;
  } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
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

function isOn(key) {
  //鉴别该属性是否是事件
  return /^on[A-Z]/.test(key);
}
