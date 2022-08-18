import { def } from '../shared/lang.js'

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

methodsToPatch.forEach((method) => {
  const original = arrayProto[method]
  def(arrayMethods, method, function(...args) {
    const result = original.apply(this, args)
    const ob = this.__ob__
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break;
      case 'splice':
        inserted = args.slice(2)
        break;
    }
    if(inserted) ob.observeArray(inserted)
    return result
  })
})
