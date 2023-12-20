import { activeEffect } from "./effect";

export function reactive(raw) {
  return new Proxy(raw, {
    get(target, key) {
      const res = Reflect.get(target, key);
      trackEvent(target, key);
      return res;
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value);
      triggerEvent(target, key);
      return res;
    },
  });
}

const targetMap = new Map();
function trackEvent(target, key) {
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
function triggerEvent(target, key) {
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
