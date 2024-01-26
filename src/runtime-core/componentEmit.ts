export function emit(instance, event, ...args) {
  const { props } = instance;
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  function camelize(str) {
    let flag;
    const rule = new RegExp("-");
    while ((flag = rule.exec(str)) !== null) {
      const index = flag.index;
      str =
        str.slice(0, index) +
        str[index + 1].toUpperCase() +
        str.slice(index + 2);
    }
    return str;
  }
  const handler = props["on" + camelize(capitalize(event))];
  handler && handler(...args);
}
