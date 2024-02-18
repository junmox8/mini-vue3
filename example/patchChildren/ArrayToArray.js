import { ref, h } from "../../lib/mini-vue.esm.js";
//1.左侧对比
// const oldChildren = [
//   h("p", "A", { key: "A" }),
//   h("p", "B", { key: "B" }),
//   h("p", "C", { key: "C" }),
// ];
// const newChildren = [
//   h("p", "A", { key: "A" }),
//   h("p", "B", { key: "B" }),
//   h("p", "D", { key: "D" }),
//   h("p", "E", { key: "E" }),
// ];

//2.右侧对比
// const oldChildren = [
//   h("p", "A", { key: "A" }),
//   h("p", "B", { key: "B" }),
//   h("p", "C", { key: "C" }),
// ];
// const newChildren = [
//   h("p", "D", { key: "D" }),
//   h("p", "E", { key: "E" }),
//   h("p", "B", { key: "B" }),
//   h("p", "C", { key: "C" }),
// ];

//3.新的比老的长
//右侧
// const oldChildren = [h("p", "A", { key: "A" }), h("p", "B", { key: "B" })];
// const newChildren = [
//   h("p", "A", { key: "A" }),
//   h("p", "B", { key: "B" }),
//   h("p", "C", { key: "C" }),
//   h("p", "D", { key: "D" }),
// ];
//左侧
// const oldChildren = [h("p", "A", { key: "A" }), h("p", "B", { key: "B" })];
// const newChildren = [
//   h("p", "C", { key: "C" }),
//   h("p", "D", { key: "D" }),
//   h("p", "A", { key: "A" }),
//   h("p", "B", { key: "B" }),
// ];

//4.老的比新的长
//右侧
// const oldChildren = [
//   h("p", "A", { key: "A" }),
//   h("p", "B", { key: "B" }),
//   h("p", "C", { key: "C" }),
//   h("p", "D", { key: "D" }),
// ];
// const newChildren = [h("p", "A", { key: "A" }), h("p", "B", { key: "B" })];

//左侧
// const oldChildren = [
//   h("p", "C", { key: "C" }),
//   h("p", "D", { key: "D" }),
//   h("p", "A", { key: "A" }),
//   h("p", "B", { key: "B" }),
// ];
// const newChildren = [h("p", "A", { key: "A" }), h("p", "B", { key: "B" })];

//5.中间比对
const oldChildren = [
  h("p", "A", { key: "A" }),
  h("p", "B", { key: "B" }),
  h("p", "C", { key: "C", id: "c-prev" }),
  h("p", "D", { key: "D" }),
  h("p", "E", { key: "E" }),
  h("p", "F", { key: "F" }),
  h("p", "G", { key: "G" }),
];
const newChildren = [
  h("p", "A", { key: "A" }),
  h("p", "B", { key: "B" }),
  h("p", "E", { key: "E" }),
  h("p", "C", { key: "C", id: "c-next" }),
  h("p", "D", { key: "D" }),
  h("p", "H", { key: "H" }),
  h("p", "F", { key: "F" }),
  h("p", "G", { key: "G" }),
];

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
