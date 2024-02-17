import { NodeTypes } from "./ast";

/*
 * @Author: root 931097192@qq.com
 * @Date: 2024-02-16 16:29:09
 * @LastEditors: root 931097192@qq.com
 * @LastEditTime: 2024-02-17 14:34:38
 * @FilePath: \writing-vue3\src\compiler-core\transform.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export function transform(root, options) {
  const context = createTransformsContext(root, options);
  traverseNode(root, context);
}

function traverseNode(node, context) {
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i <= nodeTransforms.length - 1; i++) {
    const nodeTransform = nodeTransforms[i];
    nodeTransform(node);
  }
  traversChildren(node, context);
}

function traversChildren(node, context) {
  const children = node.children;

  if (children) {
    for (let i = 0; i <= children.length - 1; i++) {
      const node = children[i];

      traverseNode(node, context);
    }
  }
}

function createTransformsContext(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
  };
  return context;
}
