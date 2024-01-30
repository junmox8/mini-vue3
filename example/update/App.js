import {h, ref} from '../../lib/mini-vue.esm.js'
const App = {
  setup() {
    const num = ref(0)
    const onClick = () => {
      num.value++
    }
    return {
      num,
      onClick
    }
  },
  render() {
    return h('div', [h('div', `值是：${this.num}`), h('button', 'click', {onClick: this.onClick})], {id: 'root'})
  }
}
export default App
