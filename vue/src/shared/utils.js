export function isFunction(value){
  return typeof value === 'function'
}

export function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}
