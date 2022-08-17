---
name: 处理选项 data
layout: two-cols
clicks: 6
---

# 处理选项 data

initData()

<!-- {{$slidev.nav.clicks}} -->

<v-click>

Vue 的核心是响应式数据，因此，我们先处理选项 data

</v-click>
<v-clicks at="2">

首先取到 data

data 可为函数，可为对象，因而需归一为对象。在开发时，以 `this.xxx` 调用其数据，故而执行 `data` 函数时，`this` 需指向实例 `vm`

一段代码用以判断是否为函数、是否为对象，通常将其提取到一个文件里，封装成函数，称之为工具函数，以减少重复代码，且代码即注释，便于理解

接下来便是重头戏，响应式数据。当数据改变，乃使视图更新。此时需有一观察者 `observe`，用以监听数据，进而创建响应式数据

</v-clicks>

::right::

<v-clicks at="1">

<div v-if="$slidev.nav.clicks<4">

```js {1,4,8-11|1,9|1,10|all} {at:1}
// /vue/src/state.js
export function initState(vm) {
  // ...
  if (opts.data) initData(vm)
  // ...
}
// ...
function initData(vm) {
  let data = vm.$options.data
  data = typeof data === 'function' ? data.call(vm) : data || {}
}
// ...
```
</div>
<div v-else-if="$slidev.nav.clicks===4">

```js {1,2,11} {at:4}
// /vue/src/state.js
import { isFunction } from './shared/utils.js'
export function initState(vm) {
  // ...
  if (opts.data) initData(vm)
  // ...
}
// ...
function initData(vm) {
  let data = vm.$options.data
  data = isFunction(data) ? data.call(vm) : data || {}
}
// ...
```
```js {all|0} {at:4}
// /vue/src/shared/utils.js
export function isFunction(value){
  return typeof value === 'function'
}
```

</div>
<div v-else>

```js {1,3,14|all} {at:5}
// /vue/src/state.js
import { isFunction } from './shared/utils.js'
import { observe } from './observer/index.js'
export function initState(vm) {
  // ...
  if (opts.data) initData(vm)
  // ...
}
// ...
function initData(vm) {
  let data = vm.$options.data
  data = isFunction(data) ? data.call(vm) : data || {}

  observe(data)
}
// ...
```
```js {all|0|all} {at:4}
// /vue/src/shared/utils.js
export function isFunction(value){
  return typeof value === 'function'
}
```
```js {all} {at:5}
// /vue/src/observer/index.js
export function observe(value) {
  console.log(value)
}
```

</div>
</v-clicks>

