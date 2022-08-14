---
name: init函数
layout: two-cols
clicks: 5
---

# _init()

处理选项

<v-click>

Vue 2 中，一切功能均围绕选项实现，因而首先要处理传入的选项。

</v-click>
<v-click>

此处，先保存一份 Vue 示例，以待后用，见右上第 5 行。平时也可以用 `this.$options` 调用实例上的选项，即右上第 6 行。

</v-click>
<v-click>

传入的选项众多，诸如 `props` `data` `methods` `computed`。将其处理方法提出到单独文件，优于混杂在 `init.js`。
给这个函数起个名，叫 `initState`，并传入当前实例 。

</v-click>
<v-click>

此处再创建一文件，名曰 `state.js`，并在其中导出一函数，名曰 `initState`，专门处理这些选项，见右下

</v-click>
::right::

<v-clicks at="2">

```js {1,5-6|1,8|1,2|all} {at:2}
// /vue/src/init.js
import { initState } from './state'
export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this
    vm.$options = options

    initState(vm)
  }
}
```

</v-clicks>
<v-click at="4">

```js
// /vue/src/state.js
export function initState(vm) {

}
```

</v-click>
