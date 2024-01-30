import { createRenderer } from "../runtime-core";

function createElement(type) {
  return document.createElement(type);
}

function patchProps(props, el) {
  function isOn(key) {
    //鉴别该属性是否是事件
    return /^on[A-Z]/.test(key);
  }
  for (let key in props) {
    if (isOn(key)) {
      el.addEventListener(key.slice(2).toLowerCase(), props[key]);
    } else {
      el.setAttribute(key, props[key]);
    }
  }
}

function insert(el, parent) {
  parent.append(el);
}

const renderer: any = createRenderer({
  createElement,
  patchProps,
  insert,
});

export function createApp() {
  return renderer.createApp(...arguments);
}
export * from "../runtime-core";
