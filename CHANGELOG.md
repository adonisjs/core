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
