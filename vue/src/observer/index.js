import { isObject } from '../shared/utils.js'
export function observe(value) {
  if(!isObject(value)) return

  return new Observer(value)
}

export class Observer {
  constructor(data) {
    const keys = Object.keys(data)
    for(let i = 0; i < keys.length; i++) {
      defineReactive(data, keys[i], data[keys[i]])
    }
  }
}

export function defineReactive(obj, key, value) {
  observe(value)
  Object.defineProperty(obj, key, {
    get() {
      return value
    },
    set(newValue) {
      if(value === newValue) return
      console.log('变了')
      value = newValue
      observe(newValue)
    }
  })
}
