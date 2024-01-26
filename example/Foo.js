import {h} from '../lib/mini-vue.esm.js'
export const Foo = {
  setup(props, {emit}) {
    function emitAdd() {
      emit('add')
      emit('test-add')
    }
    return {
      emitAdd
    }
  },
  render() {
    const btn = h('button', [], {onClick: this.emitAdd})
    const p = h('p', '这里是p标签')
    return h('div', [btn, p])
  }
}
