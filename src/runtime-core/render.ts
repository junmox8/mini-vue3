import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { ShapeFlags } from "./ShapeFlags";
import { effect } from "../reactivity/effect";

export function createRenderer(options) {
  const { createElement, patchProps, insert } = options;

  function render(n2, container, parentComponent) {
    //只有在createApp().mount函数中执行render 因此一定是初始化
    patch(null, n2, container, parentComponent);
  }

  function patch(n1, n2, container, parentComponent) {
    const { type, shapeFlag } = n2;
    switch (type) {
      case "Fragment":
        processFragment(n1, n2, container, parentComponent);
        break;
      case "Text":
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent);
        }
        break;
    }
  }

  function processFragment(n1, n2, container, parentComponent) {
    //跳过生成父节点
    mountChildren(n2.children, container, parentComponent);
  }

  function processText(n1, n2, container) {
    const { children } = n2;
    const node = (n2.el = document.createTextNode(children));
    container.append(node);
  }

  function processElement(n1, n2, container, parentComponent) {
    if (!n1) {
      //初始化逻辑
      mountElement(n2, container, parentComponent);
    } else {
      patchElement(n1, n2, container);
    }
  }

  function processComponent(n1, n2, container, parentComponent) {
    mountComponent(n2, container, parentComponent);
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

  function patchElement(n1, n2, container) {
    console.log(n2);
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach((child) => patch(null, child, container, parentComponent));
  }

  function mountComponent(vnode, container, parentComponent) {
    const instance = createComponentInstance(vnode, parentComponent);
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container);
  }

  function setupRenderEffect(instance, vnode, container) {
    effect(() => {
      if (!instance.isMounted) {
        //如果是初始化时，走此逻辑创建节点
        const { proxy } = instance;
        //在这里将初始化的子节点放到subTree中。
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance);
        vnode.el = subTree.el;

        instance.isMounted = true;
      } else {
        const { proxy } = instance;
        //新节点
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;

        //再次更新子节点
        instance.subTree = subTree;

        patch(prevSubTree, subTree, container, instance);
      }
    });
  }

  return {
    createApp: createAppAPI(render),
  };
}
