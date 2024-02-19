import { NodeTypes } from "../ast";

export function transformText(node) {
  if (node.type === NodeTypes.ELEMENT) {
    function isText(node) {
      return node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION;
    }
    const { children } = node;
    let currentContainer;
    for (let i = 0; i <= children.length - 1; i++) {
      const child = children[i];
      if (isText(child)) {
        for (let j = i + 1; j <= children.length - 1; j++) {
          const next = children[j];
          if (isText(next)) {
            if (!currentContainer) {
              currentContainer = children[i] = {
                type: NodeTypes.COMPOUND_EXPRESSION,
                children: [child],
              };
            }
            currentContainer.children.push(" + ");
            currentContainer.children.push(next);
            //push后 在children中删掉该元素
            children.splice(j, 1);
            //删除后 后面元素会往前移 关注索引
            j--;
          } else {
            currentContainer = undefined;
            break;
          }
        }
      }
    }
  }
}
