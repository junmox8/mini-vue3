export let activeEffect;
class ReactiveEffect {
  constructor(public fn) {}
  run() {
    activeEffect = this;
    this.fn();
  }
}

export function effect(fn) {
  const reactiveEffect = new ReactiveEffect(fn);
  reactiveEffect.run();
}
