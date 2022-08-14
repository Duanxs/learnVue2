import { initMixin } from './init.js'

function Vue(options) {
  this._init(options)
}

initMixin(Vue)
// stateMixin(Vue) // $data $props $set $delete $watch
// eventsMixin(Vue) // $on $once $off $emit
// lifecycleMixin(Vue) // _update $forceUpdate $destroy
// renderMixin(Vue) // $nextTick _render

export default Vue
