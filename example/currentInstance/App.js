import {h, getCurrentInstance} from '../../lib/mini-vue.esm.js'
import {Foo} from './Foo.js'
const App = {
  render() {

    return h('div', [h(Foo)])
  },
  setup() {
    console.log(getCurrentInstance())
    return {}
  }
}
export default App
