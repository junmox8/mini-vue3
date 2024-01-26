import { activeEffect, shouldTrack } from "./effect";
import {
  mutableHandlers,
  readonlyHandlers,
  shallowReadonlyHandlers,
  reactiveFlag,
} from "./baseHandles";
import { isObject } from "../shared/index";

const targetMap = new Map();
export function trackEvent(target, key) {
  if (!isTracking()) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap);
  }
  let dep = depsMap.get(key);
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep);
  }
  trackEffect(dep);
}

export function trackEffect(dep) {
  dep.add(activeEffect);
  activeEffect.deps.add(dep); //stop功能,收集dep
}

export function triggerEvent(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  triggerEffect(dep);
}

export function triggerEffect(dep) {
  Array.from(dep).forEach((effect) => {
    if (effect.schedule) {
      effect.schedule(); //schedule优先级大于run
    } else {
      effect.run();
    }
  });
}

export function isTracking() {
  return activeEffect && shouldTrack;
}

export function reactive(raw) {
  return createActiveObj(raw, mutableHandlers);
}

export function readonly(obj) {
  return createActiveObj(obj, readonlyHandlers);
}

function createActiveObj(obj, type) {
  return new Proxy(obj, type);
}

export function isReactive(obj) {
  return !!obj[reactiveFlag.IS_REACTIVE];
}
export function isReadonly(obj) {
  return !!obj[reactiveFlag.IS_READONLY];
}
export function isProxy(obj) {
  return isReactive(obj) || isReadonly(obj);
}

export function shallowReadonly(obj) {
  if (!isObject(obj)) {
    console.warn(`${obj}需要是对象`);
    return obj;
  }
  return createActiveObj(obj, shallowReadonlyHandlers);
}
