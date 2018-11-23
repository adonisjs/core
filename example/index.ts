import { Ioc } from '../src/Ioc'

function inject (value: string | string[]) {
  return function decorator (constructor) {
    constructor.inject = constructor.inject || []
    constructor.inject = constructor.inject.concat(value)
  }
}

interface FooInterface {
  name: string
}

class Foo implements FooInterface {
  public name = 'foo'
}

@inject('App/Foo')
class Bar {
  constructor (public foo: FooInterface) {
  }
}

const container = new Ioc()
container.bind('App/Foo', () => {
  return new Foo()
})

console.log(container.make(Bar))
