import { h, ref, getCurrentInstance, nextTick } from "../../lib/mini-vue.esm.js";
const App = {
  setup() {
    const count = ref(0);
    const clickEvent = () => {
      for (let i = 0; i <= 99; i++) {
        count.value++;
      }
      console.log(instance);
      nextTick(() => {
        console.log(instance);
      });
    };
    const instance = getCurrentInstance();
    return {
      count,
      clickEvent,
    };
  },
  render() {
    return h("div", [
      h("div", "count的值是" + this.count),
      h("button", "按钮", { onClick: this.clickEvent }),
    ]);
  },
};
export default App;
