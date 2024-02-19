import { NodeTypes, createVNodeCall } from "../ast";
import { CREATE_ELEMENT_VNODE } from "../runtimeHelpers";

export function transformElement(node, context) {
  if (node.type === NodeTypes.ELEMENT) {
    context.helper(CREATE_ELEMENT_VNODE);

    //中间处理
    const vnodeTag = node.tag;
    let vnodeProps = null;
    const children = node.children;
    //compound类型 包含插值和text
    const vnodeChildren = children[0];

    node.codegenNode = createVNodeCall(vnodeTag, vnodeProps, vnodeChildren);
  }
}
