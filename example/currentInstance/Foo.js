import {h, getCurrentInstance} from '../../lib/mini-vue.esm.js'
export const Foo = {
  setup() {
    console.log('Foo', getCurrentInstance())
    return {}
  },
  render() {
    const p = h('p', '123')
    //具名插槽&作用域插槽
    return h('div', [p])
  }
}
