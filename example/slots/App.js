import {h} from '../../lib/mini-vue.esm.js'
import {Foo} from './Foo.js'
const App = {
  render() {
    const btn = ({id}) => h('button', '按钮' + id)
    const btn2 = ({id}) => h('button', '按钮2' + id)
    return h('div', [h(Foo, {header: btn, footer: btn2})])
  },
  setup() {
    return {}
  }
}
export default App
