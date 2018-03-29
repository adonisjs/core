<a name="5.0.6"></a>
## [5.0.6](https://github.com/adonisjs/adonis-framework/compare/v5.0.4...v5.0.6) (2018-03-29)


### Features

* **Encryption:** allows custom encryption instances via getInstance method ([60859f5](https://github.com/adonisjs/adonis-framework/commit/60859f5))
* **route:** add namespace function ([556a213](https://github.com/adonisjs/adonis-framework/commit/556a213))


<a name="5.0.5"></a>
## [5.0.5](https://github.com/adonisjs/adonis-framework/compare/v5.0.4...v5.0.5) (2018-03-15)



<a name="5.0.4"></a>
## [5.0.4](https://github.com/adonisjs/adonis-framework/compare/v5.0.3...v5.0.4) (2018-02-08)


### Bug Fixes

* **server:** allow named middleware to be used multiple times ([b1d04ef](https://github.com/adonisjs/adonis-framework/commit/b1d04ef))



<a name="5.0.3"></a>
## [5.0.3](https://github.com/adonisjs/adonis-framework/compare/v5.0.2...v5.0.3) (2018-02-08)



<a name="5.0.2"></a>
## [5.0.2](https://github.com/adonisjs/adonis-framework/compare/v5.0.1...v5.0.2) (2018-02-08)


### Bug Fixes

* **server:** bindException handler on listen ([3083662](https://github.com/adonisjs/adonis-framework/commit/3083662))



<a name="5.0.1"></a>
## [5.0.1](https://github.com/adonisjs/adonis-framework/compare/v5.0.0...v5.0.1) (2018-02-07)



<a name="5.0.0"></a>
# [5.0.0](https://github.com/adonisjs/adonis-framework/compare/v4.0.30...v5.0.0) (2018-01-31)


### Bug Fixes

* **exception:** cleanup logic around exception handling ([b10e6f7](https://github.com/adonisjs/adonis-framework/commit/b10e6f7)), closes [#718](https://github.com/adonisjs/adonis-framework/issues/718)
* **logger:** logger.level should update the driver level ([2d8f9f3](https://github.com/adonisjs/adonis-framework/commit/2d8f9f3)), closes [#760](https://github.com/adonisjs/adonis-framework/issues/760)
* **logger:** logger.level should update the driver level ([9fd6b49](https://github.com/adonisjs/adonis-framework/commit/9fd6b49)), closes [#760](https://github.com/adonisjs/adonis-framework/issues/760)
* **package:** lock packages ([67db34b](https://github.com/adonisjs/adonis-framework/commit/67db34b))
* **package:** update dotenv to version 5.0.0 ([#781](https://github.com/adonisjs/adonis-framework/issues/781)) ([8b58ee8](https://github.com/adonisjs/adonis-framework/commit/8b58ee8))
* **Server:** call .send when ending response from controller ([11cf1ec](https://github.com/adonisjs/adonis-framework/commit/11cf1ec))


### Features

* **config:** remove self reference config support ([9239267](https://github.com/adonisjs/adonis-framework/commit/9239267))


### Performance Improvements

* **Server:** parse middleware when registering them ([5423b70](https://github.com/adonisjs/adonis-framework/commit/5423b70))


### BREAKING CHANGES

* **exception:** `Exception.bind` or `Exception.handle('*')` will stop working



<a name="4.0.31"></a>
## [4.0.31](https://github.com/adonisjs/adonis-framework/compare/v4.0.30...v4.0.31) (2018-01-19)


### Bug Fixes

* **logger:** logger.level should update the driver level ([2d8f9f3](https://github.com/adonisjs/adonis-framework/commit/2d8f9f3)), closes [#760](https://github.com/adonisjs/adonis-framework/issues/760)
* **package:** lock packages ([67db34b](https://github.com/adonisjs/adonis-framework/commit/67db34b))



<a name="4.0.30"></a>
## [4.0.30](https://github.com/adonisjs/adonis-framework/compare/v4.0.29...v4.0.30) (2018-01-12)


### Bug Fixes

* **Config:** fix flaky behavior of self referencing values ([02ecc1b](https://github.com/adonisjs/adonis-framework/commit/02ecc1b)), closes [#756](https://github.com/adonisjs/adonis-framework/issues/756)
* **route:** group middleware return this for chainable api ([c231368](https://github.com/adonisjs/adonis-framework/commit/c231368))



<a name="4.0.29"></a>
## [4.0.29](https://github.com/adonisjs/adonis-framework/compare/v4.0.28...v4.0.29) (2018-01-12)


### Bug Fixes

* **Config:** config.merge resolve self referenced values ([08ad264](https://github.com/adonisjs/adonis-framework/commit/08ad264))
* **package:** update eventemitter2 to version 5.0.0 ([#738](https://github.com/adonisjs/adonis-framework/issues/738)) ([14265de](https://github.com/adonisjs/adonis-framework/commit/14265de))
* **Route:** Route.url should entertain domains ([a814afe](https://github.com/adonisjs/adonis-framework/commit/a814afe)), closes [#713](https://github.com/adonisjs/adonis-framework/issues/713)


### Features

* **logger:** expose levels on the logger instance ([77a3ace](https://github.com/adonisjs/adonis-framework/commit/77a3ace))

<a name="4.0.28"></a>
## [4.0.28](https://github.com/adonisjs/adonis-framework/compare/v4.0.27...v4.0.28) (2017-11-28)


### Bug Fixes

* **route:** group middleware return this for chainable api ([a6ec02c](https://github.com/adonisjs/adonis-framework/commit/a6ec02c))



<a name="4.0.27"></a>
## [4.0.27](https://github.com/adonisjs/adonis-framework/compare/v4.0.26...v4.0.27) (2017-11-08)



<a name="4.0.26"></a>
## [4.0.26](https://github.com/adonisjs/adonis-framework/compare/v4.0.25...v4.0.26) (2017-10-30)



<a name="4.0.25"></a>
## [4.0.25](https://github.com/adonisjs/adonis-framework/compare/v4.0.24...v4.0.25) (2017-10-29)


### Bug Fixes

* **resource:** apply routes in order ([348f38f](https://github.com/adonisjs/adonis-framework/commit/348f38f))


### Features

* **context:** add onReady event to context ([55edfbb](https://github.com/adonisjs/adonis-framework/commit/55edfbb))
* **loggedin:** remove loggedin tag and add inside auth repo ([60fccef](https://github.com/adonisjs/adonis-framework/commit/60fccef))



<a name="4.0.24"></a>
## [4.0.24](https://github.com/adonisjs/adonis-framework/compare/v4.0.23...v4.0.24) (2017-10-08)


### Bug Fixes

* **exception:** fallback to inline handler when binding method is missing ([d6a9d89](https://github.com/adonisjs/adonis-framework/commit/d6a9d89))



<a name="4.0.23"></a>
## [4.0.23](https://github.com/adonisjs/adonis-framework/compare/v4.0.22...v4.0.23) (2017-10-03)


### Bug Fixes

* **event:** use in-memory fake over binding to ioc ([624d6a1](https://github.com/adonisjs/adonis-framework/commit/624d6a1))
* **request:** add missing .format method ([0d302c4](https://github.com/adonisjs/adonis-framework/commit/0d302c4)), closes [#662](https://github.com/adonisjs/adonis-framework/issues/662)


### Features

* **response:** add abortIf and abortUnless methods ([12fa34c](https://github.com/adonisjs/adonis-framework/commit/12fa34c))
* **response:** allow option to disable etag for response ([0ab1d3d](https://github.com/adonisjs/adonis-framework/commit/0ab1d3d)), closes [#641](https://github.com/adonisjs/adonis-framework/issues/641)



<a name="4.0.22"></a>
## [4.0.22](https://github.com/adonisjs/adonis-framework/compare/v4.0.21...v4.0.22) (2017-09-27)


### Features

* **env:** add option to expand values ([66d18d7](https://github.com/adonisjs/adonis-framework/commit/66d18d7))



<a name="4.0.21"></a>
## [4.0.21](https://github.com/adonisjs/adonis-framework/compare/v4.0.20...v4.0.21) (2017-09-25)


### Bug Fixes

* **route:** clean keys before making route regex ([959ed4c](https://github.com/adonisjs/adonis-framework/commit/959ed4c))



<a name="4.0.20"></a>
## [4.0.20](https://github.com/adonisjs/adonis-framework/compare/v4.0.19...v4.0.20) (2017-09-24)


### Bug Fixes

* **route:** wildcard bug after regexp upgrade ([c7ebb4d](https://github.com/adonisjs/adonis-framework/commit/c7ebb4d))



<a name="4.0.19"></a>
## [4.0.19](https://github.com/adonisjs/adonis-framework/compare/v4.0.18...v4.0.19) (2017-09-23)


### Bug Fixes

* **event:** fix breaking test for event fake ([58ba005](https://github.com/adonisjs/adonis-framework/commit/58ba005))
* **logger:** supress breaking changes ([6995a40](https://github.com/adonisjs/adonis-framework/commit/6995a40))
* **ViewProvider:** create by default the View alias ([#636](https://github.com/adonisjs/adonis-framework/issues/636)) ([3c36453](https://github.com/adonisjs/adonis-framework/commit/3c36453))


### Features

* **env:** load .env.testing when in testing mode ([c1dde5f](https://github.com/adonisjs/adonis-framework/commit/c1dde5f))
* **event:** add event fake for testing ([ad07db7](https://github.com/adonisjs/adonis-framework/commit/ad07db7))
* **logger:** add option to re-use drivers ([1b72f83](https://github.com/adonisjs/adonis-framework/commit/1b72f83))



<a name="4.0.18"></a>
## [4.0.18](https://github.com/adonisjs/adonis-framework/compare/v4.0.17...v4.0.18) (2017-09-03)


### Bug Fixes

* **server:** handle response end use cases of server middleware ([c04eedb](https://github.com/adonisjs/adonis-framework/commit/c04eedb))



<a name="4.0.17"></a>
## [4.0.17](https://github.com/adonisjs/adonis-framework/compare/v4.0.16...v4.0.17) (2017-09-02)


### Bug Fixes

* **request:** re-compute all when body is set ([f324123](https://github.com/adonisjs/adonis-framework/commit/f324123))



<a name="4.0.16"></a>
## [4.0.16](https://github.com/adonisjs/adonis-framework/compare/v4.0.15...v4.0.16) (2017-08-29)


### Bug Fixes

* **req,res:** reference `app.appKey` over `.secret` ([ef22649](https://github.com/adonisjs/adonis-framework/commit/ef22649))



<a name="4.0.15"></a>
## [4.0.15](https://github.com/adonisjs/adonis-framework/compare/v4.0.14...v4.0.15) (2017-08-25)


### Bug Fixes

* **env:** load method should allow overwriting vars ([3ded1bd](https://github.com/adonisjs/adonis-framework/commit/3ded1bd))



<a name="4.0.14"></a>
## [4.0.14](https://github.com/adonisjs/adonis-framework/compare/v4.0.13...v4.0.14) (2017-08-22)



<a name="4.0.13"></a>
## [4.0.13](https://github.com/adonisjs/adonis-framework/compare/v4.0.12...v4.0.13) (2017-08-22)


### Bug Fixes

* **request:** this.all return proper object ([b65b91c](https://github.com/adonisjs/adonis-framework/commit/b65b91c))
* **response:** read jsonpCallback from config file ([8ba479e](https://github.com/adonisjs/adonis-framework/commit/8ba479e))
* **view:** parse true string for caching views ([00ff73f](https://github.com/adonisjs/adonis-framework/commit/00ff73f))



<a name="4.0.12"></a>
## [4.0.12](https://github.com/adonisjs/adonis-framework/compare/v4.0.11...v4.0.12) (2017-08-22)


### Bug Fixes

* **request:** method spoofing make sure request is POST ([1008ec7](https://github.com/adonisjs/adonis-framework/commit/1008ec7))
* **request:** return the same object when calling request.all ([6878d65](https://github.com/adonisjs/adonis-framework/commit/6878d65))
* **server:** multiple registerNamed are allowed ([a105185](https://github.com/adonisjs/adonis-framework/commit/a105185))



<a name="4.0.11"></a>
## [4.0.11](https://github.com/adonisjs/adonis-framework/compare/v4.0.10...v4.0.11) (2017-08-18)


### Features

* **hash:** add mock class for testing ([6974b1f](https://github.com/adonisjs/adonis-framework/commit/6974b1f))
* **traits:** expose hash mock via traits ([93af338](https://github.com/adonisjs/adonis-framework/commit/93af338))



<a name="4.0.10"></a>
## [4.0.10](https://github.com/adonisjs/adonis-framework/compare/v4.0.9...v4.0.10) (2017-08-11)


### Bug Fixes

* **view:** fix inlineSvg tag by escaping backslash ([5223064](https://github.com/adonisjs/adonis-framework/commit/5223064))



<a name="4.0.9"></a>
## [4.0.9](https://github.com/adonisjs/adonis-framework/compare/v4.0.8...v4.0.9) (2017-08-11)


### Bug Fixes

* **env:** load .env file on providers boot ([9282a83](https://github.com/adonisjs/adonis-framework/commit/9282a83))


### Features

* **response:** enhance redirect method & add route redirects ([e7bf506](https://github.com/adonisjs/adonis-framework/commit/e7bf506))
* **route:** route.render accepts data with view now ([b9812b9](https://github.com/adonisjs/adonis-framework/commit/b9812b9))
* **Route:** add brisk route for quick routes ([dbc1618](https://github.com/adonisjs/adonis-framework/commit/dbc1618))
* **Route:** make routes macroable ([16e35bb](https://github.com/adonisjs/adonis-framework/commit/16e35bb))



<a name="4.0.8"></a>
## [4.0.8](https://github.com/adonisjs/adonis-framework/compare/v4.0.7...v4.0.8) (2017-08-08)


### Bug Fixes

* **provider:** reference auth inside view as locals ([5653e65](https://github.com/adonisjs/adonis-framework/commit/5653e65))


### Features

* **response:** add support to redirect back ([a237e4c](https://github.com/adonisjs/adonis-framework/commit/a237e4c))



<a name="4.0.7"></a>
## [4.0.7](https://github.com/adonisjs/adonis-framework/compare/v4.0.6...v4.0.7) (2017-08-05)


### Bug Fixes

* **exception:** fix resolving wildcard handler & reporter ([a0e692a](https://github.com/adonisjs/adonis-framework/commit/a0e692a))
* **response:** make redirect lazy too ([cf53eef](https://github.com/adonisjs/adonis-framework/commit/cf53eef))
* **view-example:** fix docblock example ([#615](https://github.com/adonisjs/adonis-framework/issues/615)) ([ff56c59](https://github.com/adonisjs/adonis-framework/commit/ff56c59))


### Features

* **route:** add method to make urls ([41972f1](https://github.com/adonisjs/adonis-framework/commit/41972f1))
* **view:** add view tags and globals ([d4821e0](https://github.com/adonisjs/adonis-framework/commit/d4821e0))



<a name="4.0.6"></a>
## [4.0.6](https://github.com/adonisjs/adonis-framework/compare/v4.0.5...v4.0.6) (2017-08-02)


### Bug Fixes

* **logger:** improve proxy get method ([257e0d0](https://github.com/adonisjs/adonis-framework/commit/257e0d0))
* **server:** use logger.warning over logger.warn ([279f61c](https://github.com/adonisjs/adonis-framework/commit/279f61c))


### Features

* **exceptions:** use generic-exceptions ([1f63cbd](https://github.com/adonisjs/adonis-framework/commit/1f63cbd))



<a name="4.0.5"></a>
## [4.0.5](https://github.com/adonisjs/adonis-framework/compare/v4.0.4...v4.0.5) (2017-07-28)


### Features

* **route:** add list method to list routes ([6c96de6](https://github.com/adonisjs/adonis-framework/commit/6c96de6))



<a name="4.0.4"></a>
## [4.0.4](https://github.com/adonisjs/adonis-framework/compare/v4.0.3...v4.0.4) (2017-07-18)


### Features

* **response:** add support for clear existing cookie ([14de180](https://github.com/adonisjs/adonis-framework/commit/14de180))
* **response:** add support to disable implicit end ([7c117e4](https://github.com/adonisjs/adonis-framework/commit/7c117e4))
* **response:** add support to set cookies ([650b071](https://github.com/adonisjs/adonis-framework/commit/650b071))



<a name="4.0.3"></a>
## [4.0.3](https://github.com/adonisjs/adonis-framework/compare/v4.0.2...v4.0.3) (2017-07-17)


<a name="4.0.2"></a>
## [4.0.2](https://github.com/adonisjs/adonis-framework/compare/v4.0.1...v4.0.2) (2017-06-23)


### Bug Fixes

* **exception:** exception bindings should have access to this ([5815931](https://github.com/adonisjs/adonis-framework/commit/5815931))
* **exception:** return instance of exception handler from ioc binding ([e2f5bca](https://github.com/adonisjs/adonis-framework/commit/e2f5bca))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/adonisjs/adonis-framework/compare/v4.0.0...v4.0.1) (2017-06-22)


### Features

* **event:** add event provider ([b9d28e9](https://github.com/adonisjs/adonis-framework/commit/b9d28e9))
* **view:** add view locals for http request ([f5d602d](https://github.com/adonisjs/adonis-framework/commit/f5d602d))



<a name="4.0.0"></a>
# 4.0.0 (2017-06-21)


### Bug Fixes

* changes after using scoped packages ([2456d12](https://github.com/adonisjs/adonis-framework/commit/2456d12))
* **bin:** fix test commands to work across node versions ([21a1703](https://github.com/adonisjs/adonis-framework/commit/21a1703))
* **request:** return false when request.match receives empty array ([92de641](https://github.com/adonisjs/adonis-framework/commit/92de641))
* **route:** use ctx to pull view instance ([223a3a5](https://github.com/adonisjs/adonis-framework/commit/223a3a5))


### Features

* initiate re-write ([a8bafb5](https://github.com/adonisjs/adonis-framework/commit/a8bafb5))
* **config:** add merge method ([e691c9e](https://github.com/adonisjs/adonis-framework/commit/e691c9e))
* **context:** add context object for request lifecycle ([b100775](https://github.com/adonisjs/adonis-framework/commit/b100775))
* **encryption:** add encryption provider ([3ace66e](https://github.com/adonisjs/adonis-framework/commit/3ace66e))
* **env:** add env provider ([d20f105](https://github.com/adonisjs/adonis-framework/commit/d20f105))
* **exception:** add support for exception handlers ([87157e3](https://github.com/adonisjs/adonis-framework/commit/87157e3))
* **exception:** add support for exceptions to handle themselves ([e775931](https://github.com/adonisjs/adonis-framework/commit/e775931))
* **exception:** implement default exception handler ([7d37620](https://github.com/adonisjs/adonis-framework/commit/7d37620))
* **hash:** add hash provider ([9533bfb](https://github.com/adonisjs/adonis-framework/commit/9533bfb))
* **logger:** add logger manager & register provider ([899151c](https://github.com/adonisjs/adonis-framework/commit/899151c))
* **logger:** add logger provider ([fba5f9f](https://github.com/adonisjs/adonis-framework/commit/fba5f9f))
* **macroable:** add support for singleton getters ([3880479](https://github.com/adonisjs/adonis-framework/commit/3880479))
* **route:** add prependMiddleware method to route ([fff7c78](https://github.com/adonisjs/adonis-framework/commit/fff7c78))
* **route:** resolve dynamic subdomains and pass via ctx ([212a8e7](https://github.com/adonisjs/adonis-framework/commit/212a8e7))
* **static:** add static resources middleware ([82f41f5](https://github.com/adonisjs/adonis-framework/commit/82f41f5))
* **views:** add views provider ([3275416](https://github.com/adonisjs/adonis-framework/commit/3275416))


### Performance Improvements

* **route:** do not process static and matched urls ([ea857b8](https://github.com/adonisjs/adonis-framework/commit/ea857b8))



<a name="3.0.13"></a>
## [3.0.13](https://github.com/adonisjs/adonis-framework/compare/v3.0.12...v3.0.13) (2017-04-25)



<a name="3.0.12"></a>
## [3.0.12](https://github.com/adonisjs/adonis-framework/compare/v3.0.11...v3.0.12) (2017-03-25)


### Bug Fixes

* **view:** attach isolated instance of view to response object ([08bdca3](https://github.com/adonisjs/adonis-framework/commit/08bdca3)), closes [#489](https://github.com/adonisjs/adonis-framework/issues/489)



<a name="3.0.11"></a>
## [3.0.11](https://github.com/adonisjs/adonis-framework/compare/v3.0.10...v3.0.11) (2017-02-25)


### Bug Fixes

* **session:** fix breaking test ([24f953e](https://github.com/adonisjs/adonis-framework/commit/24f953e))



<a name="3.0.10"></a>
## [3.0.10](https://github.com/adonisjs/adonis-framework/compare/v3.0.9...v3.0.10) (2017-02-25)


### Bug Fixes

* **file:** fix breaking tests ([8235b8c](https://github.com/adonisjs/adonis-framework/commit/8235b8c))
* **file:** fix to move file across devices ([1e36b4f](https://github.com/adonisjs/adonis-framework/commit/1e36b4f)), closes [#438](https://github.com/adonisjs/adonis-framework/issues/438)
* **session:** convert session age minutes to seconds ([c697665](https://github.com/adonisjs/adonis-framework/commit/c697665)), closes [#459](https://github.com/adonisjs/adonis-framework/issues/459)



<a name="3.0.9"></a>
## [3.0.9](https://github.com/adonisjs/adonis-framework/compare/v3.0.8...v3.0.9) (2017-01-28)



<a name="3.0.8"></a>
## [3.0.8](https://github.com/adonisjs/adonis-framework/compare/v3.0.7...v3.0.8) (2017-01-24)


### Bug Fixes

* make code consistent with node 7.0 ([58b22e9](https://github.com/adonisjs/adonis-framework/commit/58b22e9))
* **package:** update dotenv to version 3.0.0 ([#417](https://github.com/adonisjs/adonis-framework/issues/417)) ([4f4af56](https://github.com/adonisjs/adonis-framework/commit/4f4af56))
* **routing:** allow to prefix a group without a starting slash ([#416](https://github.com/adonisjs/adonis-framework/issues/416)) ([391b149](https://github.com/adonisjs/adonis-framework/commit/391b149))
* **view:** fix label default attribute, use for instead of name ([#406](https://github.com/adonisjs/adonis-framework/issues/406)) ([c0fc707](https://github.com/adonisjs/adonis-framework/commit/c0fc707))


### Features

* **file:** add delete method to delete file ([24825f0](https://github.com/adonisjs/adonis-framework/commit/24825f0))



<a name="3.0.7"></a>
## [3.0.7](https://github.com/adonisjs/adonis-framework/compare/v3.0.6...v3.0.7) (2016-12-01)


### Bug Fixes

* **form:select:** do a type insensitive comparison ([69a4eb9](https://github.com/adonisjs/adonis-framework/commit/69a4eb9)), closes [#378](https://github.com/adonisjs/adonis-framework/issues/378)



<a name="3.0.6"></a>
## [3.0.6](https://github.com/adonisjs/adonis-framework/compare/v3.0.5...v3.0.6) (2016-11-18)


### Features

* **response:** add response.plainCookie to add plain cookies ([dd5a5e9](https://github.com/adonisjs/adonis-framework/commit/dd5a5e9))



<a name="3.0.5"></a>
## [3.0.5](https://github.com/adonisjs/adonis-framework/compare/v3.0.4...v3.0.5) (2016-11-08)


### Bug Fixes

* **session:** new cookie driver instance for each request ([c784fbb](https://github.com/adonisjs/adonis-framework/commit/c784fbb))



<a name="3.0.4"></a>
## [3.0.4](https://github.com/adonisjs/adonis-framework/compare/v3.0.3...v3.0.4) (2016-11-02)


### Bug Fixes

* **helpers:** add / to namespace check in makeNameSpace ([2b0053c](https://github.com/adonisjs/adonis-framework/commit/2b0053c))
* **session:** clear cookie jar on request finish ([7eaa051](https://github.com/adonisjs/adonis-framework/commit/7eaa051)), closes [#330](https://github.com/adonisjs/adonis-framework/issues/330)


### Features

* **server:** Server.listen() return the http.Server instance ([#319](https://github.com/adonisjs/adonis-framework/issues/319)) ([29a631b](https://github.com/adonisjs/adonis-framework/commit/29a631b))



<a name="3.0.3"></a>
## [3.0.3](https://github.com/adonisjs/adonis-framework/compare/v3.0.2...v3.0.3) (2016-10-03)


### Features

* **request:** add extended support for accept header ([7aaf09e](https://github.com/adonisjs/adonis-framework/commit/7aaf09e))



<a name="3.0.2"></a>
## [3.0.2](https://github.com/adonisjs/adonis-framework/compare/v3.0.1...v3.0.2) (2016-09-23)


### Bug Fixes

* **docs:** broken links to docs ([#277](https://github.com/adonisjs/adonis-framework/issues/277)) ([6dedd5b](https://github.com/adonisjs/adonis-framework/commit/6dedd5b))
* **env:** using ENV_PATH value as it is if isAbsolute ([e5913d4](https://github.com/adonisjs/adonis-framework/commit/e5913d4))
* **file:** return null when file not uploaded ([4d05d2d](https://github.com/adonisjs/adonis-framework/commit/4d05d2d))
* **tests:** fix breaking test after mocha3.0 ([8d96862](https://github.com/adonisjs/adonis-framework/commit/8d96862))
* **view:** patch view for to work as asyncEach ([d283916](https://github.com/adonisjs/adonis-framework/commit/d283916)), closes [#258](https://github.com/adonisjs/adonis-framework/issues/258)


### Features

* **exceptions:** add support for custom exceptions ([fd0c008](https://github.com/adonisjs/adonis-framework/commit/fd0c008))
* **request:** add support for fetching plain cookies ([10b6c44](https://github.com/adonisjs/adonis-framework/commit/10b6c44))
* **request:** add support for intended method ([837ab7f](https://github.com/adonisjs/adonis-framework/commit/837ab7f))
* **response:** add few more properties ([46930eb](https://github.com/adonisjs/adonis-framework/commit/46930eb))
* **session:** add support for redis session driver ([677cc4e](https://github.com/adonisjs/adonis-framework/commit/677cc4e)), closes [#190](https://github.com/adonisjs/adonis-framework/issues/190)
* **session:** make use of additional cookie options ([4b2825c](https://github.com/adonisjs/adonis-framework/commit/4b2825c))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/adonisjs/adonis-framework/compare/v3.0.0...v3.0.1) (2016-07-29)


### Features

* **resource:middleware:** chain middleware method on route resource([04d6acc](https://github.com/adonisjs/adonis-framework/commit/04d6acc))
* **route:resource:** resource members & coll accepts callback([6603d4f](https://github.com/adonisjs/adonis-framework/commit/6603d4f))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/adonisjs/adonis-framework/compare/v2.0.9...v3.0.0) (2016-06-26)

### Bug Fixes

* **server:** Fix for #128 ([4aa4f80](https://github.com/adonisjs/adonis-framework/commit/4aa4f80)), closes [#128](https://github.com/adonisjs/adonis-framework/issues/128)
* **static-server:** Fix for #124 where node-static was crashing ([38efbd4](https://github.com/adonisjs/adonis-framework/commit/38efbd4)), closes [#124](https://github.com/adonisjs/adonis-framework/issues/124) [#124](https://github.com/adonisjs/adonis-framework/issues/124)
=======
* **linting:** fix linting error inside view extensions file([3095839](https://github.com/adonisjs/adonis-framework/commit/3095839))
* **middleware:** Fix middleware layer to execute middleware in reverse after controller call([97857ab](https://github.com/adonisjs/adonis-framework/commit/97857ab))
* **request:** handle multiple file uploads([2d0dfcb](https://github.com/adonisjs/adonis-framework/commit/2d0dfcb))
* **route:test:** improve test expectations to match instead of strict equal([31e8d6c](https://github.com/adonisjs/adonis-framework/commit/31e8d6c))
* **server:** add try/catch block to handle errors outside of co([36a40b6](https://github.com/adonisjs/adonis-framework/commit/36a40b6))
* **server:** Fix for [#128](https://github.com/adonisjs/adonis-framework/issues/128)([4aa4f80](https://github.com/adonisjs/adonis-framework/commit/4aa4f80)), closes [#128](https://github.com/adonisjs/adonis-framework/issues/128)
* **session:** fix sessions provider after node-cookie upgrade([8990f0d](https://github.com/adonisjs/adonis-framework/commit/8990f0d))
* **static-server:** Fix for [#124](https://github.com/adonisjs/adonis-framework/issues/124) where node-static was crashing([38efbd4](https://github.com/adonisjs/adonis-framework/commit/38efbd4)), closes [#124](https://github.com/adonisjs/adonis-framework/issues/124) [#124](https://github.com/adonisjs/adonis-framework/issues/124)
* **static-server:** Fix for [#124](https://github.com/adonisjs/adonis-framework/issues/124) where node-static was crashing([787573d](https://github.com/adonisjs/adonis-framework/commit/787573d)), closes [#124](https://github.com/adonisjs/adonis-framework/issues/124) [#124](https://github.com/adonisjs/adonis-framework/issues/124)


### Features

* **Env:** add support to load .env from different location([2503fbb](https://github.com/adonisjs/adonis-framework/commit/2503fbb))
* **event:** add property eventName to scope emitter object([fee2a36](https://github.com/adonisjs/adonis-framework/commit/fee2a36))
* **event:** add support for event emitter([8a7b3a7](https://github.com/adonisjs/adonis-framework/commit/8a7b3a7))
* **file:** allow file instance to take validation options([36e3f1b](https://github.com/adonisjs/adonis-framework/commit/36e3f1b))
* **form-helper:** added form.open method to create html form tag([e6367ff](https://github.com/adonisjs/adonis-framework/commit/e6367ff))
* **form-helper:** added method to add labels([e56a834](https://github.com/adonisjs/adonis-framework/commit/e56a834))
* **form-helper:** implemented all required html tags([082e8c8](https://github.com/adonisjs/adonis-framework/commit/082e8c8))
* **helpers:** add makeNameSpace method([651972f](https://github.com/adonisjs/adonis-framework/commit/651972f))
* **helpers:** add method to know whether process is for ace command([4beb8a2](https://github.com/adonisjs/adonis-framework/commit/4beb8a2))
* **helpers:** add methods to get path to database directories([85688c8](https://github.com/adonisjs/adonis-framework/commit/85688c8))
* **request:** Add collect method to form group of arrays with keys([d0e5303](https://github.com/adonisjs/adonis-framework/commit/d0e5303))
* **request:** add support for adding macros([cfd129b](https://github.com/adonisjs/adonis-framework/commit/cfd129b))
* **response:** add macro support([d7ad0ee](https://github.com/adonisjs/adonis-framework/commit/d7ad0ee))
* **Route:** add router helper to render view([0f517cb](https://github.com/adonisjs/adonis-framework/commit/0f517cb))
* **server:** add support to disable _method spoofing([43f21a2](https://github.com/adonisjs/adonis-framework/commit/43f21a2))
* **server:** added the ability to obtain instance http.createServer () for socket.io ([#165](https://github.com/adonisjs/adonis-framework/issues/165))([8d221d0](https://github.com/adonisjs/adonis-framework/commit/8d221d0))
* **static:** Switch to server-static for serving static files([cc5be2a](https://github.com/adonisjs/adonis-framework/commit/cc5be2a))
* **view:** Add config option to disable service injection([9a9f3d4](https://github.com/adonisjs/adonis-framework/commit/9a9f3d4))
* **view:** add globals for linkTo and linkToAction([3e6530d](https://github.com/adonisjs/adonis-framework/commit/3e6530d))
* **view:** added makeString method and filter for making urls using controller methods([da7d080](https://github.com/adonisjs/adonis-framework/commit/da7d080))
* **view:** Make all views to have .nunjucks extension [#133](https://github.com/adonisjs/adonis-framework/issues/133)([8535172](https://github.com/adonisjs/adonis-framework/commit/8535172)), closes [#133](https://github.com/adonisjs/adonis-framework/issues/133)

<a name="2.0.11"></a>
## [2.0.11](https://github.com/adonisjs/adonis-framework/compare/v2.0.9...v2.0.11) (2016-03-30)


<a name="2.0.10"></a>
## [2.0.10](https://github.com/adonisjs/adonis-framework/compare/v2.0.9...v2.0.10) (2016-03-26)


### Bug Fixes

* **static-server:** Fix for #124 where node-static was crashing ([38efbd4](https://github.com/adonisjs/adonis-framework/commit/38efbd4)), closes [#124](https://github.com/adonisjs/adonis-framework/issues/124) [#124](https://github.com/adonisjs/adonis-framework/issues/124)



<a name="2.0.9"></a>
## [2.0.9](https://github.com/adonisjs/adonis-framework/compare/v2.0.3...v2.0.9) (2016-01-30)


### Bug Fixes

* **request:** method is and accepts have been fixed to treat arrays ([9d8e963](https://github.com/adonisjs/adonis-framework/commit/9d8e963))
* **session:** fixed session manager to keep updated session payload within one request #88 ([1fe8b4b](https://github.com/adonisjs/adonis-framework/commit/1fe8b4b)), closes [#88](https://github.com/adonisjs/adonis-framework/issues/88)
* **session:** now list of drivers is set to an empty object by default ([3bb75e0](https://github.com/adonisjs/adonis-framework/commit/3bb75e0))
* **session-manager:** avoiding reparsing of session body ([0d8394d](https://github.com/adonisjs/adonis-framework/commit/0d8394d))

### Features

* **middleware:** middleware now accepts runtime parameters ([6907053](https://github.com/adonisjs/adonis-framework/commit/6907053))
* **package:** passing coverage report to coveralls ([579ab3e](https://github.com/adonisjs/adonis-framework/commit/579ab3e))
* **package.json:** make the repository commitizen-friendly ([0082c4a](https://github.com/adonisjs/adonis-framework/commit/0082c4a))
* **request:** add match method to match an array of patterns to current url ([a81a4f7](https://github.com/adonisjs/adonis-framework/commit/a81a4f7))
* **request:** added hasBody and format methods to request instance ([30739db](https://github.com/adonisjs/adonis-framework/commit/30739db))
* **request:** Added raw method to access raw data sent to a given request ([00de598](https://github.com/adonisjs/adonis-framework/commit/00de598))
* **response:** added descriptive methods to make response like ok,unauthorized ([b092407](https://github.com/adonisjs/adonis-framework/commit/b092407))
* **response:** added sendView method to end the response immediately by sending view ([1655667](https://github.com/adonisjs/adonis-framework/commit/1655667))
* **route:** added options to add format to routes ([cfe6c5c](https://github.com/adonisjs/adonis-framework/commit/cfe6c5c))
* **route-resource:** added support for nested resources and resources filters ([907014e](https://github.com/adonisjs/adonis-framework/commit/907014e))
* **routes:** added middleware alias and added support for multiple params ([51cf673](https://github.com/adonisjs/adonis-framework/commit/51cf673))

### Performance Improvements

* **config:** remove auto-load with require-all for performance ([806aae2](https://github.com/adonisjs/adonis-framework/commit/806aae2))
* **env,file,helpers:** improved initial datatypes to help v8 set hidden classes ([79bd6b4](https://github.com/adonisjs/adonis-framework/commit/79bd6b4))
* **middleware,route,server,session:** improved variables initialization to keep v8 happy ([20080ec](https://github.com/adonisjs/adonis-framework/commit/20080ec))
* **request.format:** added acceptance for request.format ([4ed82c2](https://github.com/adonisjs/adonis-framework/commit/4ed82c2))



<a name="2.0.8"></a>
## [2.0.8](https://github.com/adonisjs/adonis-framework/compare/v2.0.3...v2.0.8) (2016-01-29)


### Bug Fixes

* **request:** method is and accepts have been fixed to treat arrays ([9d8e963](https://github.com/adonisjs/adonis-framework/commit/9d8e963))
* **session:** fixed session manager to keep updated session payload within one request #88 ([1fe8b4b](https://github.com/adonisjs/adonis-framework/commit/1fe8b4b)), closes [#88](https://github.com/adonisjs/adonis-framework/issues/88)
* **session:** now list of drivers is set to an empty object by default ([3bb75e0](https://github.com/adonisjs/adonis-framework/commit/3bb75e0))

### Features

* **middleware:** middleware now accepts runtime parameters ([6907053](https://github.com/adonisjs/adonis-framework/commit/6907053))
* **package:** passing coverage report to coveralls ([579ab3e](https://github.com/adonisjs/adonis-framework/commit/579ab3e))
* **package.json:** make the repository commitizen-friendly ([0082c4a](https://github.com/adonisjs/adonis-framework/commit/0082c4a))
* **request:** add match method to match an array of patterns to current url ([a81a4f7](https://github.com/adonisjs/adonis-framework/commit/a81a4f7))
* **request:** added hasBody and format methods to request instance ([30739db](https://github.com/adonisjs/adonis-framework/commit/30739db))
* **request:** Added raw method to access raw data sent to a given request ([00de598](https://github.com/adonisjs/adonis-framework/commit/00de598))
* **response:** added descriptive methods to make response like ok,unauthorized ([b092407](https://github.com/adonisjs/adonis-framework/commit/b092407))
* **response:** added sendView method to end the response immediately by sending view ([1655667](https://github.com/adonisjs/adonis-framework/commit/1655667))
* **route:** added options to add format to routes ([cfe6c5c](https://github.com/adonisjs/adonis-framework/commit/cfe6c5c))
* **route-resource:** added support for nested resources and resources filters ([907014e](https://github.com/adonisjs/adonis-framework/commit/907014e))
* **routes:** added middleware alias and added support for multiple params ([51cf673](https://github.com/adonisjs/adonis-framework/commit/51cf673))

### Performance Improvements

* **config:** remove auto-load with require-all for performance ([806aae2](https://github.com/adonisjs/adonis-framework/commit/806aae2))
* **env,file,helpers:** improved initial datatypes to help v8 set hidden classes ([79bd6b4](https://github.com/adonisjs/adonis-framework/commit/79bd6b4))
* **middleware,route,server,session:** improved variables initialization to keep v8 happy ([20080ec](https://github.com/adonisjs/adonis-framework/commit/20080ec))
* **request.format:** added acceptance for request.format ([4ed82c2](https://github.com/adonisjs/adonis-framework/commit/4ed82c2))



<a name="2.0.7"></a>
## [2.0.7](https://github.com/adonisjs/adonis-framework/compare/v2.0.3...v2.0.7) (2016-01-17)


### Bug Fixes

* **request:** method is and accepts have been fixed to treat arrays ([9d8e963](https://github.com/adonisjs/adonis-framework/commit/9d8e963))
* **session:** now list of drivers is set to an empty object by default ([3bb75e0](https://github.com/adonisjs/adonis-framework/commit/3bb75e0))

### Features

* **package.json:** make the repository commitizen-friendly ([0082c4a](https://github.com/adonisjs/adonis-framework/commit/0082c4a))
* **request:** add match method to match an array of patterns to current url ([a81a4f7](https://github.com/adonisjs/adonis-framework/commit/a81a4f7))
* **request:** Added raw method to access raw data sent to a given request ([00de598](https://github.com/adonisjs/adonis-framework/commit/00de598))



<a name="2.0.6"></a>
## 2.0.6 (2016-01-16)


### docs

* docs: add CONTRIBUTING.md file ([ab7afdb](https://github.com/adonisjs/adonis-framework/commit/ab7afdb))
* docs: update the build badge to get the status from master branch ([9c5c61f](https://github.com/adonisjs/adonis-framework/commit/9c5c61f))

* add trello badge ([7c57fe3](https://github.com/adonisjs/adonis-framework/commit/7c57fe3))
* Config provider now only reads .js files ([dcc7aee](https://github.com/adonisjs/adonis-framework/commit/dcc7aee))
* correct all license date ([9f5fd24](https://github.com/adonisjs/adonis-framework/commit/9f5fd24))
* delete lowercase readme ([6c12f92](https://github.com/adonisjs/adonis-framework/commit/6c12f92))
* Improved tests coverage ([07efb17](https://github.com/adonisjs/adonis-framework/commit/07efb17))
* Merge branch 'master' of github.com:adonisjs/adonis-framework ([2eaa793](https://github.com/adonisjs/adonis-framework/commit/2eaa793))
* Merge branch 'release-2.0.3' into develop ([d5a3cb4](https://github.com/adonisjs/adonis-framework/commit/d5a3cb4))
* Merge branch 'release-2.0.4' ([c4405bf](https://github.com/adonisjs/adonis-framework/commit/c4405bf))
* Merge pull request #42 from alexbooker/patch-1 ([9a2d4be](https://github.com/adonisjs/adonis-framework/commit/9a2d4be))
* Merge pull request #45 from RomainLanz/develop ([643ff72](https://github.com/adonisjs/adonis-framework/commit/643ff72))
* Merge pull request #46 from adonisjs/revert-42-patch-1 ([c7e6471](https://github.com/adonisjs/adonis-framework/commit/c7e6471))
* Merge pull request #47 from RomainLanz/develop ([27cb1d5](https://github.com/adonisjs/adonis-framework/commit/27cb1d5))
* Merge pull request #48 from RomainLanz/develop ([949a06f](https://github.com/adonisjs/adonis-framework/commit/949a06f))
* Merge pull request #61 from RomainLanz/feature/improving-readme ([0dbafa8](https://github.com/adonisjs/adonis-framework/commit/0dbafa8))
* Merge pull request #63 from RomainLanz/update-readme-badges ([c52f989](https://github.com/adonisjs/adonis-framework/commit/c52f989))
* Merge pull request #64 from RomainLanz/update-lodash ([bcaf01a](https://github.com/adonisjs/adonis-framework/commit/bcaf01a))
* Merge pull request #65 from RomainLanz/contributing ([4f5fd0b](https://github.com/adonisjs/adonis-framework/commit/4f5fd0b))
* Merge pull request #67 from RomainLanz/commitizen ([ff6d94f](https://github.com/adonisjs/adonis-framework/commit/ff6d94f))
* Merged release 2.0.5 ([222bab7](https://github.com/adonisjs/adonis-framework/commit/222bab7))
* Moved route resolution to callback method, required for method spoofing ([839791a](https://github.com/adonisjs/adonis-framework/commit/839791a))
* new readme version ([81169c9](https://github.com/adonisjs/adonis-framework/commit/81169c9))
* Now all files are dependent upon config directory and not reading from .env file ([f2ff04f](https://github.com/adonisjs/adonis-framework/commit/f2ff04f))
* Now param method accepts a default value ([adcd7fb](https://github.com/adonisjs/adonis-framework/commit/adcd7fb))
* npm version bump ([0b6693e](https://github.com/adonisjs/adonis-framework/commit/0b6693e))
* npm version bump ([0d6b456](https://github.com/adonisjs/adonis-framework/commit/0d6b456))
* Revert "Updated the licence date" ([102ad50](https://github.com/adonisjs/adonis-framework/commit/102ad50))
* update license date and add license file ([2aa3412](https://github.com/adonisjs/adonis-framework/commit/2aa3412))
* update shields badges ([6e932f5](https://github.com/adonisjs/adonis-framework/commit/6e932f5))
* Updated the licence date ([e881bd6](https://github.com/adonisjs/adonis-framework/commit/e881bd6))

### feat

* feat(package.json): make the repository commitizen-friendly ([0082c4a](https://github.com/adonisjs/adonis-framework/commit/0082c4a))
* feat(request): add match method to match an array of patterns to current url ([a81a4f7](https://github.com/adonisjs/adonis-framework/commit/a81a4f7))
* feat(request): Added raw method to access raw data sent to a given request ([00de598](https://github.com/adonisjs/adonis-framework/commit/00de598))

### refactor

* refactor: update lodash to 4.0.0 ([ad1cbdc](https://github.com/adonisjs/adonis-framework/commit/ad1cbdc))
* refactor(response): Capitalized x-powered-by ([ed3d3dc](https://github.com/adonisjs/adonis-framework/commit/ed3d3dc))
* refactor(server): Increased static server priority over route handler ([30cfe41](https://github.com/adonisjs/adonis-framework/commit/30cfe41))
* refactor(session): improved session drivers handling and exposing session manager ([a17a49b](https://github.com/adonisjs/adonis-framework/commit/a17a49b))
