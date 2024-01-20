import {h} from '../lib/mini-vue.esm.js'

const App = {
  render() {
    return h("div", [h("span", "child1", {class: 'blue'})], {class: 'red'})
  },
  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}
export default App
