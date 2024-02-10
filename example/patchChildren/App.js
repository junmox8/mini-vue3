import { h } from "../../lib/mini-vue.esm.js";
import ArrayToText from "./ArrayToText.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";
import ArrayToArray from "./ArrayToArray.js";
const App = {
  setup() {
    return {};
  },
  render() {
    return h("div", [h("p", "主页", {}), h(ArrayToArray)]);
  },
};
export default App;
