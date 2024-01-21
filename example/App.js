import {h} from '../lib/mini-vue.esm.js'

const App = {
  render() {
    window.self = this
    return h("div", [h("span", "child1" + this.msg, {class: 'blue', onClick: function () {console.log(1)}})], {class: 'red'})
  },
  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}
export default App
