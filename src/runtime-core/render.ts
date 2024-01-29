import { createComponentInstance, setupComponent } from "./component";
import { ShapeFlags } from "./ShapeFlags";
export function render(vnode, container, parentComponent) {
  patch(vnode, container, parentComponent);
}

function patch(vnode, container, parentComponent) {
  const { type, shapeFlag } = vnode;
  switch (type) {
    case "Fragment":
      processFragment(vnode, container, parentComponent);
      break;
    case "Text":
      processText(vnode, container);
      break;
    default:
      if (shapeFlag & ShapeFlags.ELEMENT) {
        processElement(vnode, container, parentComponent);
      } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        processComponent(vnode, container, parentComponent);
      }
      break;
  }
}

function processFragment(vnode, container, parentComponent) {
  //跳过生成父节点
  mountChildren(vnode.children, container, parentComponent);
}

function processText(vnode, container) {
  const { children } = vnode;
  const node = (vnode.el = document.createTextNode(children));
  container.append(node);
}

function processElement(vnode, container, parentComponent) {
  mountElement(vnode, container, parentComponent);
}

function processComponent(vnode, container, parentComponent) {
  mountComponent(vnode, container, parentComponent);
}

function mountElement(vnode, container, parentComponent) {
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
    mountChildren(children, el, parentComponent);
  }
  container.append(el);
}

function mountChildren(children, container, parentComponent) {
  children.forEach((child) => patch(child, container, parentComponent));
}

function mountComponent(vnode, container, parentComponent) {
  const instance = createComponentInstance(vnode, parentComponent);
  setupComponent(instance);
  setupRenderEffect(instance, vnode, container);
}

function setupRenderEffect(instance, vnode, container) {
  const { proxy } = instance;
  const subTree = instance.render.call(proxy);
  patch(subTree, container, instance); //
  vnode.el = subTree.el;
}

function isOn(key) {
  //鉴别该属性是否是事件
  return /^on[A-Z]/.test(key);
}
