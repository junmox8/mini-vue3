export let activeEffect;
class ReactiveEffect {
  constructor(public fn, public schedule?) {}
  run() {
    activeEffect = this;
    return this.fn();
  }
}

export function effect(fn, option: any = {}) {
  console.log(option.schedule);
  const schedule = option.schedule;
  const reactiveEffect = new ReactiveEffect(fn, schedule);
  reactiveEffect.run();
  return reactiveEffect.run.bind(reactiveEffect);
}
