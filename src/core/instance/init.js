/* @flow */

import config from '../config'
import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { mark, measure } from '../util/perf'
import { initLifecycle, callHook } from './lifecycle'
import { initProvide, initInjections } from './inject'
import { extend, mergeOptions, formatComponentName } from '../util/index'

let uid = 0

export function initMixin(Vue: Class<Component>) {
  // åå§å Vue
  Vue.prototype._init = function (options?: Object) {
  // console.log(`ð ~ initMixin ~ options`, options)
    // Vue å®ä¾
    // this = {
    //    $data: undefined
    //    $isServer: false
    //    $props: undefined
    //    $ssrContext: undefined
    // }
    const vm: Component = this
    // a uid
    // ä¸º Vue å®ä¾æ·»å éå¢ uid
    vm._uid = uid++

    let startTag, endTag
    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      startTag = `vue-perf-start:${vm._uid}`
      endTag = `vue-perf-end:${vm._uid}`
      mark(startTag)
    }

    // a flag to avoid this being observed
    vm._isVue = true
    // console.log(`ð ~ initMixin ~ vm.constructor`, vm.constructor)
    // merge options
    // å¤çç»ä»¶éç½®é¡¹
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.
      initInternalComponent(vm, options)
    } else {
      // åå§åæ ¹ç»ä»¶æ¶èµ°è¿éï¼åå¹¶ Vue çå¨å±éç½®å°æ ¹ç»ä»¶çå±é¨éç½®
      // æ¯å¦ Vue.component æ³¨åçå¨å±ç»ä»¶ä¼åå¹¶å° æ ¹å®ä¾ç components éé¡¹ä¸­
      // è³äºæ¯ä¸ªå­ç»ä»¶çéé¡¹åå¹¶ååçå¨ä¸¤ä¸ªå°æ¹ï¼
      //   1ãVue.component æ¹æ³æ³¨åçå¨å±ç»ä»¶å¨æ³¨åæ¶åäºéé¡¹åå¹¶
      //   2ã{ components: { xx } } æ¹å¼æ³¨åçå±é¨ç»ä»¶å¨æ§è¡ç¼è¯å¨çæç 
      //      render å½æ°æ¶åäºéé¡¹åå¹¶ï¼åæ¬æ ¹ç»ä»¶ä¸­ç components éç½®
      vm.$options = mergeOptions(
        // vm.constructor æ¿å°åå»º vm å®ä¾å¯¹è±¡çæé å½æ°
        // è¥ Sub = Vue.extend(); s = new Sub()
        // å s.constructor ä¸º Sub èé Vue
        // æ­¤å¤ vm.constructor æçæ¯ Vue æé å½æ°
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
      // console.log(`ð ~ initMixin ~ vm.$options`, vm.$options)
    }
    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initInjections(vm) // resolve injections before data/props
    initState(vm)
    initProvide(vm) // resolve provide after data/props
    callHook(vm, 'created')

    /* istanbul ignore if */
    if (process.env.NODE_ENV !== 'production' && config.performance && mark) {
      vm._name = formatComponentName(vm, false)
      mark(endTag)
      measure(`vue ${vm._name} init`, startTag, endTag)
    }

    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

export function initInternalComponent(vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  const parentVnode = options._parentVnode
  opts.parent = options.parent
  opts._parentVnode = parentVnode

  const vnodeComponentOptions = parentVnode.componentOptions
  opts.propsData = vnodeComponentOptions.propsData
  opts._parentListeners = vnodeComponentOptions.listeners
  opts._renderChildren = vnodeComponentOptions.children
  opts._componentTag = vnodeComponentOptions.tag

  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions(Ctor: Class<Component>) {
  let options = Ctor.options
  // Vue åå§åæ¶ï¼ä¸èµ° if
  // options = {
  //   components: {KeepAlive, Transition, TransitionGroup},
  //   directives: {model, show},
  //   filters: Object.create(null),
  //   _base: Vue(options)
  // }
  if (Ctor.super) {
    const superOptions = resolveConstructorOptions(Ctor.super)
    const cachedSuperOptions = Ctor.superOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed,
      // need to resolve new options.
      Ctor.superOptions = superOptions
      // check if there are any late-modified/attached options (#4976)
      const modifiedOptions = resolveModifiedOptions(Ctor)
      // update base extend options
      if (modifiedOptions) {
        extend(Ctor.extendOptions, modifiedOptions)
      }
      options = Ctor.options = mergeOptions(superOptions, Ctor.extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}

function resolveModifiedOptions(Ctor: Class<Component>): ?Object {
  let modified
  const latest = Ctor.options
  const sealed = Ctor.sealedOptions
  for (const key in latest) {
    if (latest[key] !== sealed[key]) {
      if (!modified) modified = {}
      modified[key] = latest[key]
    }
  }
  return modified
}
