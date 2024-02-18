import { h, ref } from "../../lib/mini-vue.esm.js";
import Child from "./Child.js";

const App = {
  setup() {
    const num = ref(0);
    const msg = ref("123");
    window.msg = msg;
    const changeChildProps = () => {
      msg.value = "456";
    };
    const change = () => {
      num.value++;
    };

    return {
      num,
      msg,
      changeChildProps,
      change,
    };
  },
  render() {
    return h("div", [
      h("div", "主页"),
      h("button", "changeChildrenProps", { onClick: this.changeChildProps }),
      h(Child, [], { msg: this.msg }),
      h("button", "changeNum", { onClick: this.change }),
      h("div", "num是" + this.num),
    ]);
  },
};
export default App;
