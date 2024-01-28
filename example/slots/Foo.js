import {h, renderSlots} from '../../lib/mini-vue.esm.js'
export const Foo = {
  setup() {
    return {}
  },
  render() {
    const p = h('p', '123')
    //具名插槽&作用域插槽
    return h('div', [renderSlots(this.$slots, 'header', {id: 11}), p, renderSlots(this.$slots, 'footer', {id: 22})])
  }
}
