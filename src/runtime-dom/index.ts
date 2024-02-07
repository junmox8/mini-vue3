import { createRenderer } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProp(el, key, oldProp, newProp) {
  function isOn(key) {
    //鉴别该属性是否是事件
    return /^on[A-Z]/.test(key);
  }
  if (isOn(key)) {
    el.addEventListener(key.slice(2).toLowerCase(), newProp);
  } else {
    if (newProp === undefined || newProp === null) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, newProp);
    }
  }
}

function insert(el, parent) {
  parent.append(el);
}

function remove(child) {
  const parent = child.parentNode;
  if (parent) {
    parent.removeChild(child);
  }
}

function setElementText(container, text) {
  container.textContent = text;
}

const renderer: any = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
});

export function createApp() {
  return renderer.createApp(...arguments);
}
export * from "../runtime-core";
