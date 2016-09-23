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
