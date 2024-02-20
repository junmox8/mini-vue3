/*
 * @Author: root 931097192@qq.com
 * @Date: 2024-02-20 13:13:02
 * @LastEditors: root 931097192@qq.com
 * @LastEditTime: 2024-02-20 17:05:07
 * @FilePath: \writing-vue3\example\compiler\main.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createApp } from "../../lib/mini-vue.esm.js";
import App from "./App.js";
const container = document.getElementById("app");
createApp(App).mount(container);
