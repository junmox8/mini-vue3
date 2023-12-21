import { activeEffect } from "./effect";
import { mutableHandlers, readonlyHandlers } from "./baseHandles";

const targetMap = new Map();
export function trackEvent(target, key) {
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
  if (activeEffect) {
    dep.add(activeEffect);
    activeEffect.deps.add(dep); //stop功能,收集dep
  }
}
export function triggerEvent(target, key) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  const dep = depsMap.get(key);
  Array.from(dep).forEach((effect) => {
    if (effect.schedule) {
      effect.schedule(); //schedule优先级大于run
    } else {
      effect.run();
    }
  });
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
