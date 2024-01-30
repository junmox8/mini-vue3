import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { ShapeFlags } from "./ShapeFlags";

export function createRenderer(options) {
  const { createElement, patchProps, insert } = options;

  function render(vnode, container, parentComponent) {
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
    const el = (vnode.el = createElement(type)); //进行vnode的el赋值
    if (props) {
      patchProps(props, el);
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent);
    }
    insert(el, container);
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

  return {
    createApp: createAppAPI(render),
  };
}
