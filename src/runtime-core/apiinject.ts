import { getCurrentInstance } from "./component";

export function provide(key, value) {
  //tips:provide inject只可在setup内部使用
  const instance: any = getCurrentInstance();
  if (instance) {
    let { provides } = instance;
    const parentProvides = instance.parent.provides;
    if (provides === parentProvides) {
      provides = instance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}

export function inject(key) {
  const instance: any = getCurrentInstance();
  if (instance) {
    return instance.parent.provides[key];
  }
}
