import { ref, h } from "../../lib/mini-vue.esm.js";
const oldChildren = "oldChildren";
const newChildren = [h("div", "A"), h("button", "按钮")];
export default {
  setup() {
    const isChange = ref(false);
    window.isChange = isChange;
    return {
      isChange,
    };
  },
  render() {
    return this.isChange === true ? h("div", newChildren) : h("div", oldChildren);
  },
};
