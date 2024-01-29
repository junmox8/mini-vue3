import {h, provide, inject} from '../../lib/mini-vue.esm.js'

const container = {
  setup() {
  },
  render() {
    return h('div', [h(Provider)])
  }
}

const Provider = {
  setup() {
    provide('a', 1)
    provide('b', 2)
  },
  render() {
    return h('div', [h(ProviderTwo)])
  }
}

const ProviderTwo = {
  setup() {
    provide('b', 3)
    const b = inject('b')
    return {
      b
    }
  },
  render() {
    return h('div', [h('div', `b:${this.b}`), h(Consumer)])
  }
}

const Consumer = {
  setup() {
    const a = inject('a')
    const b = inject('b')
    return {
      a,
      b,
    }
  },
  render() {
    return h('div', `a:${this.a},b:${this.b}`)
  }
}

export default container
