export const enum NodeTypes {
  INTERPOLATION,
  SIMPLE_EXPRESSION,
  ELEMENT,
  TEXT,
  ROOT,
  COMPOUND_EXPRESSION, //复合类型 包含插值和text
}

export function createVNodeCall(tag, props, children) {
  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  };
}
