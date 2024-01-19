import { trackEffect, triggerEffect, isTracking, reactive } from "./reactive";
import { isSame, isObject } from "./shared";

class RefImpl {
  private _value;
  private _rawValue; //原始值
  public __v_isRef = true;
  public dep;
  constructor(value) {
    this.dep = new Set();
    this._value = convert(value);
    this._rawValue = value; //rawValue是原始值 因为value可能是proxy代理对象
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newValue) {
    if (isSame(this._rawValue, newValue)) return;
    this._value = convert(newValue);
    this._rawValue = newValue;
    triggerEffect(this.dep);
  }
}

export function ref(value) {
  return new RefImpl(value);
}

function trackRefValue(ref) {
  if (isTracking()) {
    trackEffect(ref.dep);
  }
}

function convert(value) {
  return isObject(value) ? reactive(value) : value;
}

export function isRef(ref) {
  return !!ref.__v_isRef;
}
