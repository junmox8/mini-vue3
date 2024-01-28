import {h} from '../../lib/mini-vue.esm.js'
import {Foo} from './Foo.js'
const App = {
  render() {
    window.self = this
    return h("div", [h("span", "child1" + this.msg, {class: 'blue', onClick: function () {console.log(1)}}), h(Foo, [], {'onAdd': function () {console.log('出发了add')}, 'onTestAdd': function () {console.log('testAdd')}})], {class: 'red'})
  },
  setup() {
    return {
      msg: 'mini-vue'
    }
  }
}
export default App
