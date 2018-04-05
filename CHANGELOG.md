<a name="4.0.8"></a>
## [4.0.8](https://github.com/poppinss/adonis-fold/compare/v4.0.7...v4.0.8) (2018-04-05)


### Bug Fixes

* **registrar:** execute extend calls after register ([f8b1a7e](https://github.com/poppinss/adonis-fold/commit/f8b1a7e))



<a name="4.0.7"></a>
## [4.0.7](https://github.com/poppinss/adonis-fold/compare/v4.0.6...v4.0.7) (2018-02-08)


### Bug Fixes

* **ioc.getPath:** normalize autoloaded paths ([a0a77bc](https://github.com/poppinss/adonis-fold/commit/a0a77bc))



<a name="4.0.6"></a>
## [4.0.6](https://github.com/poppinss/adonis-fold/compare/v4.0.5...v4.0.6) (2018-02-08)


### Features

* **ioc:** add getPath method to ioc class ([9b37695](https://github.com/poppinss/adonis-fold/commit/9b37695))
* **resolver:** exposing resolver to globals via iocResolver ([9cc5959](https://github.com/poppinss/adonis-fold/commit/9cc5959))
* **resolver:** resolver.getPath returns abs path to binding file ([2188ea0](https://github.com/poppinss/adonis-fold/commit/2188ea0))



<a name="4.0.5"></a>
## [4.0.5](https://github.com/poppinss/adonis-fold/compare/v4.0.3...v4.0.5) (2017-10-29)


### Bug Fixes

* **ioc:** fix execution cycle of extend calls ([bc2c084](https://github.com/poppinss/adonis-fold/commit/bc2c084))



<a name="4.0.4"></a>
## [4.0.4](https://github.com/poppinss/adonis-fold/compare/v4.0.3...v4.0.4) (2017-09-12)


### Bug Fixes

* **ioc:** fix execution cycle of extend calls ([bc2c084](https://github.com/poppinss/adonis-fold/commit/bc2c084))



<a name="4.0.3"></a>
## [4.0.3](https://github.com/poppinss/adonis-fold/compare/v4.0.2...v4.0.3) (2017-09-06)


### Features

* **ioc:** add singletonFake method to register fakes ([bd5376d](https://github.com/poppinss/adonis-fold/commit/bd5376d))



<a name="4.0.2"></a>
## [4.0.2](https://github.com/poppinss/adonis-fold/compare/v4.0.1...v4.0.2) (2017-08-02)


### Bug Fixes

* **resolver:** translate full namespace correctly ([9f727f3](https://github.com/poppinss/adonis-fold/commit/9f727f3))


### Features

* **exceptions:** use generic-exceptions package ([20f9d08](https://github.com/poppinss/adonis-fold/commit/20f9d08))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/poppinss/adonis-fold/compare/v4.0.0...v4.0.1) (2017-07-30)



<a name="4.0.0"></a>
# [4.0.0](https://github.com/poppinss/adonis-fold/compare/v3.0.3...v4.0.0) (2017-06-21)


### Features

* first commit for 4.0 dawn ([9e728a0](https://github.com/poppinss/adonis-fold/commit/9e728a0))
* **ioc:** add suport for escaped bindings ([8ee7554](https://github.com/poppinss/adonis-fold/commit/8ee7554))
* **registrar:** register and boot providers in multiple steps ([9732d75](https://github.com/poppinss/adonis-fold/commit/9732d75))
* **resolver:** add resolver to resolve dependencies ([bab45fc](https://github.com/poppinss/adonis-fold/commit/bab45fc))



<a name="3.0.3"></a>
## 3.0.3 (2016-08-26)

### Features

* **ioc:** add event and support for fakes ([98fae41](https://github.com/poppinss/adonis-fold/commit/98fae41))
* **providers:** add support for boot method ([f7157a4](https://github.com/poppinss/adonis-fold/commit/f7157a4))


<a name="3.0.2"></a>
## 3.0.2 (2016-06-26)


### Bug Fixes

* **Ioc:** do not transform output after calling hooks([8bc17ef](https://github.com/poppinss/adonis-fold/commit/8bc17ef))


### Features

* **ioc:** add support for makePlain property([33ab0bf](https://github.com/poppinss/adonis-fold/commit/33ab0bf))
* **ioc:** Ioc.extend to pass all args to manager extend method([082060c](https://github.com/poppinss/adonis-fold/commit/082060c))
* **package.json:** Added commitizen([8a8fd3c](https://github.com/poppinss/adonis-fold/commit/8a8fd3c))


### Performance Improvements

* **ioc,registerar:** triming namespaces and providers, improved var initialization for v8([c5e04ad](https://github.com/poppinss/adonis-fold/commit/c5e04ad))



<a name="3.0.1"></a>
## 3.0.1 (2016-04-30)


### Bug Fixes

* **Ioc:** do not transform output after calling hooks ([8bc17ef](https://github.com/poppinss/adonis-fold/commit/8bc17ef))

### Features

* **ioc:** add support for makePlain property ([33ab0bf](https://github.com/poppinss/adonis-fold/commit/33ab0bf))
* **package.json:** Added commitizen ([8a8fd3c](https://github.com/poppinss/adonis-fold/commit/8a8fd3c))

### Performance Improvements

* **ioc,registerar:** triming namespaces and providers, improved var initialization for v8 ([c5e04ad](https://github.com/poppinss/adonis-fold/commit/c5e04ad))



<a name="2.0.1"></a>
## 2.0.1 (2016-01-15)

### feat

* feat(package.json): Added commitizen ([8a8fd3c](https://github.com/poppinss/adonis-fold/commit/8a8fd3c))

### refactor

* refactor(ioc): Improved ioc extend method workflow ([47ffdb2](https://github.com/poppinss/adonis-fold/commit/47ffdb2))

* Added debugging logs ([7fd661e](https://github.com/poppinss/adonis-fold/commit/7fd661e))
* Added jshintrc and formatted files ([d584c82](https://github.com/poppinss/adonis-fold/commit/d584c82))
* Added support to require node module from ioc container ([c067fcc](https://github.com/poppinss/adonis-fold/commit/c067fcc))
* Added support to transform output using hooks from autoloaded paths ([247d87f](https://github.com/poppinss/adonis-fold/commit/247d87f))
* Also made make global ([95285ec](https://github.com/poppinss/adonis-fold/commit/95285ec))
* Also resolving alias from make method ([bda90f9](https://github.com/poppinss/adonis-fold/commit/bda90f9))
* Exposed modules via index.js file and added readme ([217ad2c](https://github.com/poppinss/adonis-fold/commit/217ad2c))
* Fixed makeFunc error where class name was printing as object ([6e177e6](https://github.com/poppinss/adonis-fold/commit/6e177e6))
* Formatted source files and removed unnecessary files ([b3123ab](https://github.com/poppinss/adonis-fold/commit/b3123ab))
* Improved make method ([ed0fa07](https://github.com/poppinss/adonis-fold/commit/ed0fa07))
* Increased priority of alias over autoload in use method ([4c27a13](https://github.com/poppinss/adonis-fold/commit/4c27a13))
* Made jshint happy and added houndci ([b156641](https://github.com/poppinss/adonis-fold/commit/b156641))
* Made make also global ([9be6049](https://github.com/poppinss/adonis-fold/commit/9be6049))
* Made use global and removed unwanted dependencies ([ed99dbb](https://github.com/poppinss/adonis-fold/commit/ed99dbb))
* Merge 2.0 ([a260229](https://github.com/poppinss/adonis-fold/commit/a260229))
* Moved logs from verbose to debug ([7299cfd](https://github.com/poppinss/adonis-fold/commit/7299cfd))
* npm version bump ([6dd5180](https://github.com/poppinss/adonis-fold/commit/6dd5180))
* refactor(readme,contributing,license): Added files important for github presence ([69a008f](https://github.com/poppinss/adonis-fold/commit/69a008f))
* Removed hound and jshint with standardjs ([b350e46](https://github.com/poppinss/adonis-fold/commit/b350e46))
* Removed Logger src and using cat-log instead & added aliases method to ioc ([5a536af](https://github.com/poppinss/adonis-fold/commit/5a536af))
* Replaced debug with custom logger ([2179df7](https://github.com/poppinss/adonis-fold/commit/2179df7))
* Sorry switched back to verbose mode (sorry is for git) ([ac30d8a](https://github.com/poppinss/adonis-fold/commit/ac30d8a))
* Updated code annotations ([18a913c](https://github.com/poppinss/adonis-fold/commit/18a913c))
* Updated npm ignore ([33b0d75](https://github.com/poppinss/adonis-fold/commit/33b0d75))
* Updated package file and added MIT license ([3bfeb26](https://github.com/poppinss/adonis-fold/commit/3bfeb26))
* Updated travis file and remove cz-changelog dependency ([50b7d46](https://github.com/poppinss/adonis-fold/commit/50b7d46))
* v2 initial commit ([474575c](https://github.com/poppinss/adonis-fold/commit/474575c))
