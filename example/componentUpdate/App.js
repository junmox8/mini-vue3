/*
 * @Author: root 931097192@qq.com
 * @Date: 2024-02-11 00:20:50
 * @LastEditors: root 931097192@qq.com
 * @LastEditTime: 2024-02-11 00:39:50
 * @FilePath: \mini-vue\writing-vue3\example\componentUpdate\App.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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
