/* @flow */

import config from '../config'
import { warn } from './debug'
import { set } from '../observer/index'
import { unicodeRegExp } from './lang'
import { nativeWatch, hasSymbol } from './env'

import {
  ASSET_TYPES,
  LIFECYCLE_HOOKS
} from 'shared/constants'

import {
  extend,
  hasOwn,
  camelize,
  toRawType,
  capitalize,
  isBuiltInTag,
  isPlainObject
} from 'shared/util'

/**
 * Option overwriting strategies are functions that handle
 * how to merge a parent option value and a child option
 * value into the final value.
 */
// 初始化合并策略， 自定义合并策略见 https://cn.vuejs.org/v2/guide/mixins.html#%E8%87%AA%E5%AE%9A%E4%B9%89%E9%80%89%E9%A1%B9%E5%90%88%E5%B9%B6%E7%AD%96%E7%95%A5
// 此时 strats 是纯空对象 {}
const strats = config.optionMergeStrategies

/**
 * Options with restrictions
 * 非生产环境下的默认策略
 * 子组件没有有 el 属性
 * 例子见 /解析/杂例/子组件属性el合并策略.html
 */
if (process.env.NODE_ENV !== 'production') {
  strats.el = strats.propsData = function (parent, child, vm, key) {
    // 只有在 new Vue 时，mergeOptions 传递 vm，子类不传
    // 故没有 vm 即断定为子组件
    if (!vm) {
      warn(
        `option "${key}" can only be used during instance ` +
        'creation with the `new` keyword.'
      )
    }
    // defaultStrat 定义在本页
    // 此为默认策略，有子则子，无子则父
    return defaultStrat(parent, child)
  }
}

/**
 * Helper that recursively merges two data objects together.
 */
function mergeData (to: Object, from: ?Object): Object {
  // console.log(`🚀 ~ mergeData ~ to`, to)
  // console.log(`🚀 ~ mergeData ~ from`, from)
  // 没有来源，无需操作
  if (!from) return to
  let key, toVal, fromVal

  // hasSymbol 定义于 src/core/util/env.js
  // 用于判断当前环境是否支持 Symbol Reflect
  // Reflect 见 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Reflect
  const keys = hasSymbol
    ? Reflect.ownKeys(from)
    : Object.keys(from)

  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    // in case the object is already observed...
    // 已观察的对象才有属性 __ob__，但已观察为何走此，待研究。。。
    if (key === '__ob__') continue
    toVal = to[key]
    fromVal = from[key]
    if (!hasOwn(to, key)) {
      // 函数 set 见 解析/杂例/data合并策略.html
      // set 即 $set
      set(to, key, fromVal)
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      mergeData(toVal, fromVal)
    }
  }
  console.log(`🚀 ~ mergeData ~ to`, to)
  return to
}

/**
 * Data
 */
export function mergeDataOrFn (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  // console.log(`🚀 ~ parentVal`, parentVal)
  // console.log(`🚀 ~ childVal`, childVal)
  // console.log(`🚀 ~ vm`, vm)
  // !vm 则为子组件
  // 因无论是否为子组件，均可能有 data，而子组件不传参数 vm，故而此处加以判断
  if (!vm) {
    // in a Vue.extend merge, both should be functions
    // const Parent = Vue.extend({
    //   data(){
    //     return {parent: 1}
    //   }
    // })
    // const Child = Parent.extend({})
    // 例见 解析/杂例/data合并策略.html
    // 此时 childVal 不存在，parentVal 存在
    if (!childVal) {
      return parentVal
    }
    if (!parentVal) {
      return childVal
    }
    // when parentVal & childVal are both present,
    // we need to return a function that returns the
    // merged result of both functions... no need to
    // check if parentVal is a function here because
    // it has to be a function to pass previous merges.
    // 若父子均存在，则返回 mergeData
    return function mergedDataFn () {
      // 闭包, 返回时未执行
      return mergeData(
        typeof childVal === 'function' ? childVal.call(this, this) : childVal,
        typeof parentVal === 'function' ? parentVal.call(this, this) : parentVal
      )
    }
  } else {
    return function mergedInstanceDataFn () {
      // instance merge
      const instanceData = typeof childVal === 'function'
        ? childVal.call(vm, vm)
        : childVal
      const defaultData = typeof parentVal === 'function'
        ? parentVal.call(vm, vm)
        : parentVal
      if (instanceData) {
        return mergeData(instanceData, defaultData)
      } else {
        return defaultData
      }
    }
  }
}

// data 的合并策略
strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  // vm 以判断子组件
  if (!vm) {
    // 此处判断有无子选项，且类型不为函数，且为非生产环境
    // 子为对象，则可能污染父，故返回父
    if (childVal && typeof childVal !== 'function') {
      process.env.NODE_ENV !== 'production' && warn(
        'The "data" option should be a function ' +
        'that returns a per-instance value in component ' +
        'definitions.',
        vm
      )
      // 子则返父
      return parentVal
    }
    // 子 data 合并策略
    // mergeDataOrFn 定义于上方
    return mergeDataOrFn(parentVal, childVal)
  }

  // 父 data 合并策略
  return mergeDataOrFn(parentVal, childVal, vm)
}

/**
 * Hooks and props are merged as arrays.
 */
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res
    ? dedupeHooks(res)
    : res
}

function dedupeHooks (hooks) {
  const res = []
  for (let i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i])
    }
  }
  return res
}

LIFECYCLE_HOOKS.forEach(hook => {
  strats[hook] = mergeHook
})

/**
 * Assets
 *
 * When a vm is present (instance creation), we need to do
 * a three-way merge between constructor options, instance
 * options and parent options.
 */
function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    return extend(res, childVal)
  } else {
    return res
  }
}

ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})

/**
 * Watchers.
 *
 * Watchers hashes should not overwrite one
 * another, so we merge them as arrays.
 */
strats.watch = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  // work around Firefox's Object.prototype.watch...
  if (parentVal === nativeWatch) parentVal = undefined
  if (childVal === nativeWatch) childVal = undefined
  /* istanbul ignore if */
  if (!childVal) return Object.create(parentVal || null)
  if (process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = {}
  extend(ret, parentVal)
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    ret[key] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child]
  }
  return ret
}

/**
 * Other object hashes.
 */
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  if (childVal && process.env.NODE_ENV !== 'production') {
    assertObjectType(key, childVal, vm)
  }
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  if (childVal) extend(ret, childVal)
  return ret
}
strats.provide = mergeDataOrFn

/**
 * Default strategy.
 */
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
    ? parentVal
    : childVal
}

/**
 * Validate component names
 */
function checkComponents (options: Object) {
  for (const key in options.components) {
    // 遍历组件名，传入 validateComponentName 校验
    validateComponentName(key)
  }
}

export function validateComponentName (name: string) {
  // 校验组件名
  // 此处正则校验是否满足 HTML5 自定义标签规范
  // 规范见：https://www.w3.org/TR/html53/semantics-scripting.html#potentialcustomelementname
  if (!new RegExp(`^[a-zA-Z][\\-\\.0-9_${unicodeRegExp.source}]*$`).test(name)) {
    warn(
      'Invalid component name: "' + name + '". Component names ' +
      'should conform to valid custom element name in html5 specification.'
    )
  }
  // isBuiltInTag 校验组件名是否为 Vue 内置的 slot component 标签
  // isReservedTag 校验是否为 html 及部分 svg 保留标签。重写于 /src/platforms/web/util/element.js
  if (isBuiltInTag(name) || config.isReservedTag(name)) {
    warn(
      'Do not use built-in or reserved HTML elements as component ' +
      'id: ' + name
    )
  }
}

/**
 * Ensure all props option syntax are normalized into the
 * Object-based format.
 * 格式化属性为对象格式
 */
function normalizeProps (options: Object, vm: ?Component) {
  const props = options.props
  if (!props) return
  const res = {}
  let i, val, name
  // 字符串形式，如 ['propA', 'propB', 'propC']
  if (Array.isArray(props)) {
    //                          props: {
    //                            myProp: {
    // props: ['myProp']   ==>      type: null
    //                            }
    //                          }
    i = props.length
    while (i--) {
      val = props[i]
      if (typeof val === 'string') {
        // camelize 见 src/shared/util.js
        // 转化字符串为驼峰形式，如 my-prop => myProp
        name = camelize(val)
        // 规范成对象格式
        res[name] = { type: null }
      } else if (process.env.NODE_ENV !== 'production') {
        // 若数组内非字符串，非生产环境报错
        // 生产环境已经可以保证合法，无需判断
        warn('props must be strings when using array syntax.')
      }
    }
    // isPlainObject 见 src/shared/util.js
    // 判断是否为纯对象 [object Object]
  } else if (isPlainObject(props)) {
    //  props: {                 props: {
    //    myProp1: String,         myProp1: {
    //    myProp2: {        ==>      type: String,
    //      type: Boolean,         },
    //      default: false         myProp2: {
    //  }                            type: Boolean,
    //                               default: false  
    //                             }
    //                           }
    for (const key in props) {
      val = props[key]
      // 转驼峰
      name = camelize(key)
      res[name] = isPlainObject(val)
        ? val
        : { type: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    // 非生产环境，props 不是数据或对象，则报错
    // 此举可保证生产环境正确
    warn(
      `Invalid value for option "props": expected an Array or an Object, ` +
      `but got ${toRawType(props)}.`,
      vm
    )
  }
  // 将规范好的结果覆盖原 props
  options.props = res
}

/**
 * Normalize all injections into Object-based format
 * inject 两种形式： ['myInject']
 *            {
 *              renameInject: 'myInject
 *            }
 * 此函数合二为一
 */
function normalizeInject (options: Object, vm: ?Component) {
  const inject = options.inject
  if (!inject) return
  // normalized 和 options.inject 同源
  const normalized = options.inject = {}
  // inject 为数组时
  if (Array.isArray(inject)) {
    for (let i = 0; i < inject.length; i++) {
      normalized[inject[i]] = { from: inject[i] }
    }
    // inject 为对象时
  } else if (isPlainObject(inject)) {
    for (const key in inject) {
      const val = inject[key]
      normalized[key] = isPlainObject(val)
        ? extend({ from: key }, val)  // extend 见 src/shared/util.js
        : { from: val }
    }
  } else if (process.env.NODE_ENV !== 'production') {
    warn(
      `Invalid value for option "inject": expected an Array or an Object, ` +
      `but got ${toRawType(inject)}.`,
      vm
    )
  }
}

/**
 * Normalize raw function directives into object format.
 */
function normalizeDirectives (options: Object) {
  const dirs = options.directives
  if (dirs) {
    for (const key in dirs) {
      const def = dirs[key]
      if (typeof def === 'function') {
        dirs[key] = { bind: def, update: def }
      }
    }
  }
}

function assertObjectType (name: string, value: any, vm: ?Component) {
  if (!isPlainObject(value)) {
    warn(
      `Invalid value for option "${name}": expected an Object, ` +
      `but got ${toRawType(value)}.`,
      vm
    )
  }
}

/**
 * Merge two option objects into a new one.
 * Core utility used in both instantiation and inheritance.
 * 选项合并函数，会返回新的的选项
 */
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  // console.log(`🚀 ~ normalizeProps ~ child11111`, child)
  // 校验工作完成于非生产环境，生产环境下不必再校验，巧妙
  if (process.env.NODE_ENV !== 'production') {
    // 检查组件名
    // 要有 child.components 才检查
    checkComponents(child)
  }

  // 此处说明 child 亦可为函数，只有 Vue 构造函数有静态属性 options
  // Vue.extend 生成的子类也有 options 属性
  // 选项 extends 的类型可以是对象也可以是函数，例子见 /解析/杂例/选项extends合并.html
  // console.log(`🚀 ~ child`, child)
  if (typeof child === 'function') {
    child = child.options
  }

  // 规范化属性
  // Vue 中声明组件选项的方法众多，如：
  // props: ['myProp']
  // props: {
  //   myProp: {
  //     type: Number,
  //     default: 0
  //   }
  // }
  // 选项 options 在开发时写法众多，此三个方法用以统一写法
  normalizeProps(child, vm)  // 规范 props 为对象
  normalizeInject(child, vm) // 规范 inject 为对象，inject 见 https://cn.vuejs.org/v2/guide/components-edge-cases.html#%E4%BE%9D%E8%B5%96%E6%B3%A8%E5%85%A5
  normalizeDirectives(child) // 规范自定义指令为统一写法，见 https://cn.vuejs.org/v2/guide/custom-directive.html

  // Apply extends and mixins on the child options,
  // but only if it is a raw options object that isn't
  // the result of another mergeOptions call.
  // Only merged options has the _base property.
  // 合并过的选项有 _base 属性，_base 在何处，待查证
  if (!child._base) {
    // 选项 extends 合并 见 https://cn.vuejs.org/v2/api/#extends
    if (child.extends) {
      parent = mergeOptions(parent, child.extends, vm)
    }
    // 选项 mixins 合并，mixins 是对象数组 见 https://cn.vuejs.org/v2/api/#mixins
    if (child.mixins) {
      for (let i = 0, l = child.mixins.length; i < l; i++) {
        parent = mergeOptions(parent, child.mixins[i], vm)
      }
    }
  }

  // 选项整理后存放于此
  const options = {}
  let key
  // parent = {
  //   component: {...},
  //   directives: {...},
  //   filters: {...},
  //   _base: Vue
  // }
  // key 即 ['component', 'directives', 'filters', '_base']
  for (key in parent) {
    mergeField(key)
  }
  // child 为 new Vue 传入的对象参数
  // {
  //   el: '#app',
  //   data: {},
  //   ...
  // }
  for (key in child) {
    // 处理父级没有的属性
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  // console.log(`🚀 ~ mergeField ~ strats`, strats)
  // console.log(`🚀 ~ mergeField ~ defaultStrat`, defaultStrat)
  function mergeField (key) {
    // 常量 strats 为合并策略，定义在顶部
    // 生产环境，因 strats.el 和 strats.propData 为 undefined，故而直接走 defaultStrat
    // console.log(`🚀 ~ mergeField ~ strats[key]`, key)
    // defaultStrat 定义在本文件。默认策略是，有子则子，无子则父
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}

/**
 * Resolve an asset.
 * This function is used because child instances need access
 * to assets defined in its ancestor chain.
 */
export function resolveAsset (
  options: Object,
  type: string,
  id: string,
  warnMissing?: boolean
): any {
  /* istanbul ignore if */
  if (typeof id !== 'string') {
    return
  }
  const assets = options[type]
  // check local registration variations first
  if (hasOwn(assets, id)) return assets[id]
  const camelizedId = camelize(id)
  if (hasOwn(assets, camelizedId)) return assets[camelizedId]
  const PascalCaseId = capitalize(camelizedId)
  if (hasOwn(assets, PascalCaseId)) return assets[PascalCaseId]
  // fallback to prototype chain
  const res = assets[id] || assets[camelizedId] || assets[PascalCaseId]
  if (process.env.NODE_ENV !== 'production' && warnMissing && !res) {
    warn(
      'Failed to resolve ' + type.slice(0, -1) + ': ' + id,
      options
    )
  }
  return res
}
