# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.4](https://github.com/han-tyumi/tools/compare/0.2.3...0.2.4) (2020-10-17)


### Bug Fixes

* **installer:** :bug: allow CLI usage without config ([953cfdf](https://github.com/han-tyumi/tools/commit/953cfdf45b6e588041970ad98af5f803d63478ec))

### [0.2.3](https://github.com/han-tyumi/tools/compare/0.2.2...0.2.3) (2020-10-17)


### Features

* **cli:** :sparkles: add install offline option ([ac752f9](https://github.com/han-tyumi/tools/commit/ac752f90527308549e7af1bd63777bb5d4c91f44))
* **cli:** :sparkles: add latest command ([f42d4c6](https://github.com/han-tyumi/tools/commit/f42d4c665bfa126c156542cb67e5723fabb15a25))
* **cli:** :sparkles: support downloading multiple versions ([79d4dfe](https://github.com/han-tyumi/tools/commit/79d4dfe75b6f4d255a298c778c89fb2a57cb23bf))
* **installer:** :art: update download cache message ([c97cd5f](https://github.com/han-tyumi/tools/commit/c97cd5f927f17c1a0b302d53ec5d29224025a050))
* **installer:** :sparkles: handle bad responses ([730e074](https://github.com/han-tyumi/tools/commit/730e0740fbec990ba68df4b71d1638cde11b6010))
* **installer:** :sparkles: support installing the latest by default ([f670fff](https://github.com/han-tyumi/tools/commit/f670fffe1297c35d855808a6757ad34d0ac5bec3))
* **installer:** :sparkles: support version format ([a73b1a2](https://github.com/han-tyumi/tools/commit/a73b1a2c69d05ca8da3466944b0a38e75ad7b0d5))


### Bug Fixes

* **installer:** :bug: determine regex before creating version function ([978182a](https://github.com/han-tyumi/tools/commit/978182aa1d0d604754a0ff526888bb50861e44cc))
* **installer:** :bug: update dynamic TS/JS imports ([d5ec7ef](https://github.com/han-tyumi/tools/commit/d5ec7efe1c3ca59c6070f7e7d833c5a238885ec1))
* **module:** :bug: remove mainDir ([cd10f84](https://github.com/han-tyumi/tools/commit/cd10f84398489ec2b6d174166fe928cbc513aa75))

### [0.2.2](https://github.com/han-tyumi/tools/compare/0.2.1...0.2.2) (2020-10-04)


### Features

* **cli:** :sparkles: add command aliases ([0612940](https://github.com/han-tyumi/tools/commit/0612940864e7a34f39fc4d3262381354b26f662c))
* **cli:** :sparkles: add list command ([c915fa3](https://github.com/han-tyumi/tools/commit/c915fa352a052ab7e3cc069561c9b9feb60e341d))
* **cli:** :sparkles: remove need for versionRegex ([418d6b6](https://github.com/han-tyumi/tools/commit/418d6b66128b39bef61f80b9b94f008cbf8485d6))
* **cli:** :sparkles: support all installer options ([00a1fbf](https://github.com/han-tyumi/tools/commit/00a1fbfb6c88490b08f58b63860a175efcb1604e))
* **cli:** :sparkles: support download and install without config file ([2da3564](https://github.com/han-tyumi/tools/commit/2da356405eefea4b347742e815f8b6717007d163))
* **config:** :sparkles: add support for typescript and javascript config files ([08eb760](https://github.com/han-tyumi/tools/commit/08eb7601913d1f08b36498d079c146bd34c6cdf2))
* **installer:** :recycle: handle transforming configuration files within Installer ([66714de](https://github.com/han-tyumi/tools/commit/66714de53cb2e0585a390e7c623875b4acb41439))
* **installer:** :sparkles: support string options in constructor ([211fd81](https://github.com/han-tyumi/tools/commit/211fd819e2fd6fddeb7ffbfa29630fbba3fe32c5))


### Bug Fixes

* **cli:** :bug: remove aliases ([93a8b9b](https://github.com/han-tyumi/tools/commit/93a8b9b1c54de9c403f0ffce8a7d04635b347cdb))
* **code:** :bug: update installFn import ([f30ec10](https://github.com/han-tyumi/tools/commit/f30ec105b3b6523bb7a90461dd2c5fd89b4ad57c))
* **code:** use homeDir in code installer ([d5d82a5](https://github.com/han-tyumi/tools/commit/d5d82a5f4d10bb31fa19c51a429ed1e07b8f03f1))

### [0.2.1](https://github.com/han-tyumi/tools/compare/0.2.0...0.2.1) (2020-09-28)


### Features

* **cli:** :sparkles: add support for specifying a specific installFn file export ([67718dc](https://github.com/han-tyumi/tools/commit/67718dc7ac5a0e9e4669fd4522c703030d57e0d8))
* **config:** :sparkles: add relative path support for config files ([94a160d](https://github.com/han-tyumi/tools/commit/94a160d1c819653f95256684793fd747077b0e69))
