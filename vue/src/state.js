export function initState(vm) {
  const opts = vm.$options
  // console.log(`initState ~ opts`, opts)
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) initData(vm)
  if (opts.copmuted) initComputed(vm, opts.computed)
  if (opts.watch) initWatch(vm, opts.watch)
}

function initProps(vm, propsOptions) { }
function initMethods(vm, methods) { }
function initData(vm) { }
function initComputed(vm, computed) { }
function initWatch(vm, watch) { }
