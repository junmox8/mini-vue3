import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING, helperMapName } from "./runtimeHelpers";

export function generate(ast) {
  const context = createCodegenContext(ast);
  const { push } = context;
  genFunctionPreamble(ast, push);
  push("return");
  const functionName = "render";
  const args = ["_ctx", "_cache"];
  const signature = args.join(", ");

  push(` function ${functionName} (${signature}){`);
  push("return ");
  genNode(ast.codegenNode, context);
  push(`}`);
  return {
    code: context.code,
  };
}

function genNode(node, context) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
  }
}

function genText(node, context) {
  context.push(`'${node.content}'`);
}

function genInterpolation(node, context) {
  context.push(`${context.helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  context.push(`)`);
}

function genExpression(node, context) {
  context.push(`${node.content}`);
}

function createCodegenContext(ast) {
  const context = {
    code: "",
    push(source) {
      context.code += source;
    },
    helper(key) {
      return `_${helperMapName[key]}`;
    },
  };
  return context;
}

function genFunctionPreamble(ast, push) {
  //生成导入逻辑
  const VueBinging = "Vue";
  const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
  if (ast.helpers.length) {
    push(`const { ${ast.helpers.map((str) => aliasHelper(str)).join(", ")} } = ${VueBinging}`);
    push("\n");
  }
}
