import { h, ref } from "../../lib/mini-vue.esm.js";
const App = {
  setup() {
    const num = ref(0);
    const props = ref({
      a: 1,
      b: 2,
    });
    const onClick = () => {
      num.value++;
    };
    const change1 = () => {
      props.value.a = 3;
    };
    const change2 = () => {
      props.value.a = undefined;
    };
    const change3 = () => {
      props.value = {
        a: 1,
      };
    };
    return {
      num,
      props,
      onClick,
      change1,
      change2,
      change3,
    };
  },
  render() {
    return h(
      "div",
      [
        h("div", `num是${this.num}`),
        h("button", "点击更改props的a属性值", { onClick: this.change1 }),
        h("button", "点击更改props的a属性值为undefined", { onClick: this.change2 }),
        h("button", "点击删除props的b属性值", { onClick: this.change3 }),
      ],
      { id: "root", ...this.props },
    );
  },
};
export default App;
