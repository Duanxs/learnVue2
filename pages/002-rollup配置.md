---
name: rollup 配置
clicks: 10
---

# rollup 配置

<div class="grid grid-cols-2 gap-x-4 gap-y-6">

```js {all|3|4-9|5|6|7|8|all} {at:0}
// rollup.config.js
export default {
  input: './vue/src/index.js',
  output: {
    file: './vue/dist/umd/vue.js',
    name: 'Vue',
    format: 'umd',
    soucemap: true
  }
}
```
<v-clicks at="0">

- 根目录新建 `rollup.config.js`，用以配置 `rollup`
- 入口文件
- 输出配置
- 输出文件名
- 打包后全局变量名
- 打包规范
- 开启源码调试，可快速定位报错

</v-clicks>

<v-clicks at="8">

- 在 `package.json` 添加启动脚本
- `-c` 表示使用刚刚创建好的 `rollup.config.js` 配置文件
- `-w` 表示监听改动，重新打包

</v-clicks>

<v-clicks at="8">

```json {4}
{
  ...
  "scripts": {
    "vue-dev": "rollup -c -w"
  },
  ...
}
```

</v-clicks>



</div>

<arrow v-click="8" x1="345" y1="388" x2="530" y2="450" color="#564" width="3" arrowSize="1" />
