import { h, ref } from "../../lib/mini-vue.esm.js";

const Child = {
  setup() {
    return {};
  },
  render() {
    return h("div", "值是" + this.$props.msg);
  },
};
export default Child;
