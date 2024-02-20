import { ref } from "../../lib/mini-vue.esm.js";
const App = {
  setup() {
    const message = (window.message = ref(1));
    return {
      message,
    };
  },
  template: `<div>
  hi,123
  </div>`,
};
export default App;
