import { extend } from "./shared";
export let activeEffect;
class ReactiveEffect {
  constructor(public fn, public schedule?) {}
  deps = new Set([]);
  active = true;
  onStop?: () => void;
  run() {
    activeEffect = this;
    this.active = true;
    return this.fn();
  }
  stop() {
    this.cleanupEffect(this);
  }
  cleanupEffect(effect) {
    //添加缓存,防止重复遍历影响性能
    if (this.active) {
      this.onStop && this.onStop();
      Array.from(effect.deps).forEach((dep: Set<any>) => {
        dep.delete(this);
      });
      this.active = false;
    }
  }
}

export function effect(fn, option: any = {}) {
  const { schedule = null, onStop = null } = option;
  const reactiveEffect = new ReactiveEffect(fn, schedule);
  extend(reactiveEffect, option);
  reactiveEffect.run();
  const res: any = reactiveEffect.run.bind(reactiveEffect);
  res.instance = reactiveEffect;
  return res;
}

export function stop(fn) {
  fn.instance.stop();
}
