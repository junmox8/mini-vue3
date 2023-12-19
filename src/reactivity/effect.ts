export let activeEffect;
class ReactiveEffect {
  constructor(public fn) {}
  run() {
    activeEffect = this;
    return this.fn();
  }
}

export function effect(fn) {
  const reactiveEffect = new ReactiveEffect(fn);
  reactiveEffect.run();
  return reactiveEffect.run.bind(reactiveEffect);
}
