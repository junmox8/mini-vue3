import { baseCompiler } from "./compiler-core";
import { registerRuntimeCompiler } from "./runtime-dom";
import * as runtimeDom from "./runtime-dom";
export * from "./runtime-dom";
export * from "./reactivity";
export { baseCompiler } from "./compiler-core";

function compileToFunction(template) {
  const { code } = baseCompiler(template);
  const render = new Function("Vue", code)(runtimeDom);
  return render;
}

//runtime和compiler进行交互
registerRuntimeCompiler(compileToFunction);
