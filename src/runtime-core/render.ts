import { createComponentInstance, setupComponent } from "./component";
import { createAppAPI } from "./createApp";
import { ShapeFlags } from "./ShapeFlags";
import { effect } from "../reactivity/effect";

export function createRenderer(options) {
  const { createElement, patchProp, insert, remove, setElementText } = options;

  function render(n2, container, parentComponent) {
    //只有在createApp().mount函数中执行render 因此一定是初始化
    patch(null, n2, container, parentComponent, null);
  }

  function patch(n1, n2, container, parentComponent, anchor = null) {
    const { type, shapeFlag } = n2;
    switch (type) {
      case "Fragment":
        processFragment(n1, n2, container, parentComponent, anchor);
        break;
      case "Text":
        processText(n1, n2, container);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, parentComponent, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, parentComponent, anchor);
        }
        break;
    }
  }

  function processFragment(n1, n2, container, parentComponent, anchor) {
    //跳过生成父节点
    mountChildren(n2.children, container, parentComponent, anchor);
  }

  function processText(n1, n2, container) {
    const { children } = n2;
    const node = (n2.el = document.createTextNode(children));
    container.append(node);
  }

  function processElement(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      //初始化逻辑
      mountElement(n2, container, parentComponent, anchor);
    } else {
      patchElement(n1, n2, container, parentComponent, anchor);
    }
  }

  function processComponent(n1, n2, container, parentComponent, anchor) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor);
    } else {
      updateComponent(n1, n2);
    }
  }

  function updateComponent(n1, n2) {
    const instance = (n2.component = n1.component);
    if (shouldUpdate(n1, n2)) {
      instance.next = n2;
      instance.update();
    } else {
      n2.el = n1.el;
      instance.vnode = n2;
    }
  }

  function shouldUpdate(n1, n2) {
    const { props: prevProps } = n1;
    const { props: nextProps } = n2;
    for (let i in prevProps) {
      if (prevProps[i] !== nextProps[i]) {
        return true;
      }
    }
    return false;
  }

  function mountElement(vnode, container, parentComponent, anchor) {
    const { type, props, children, shapeFlag } = vnode;
    const el = (vnode.el = createElement(type)); //进行vnode的el赋值
    if (props) {
      for (let key in props) {
        const val = props[key];
        patchProp(el, key, null, val);
      }
    }
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el, parentComponent, anchor);
    }
    insert(el, container, anchor);
  }

  function patchElement(n1, n2, container, parentComponent, anchor) {
    const oldProps = n1.props || {};
    const newProps = n2.props || {};
    const el = (n2.el = n1.el); //n1在mountElement时赋值el给vnode n2未走mount逻辑 故在此赋值el给n2

    patchChildren(el, n1, n2, parentComponent, anchor);
    patchProps(el, oldProps, newProps);
  }

  function patchChildren(el, n1, n2, parentComponent, anchor) {
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    const oldChildren = n1.children;
    const newChildren = n2.children;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      //ArrayToText情况 1.把老的children清空 2.设置新的text
      //TextToText情况 1.设置新的text
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(n1.children);
      }
      if (oldChildren !== newChildren) {
        setElementText(el, newChildren);
      }
    } else {
      //TextToArray情况 1.清空children
      if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        setElementText(el, "");
        mountChildren(newChildren, el, parentComponent, anchor);
      } else {
        //ArrayToArray情况
        patchKeyedChildren(oldChildren, newChildren, el, parentComponent, anchor);
      }
    }
  }

  function patchKeyedChildren(oldChildren, newChildren, container, parentComponent, parentAnchor) {
    let e1 = oldChildren.length - 1;
    let e2 = newChildren.length - 1;
    let i = 0;
    function isSomeVnodeType(n1, n2) {
      //从type和key两个角度比较
      //key为什么没有从props中取 因为在创建vnode的时候已经从props中取值并赋值给vnode的key属性了
      return n1.type === n2.type && n1.key === n2.key;
    }
    //左侧
    while (i <= e1 && i <= e2) {
      const n1 = oldChildren[i];
      const n2 = newChildren[i];
      if (isSomeVnodeType(n1, n2)) {
        //如果相同 直接走patch逻辑 更新两个vnode的props和children
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      i++;
    }
    //右侧
    while (i <= e1 && i <= e2) {
      const n1 = oldChildren[e1];
      const n2 = newChildren[e2];
      if (isSomeVnodeType(n1, n2)) {
        //如果相同 直接走patch逻辑 更新两个vnode的props和children
        patch(n1, n2, container, parentComponent, parentAnchor);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      //新的比老的多 创建
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
        while (i <= e2) {
          patch(null, newChildren[i], container, parentComponent, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      //老的比新的多 删除
      while (i <= e1) {
        remove(oldChildren[i].el);
        i++;
      }
    } else {
      //中间比对
      let s1 = i,
        s2 = i;
      //这里是优化点 若newChildren里所有项都patch后 oldChildren多余的项直接remove即可
      const toBePatched = e2 - s2 + 1;
      let patched = 0;
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched).fill(0);
      let moved = false;
      let maxNewIndexSoFar = 0;

      for (let i = s2; i <= e2; i++) {
        const el = newChildren[i];
        //key为vnode的key value为索引
        keyToNewIndexMap.set(el.key, i);
      }
      for (let i = s1; i <= e1; i++) {
        const el = oldChildren[i];
        let newIndex;
        if (patched >= toBePatched) {
          remove(el.el);
          continue;
        }
        if (el.key) {
          newIndex = keyToNewIndexMap.get(el.key);
        } else {
          //如果没有设置key oldChildren的每一项和newChildren中的元素进行比对
          for (let j = s2; j <= e2; j++) {
            if (isSomeVnodeType(el, newChildren[j])) {
              newIndex = j;
              break;
            }
          }
        }

        if (!newIndex) {
          remove(el.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(el, newChildren[newIndex], container, parentComponent);
          patched++;
        }
      }

      //获取最长递增子序列
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
      let j = increasingNewIndexSequence.length - 1;
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = newChildren[nextIndex];
        const anchor = nextIndex + 1 < newChildren.length ? newChildren[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor);
        }
        if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            insert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }

  function unmountChildren(children) {
    for (let i = 0; i <= children.length - 1; i++) {
      const el = children[i].el;
      remove(el);
    }
  }

  function patchProps(el, oldProps, newProps) {
    for (let key in newProps) {
      const oldProp = oldProps[key];
      const newProp = newProps[key];
      if (oldProp !== newProp) {
        patchProp(el, key, oldProp, newProp);
      }
    }
    for (let key in oldProps) {
      if (!(key in newProps)) {
        patchProp(el, key, oldProps[key], null);
      }
    }
  }

  function mountChildren(children, container, parentComponent, anchor) {
    children.forEach((child) => patch(null, child, container, parentComponent, anchor));
  }

  function mountComponent(vnode, container, parentComponent, anchor) {
    const instance = (vnode.component = createComponentInstance(vnode, parentComponent));
    setupComponent(instance);
    setupRenderEffect(instance, vnode, container, anchor);
  }

  function setupRenderEffect(instance, vnode, container, anchor) {
    instance.update = effect(() => {
      if (!instance.isMounted) {
        //如果是初始化时，走此逻辑创建节点
        const { proxy } = instance;
        //在这里将初始化的子节点放到subTree中。
        const subTree = (instance.subTree = instance.render.call(proxy));
        patch(null, subTree, container, instance, anchor);
        vnode.el = subTree.el;

        instance.isMounted = true;
      } else {
        //next是即将要更新的vnode vnode是更新之前的vnode
        const { proxy, next, vnode } = instance;
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next);
        }
        //新节点
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;

        //再次更新子节点
        instance.subTree = subTree;

        patch(prevSubTree, subTree, container, instance, anchor);
      }
    });
  }

  function updateComponentPreRender(instance, nextVnode) {
    instance.vnode = nextVnode;
    instance.next = null;
    instance.props = nextVnode.props;
  }

  return {
    createApp: createAppAPI(render),
  };
}

//求最长递增子序列函数
function getSequence(arr: number[]): number[] {
  const predecessors = arr.slice();
  const sequenceIndices = [0];
  let currentIndex, lastIndexOfSequence, low, high, mid, comparisonResult;
  const length = arr.length;
  for (currentIndex = 0; currentIndex < length; currentIndex++) {
    const currentElement = arr[currentIndex];
    if (currentElement !== 0) {
      lastIndexOfSequence = sequenceIndices[sequenceIndices.length - 1];
      if (arr[lastIndexOfSequence] < currentElement) {
        predecessors[currentIndex] = lastIndexOfSequence;
        sequenceIndices.push(currentIndex);
        continue;
      }
      low = 0;
      high = sequenceIndices.length - 1;
      while (low < high) {
        mid = (low + high) >> 1;
        comparisonResult = arr[sequenceIndices[mid]] < currentElement ? 1 : 0;
        if (comparisonResult) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      if (currentElement < arr[sequenceIndices[low]]) {
        if (low > 0) {
          predecessors[currentIndex] = sequenceIndices[low - 1];
        }
        sequenceIndices[low] = currentIndex;
      }
    }
  }
  currentIndex = sequenceIndices.length;
  lastIndexOfSequence = sequenceIndices[currentIndex - 1];
  while (currentIndex-- > 0) {
    sequenceIndices[currentIndex] = lastIndexOfSequence;
    lastIndexOfSequence = predecessors[lastIndexOfSequence];
  }

  return sequenceIndices;
}
