import {h} from '../lib/mini-vue.esm.js'

const App = {
  render() {
    return h("div", "hi," + this.msg)
  },
  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}
export default App
