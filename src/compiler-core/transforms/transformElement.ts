import { NodeTypes } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    context.helper(CREATE_ELEMENT_VNODE);
  }
  //中间处理
  const vnodeTag = node.tag;
  let vnodeProps = {};
  const children = node.children;
  const vnodeChildren = children[0];

  const vnodeElement = {
    type: NodeTypes.ELEMENT,
    props: vnodeProps,
    tag: vnodeTag,
    children: vnodeChildren,
  };

  node.codegenNode = vnodeElement;
}
