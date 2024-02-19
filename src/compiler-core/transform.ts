import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHelpers";

export function transform(root, options = {}) {
  const context = createTransformsContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root);
  root.helpers = [...context.helpers.keys()];
}

function traverseNode(node, context) {
  const nodeTransforms = context.nodeTransforms;
  for (let i = 0; i <= nodeTransforms.length - 1; i++) {
    const nodeTransform = nodeTransforms[i];
    nodeTransform(node, context);
  }
  switch (node.type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.ROOT:
    case NodeTypes.ELEMENT:
    case NodeTypes.COMPOUND_EXPRESSION:
      //有children属性再进行递归
      traverseChildren(node, context);
      break;
  }
}

function traverseChildren(node, context) {
  const children = node.children;

  for (let i = 0; i <= children.length - 1; i++) {
    const node = children[i];

    traverseNode(node, context);
  }
}

function createTransformsContext(root, options) {
  const context = {
    root,
    nodeTransforms: options.nodeTransforms || [],
    helpers: new Map(),
    helper: function (key) {
      context.helpers.set(key, 1);
    },
  };
  return context;
}

function createRootCodegen(root) {
  root.codegenNode = root.children[0];
}
