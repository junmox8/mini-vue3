import { trackEvent, triggerEvent } from "./reactive";

function createGetter(isReadonly = false) {
  return function (target, key) {
    if (key === reactiveFlag.IS_REACTIVE) {
      return !isReadonly;
    } else if (key === reactiveFlag.IS_READONLY) {
      return isReadonly;
    }
    const res = Reflect.get(target, key);
    if (!isReadonly) {
      trackEvent(target, key);
    }
    return res;
  };
}

function createSetter() {
  return function (target, key, value) {
    const res = Reflect.set(target, key, value);
    triggerEvent(target, key);
    return res;
  };
}

export const mutableHandlers = {
  get: createGetter(),
  set: createSetter(),
};

export const readonlyHandlers = {
  get: createGetter(true),
  set(target, key, value) {
    console.warn("readonly类型不允许被修改");
    return true;
  },
};

export const enum reactiveFlag {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadOnly",
}
