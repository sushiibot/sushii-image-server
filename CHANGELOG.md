# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.2.0] - 2021-01-13

### Added

-  Add Noto fonts to Docker image

## [5.1.0]

### Added

-  Add Prometheus metrics

### Changed

-  Rename `files` directory to `static`
-  Move Docker image workdir to /app

### Fixed

-  Mount static files on `/static` path

## [5.0.0]

### Added

-  Handlebar templates via `POST /template` with either a local hbs file or
   given template string
-  Add Docker image

### Changed

-  Switch to Yarn from npm
-  Use environment variables for configuration instead of json config file

[unreleased]: https://github.com/sushiibot/sushii-image-server/compare/v5.2.0...HEAD
[5.2.0]: https://github.com/sushiibot/sushii-image-server/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/sushiibot/sushii-image-server/compare/v5.0.0...v5.1.0
[5.0.0]: https://github.com/sushiibot/sushii-image-server/compare/v4.0.0...v5.0.0
