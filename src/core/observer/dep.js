/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'
import config from '../config'

// Dep 实例的 id
let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  static target: ?Watcher;  // 当前的订阅者
  id: number;               // Dep 实例的 id
  subs: Array<Watcher>;     // 订阅者

  constructor () {
    this.id = uid++
    this.subs = []
  }

  /**
   * 添加订阅者
   * @param {Watcher} sub - 订阅者
   */
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  /**
   * 移除订阅者
   * @param {Watcher} sub - 订阅者
   */
  removeSub (sub: Watcher) {
    // remove 见 src/shared/util.js
    remove(this.subs, sub)
  }

  // 依赖收集，添加当前的 Watcher
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  // 通知
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
