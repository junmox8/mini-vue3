export * from "./toDisplayString";

export const extend = Object.assign;

export function isObject(val) {
  return val && typeof val === "object";
}

export function isSame(val, newVal) {
  return val === newVal;
}

export function isString(val) {
  return typeof val === "string";
}
