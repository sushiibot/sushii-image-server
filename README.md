# sushii-image-server <!-- omit in toc -->

[![Build Status](https://travis-ci.org/drklee3/sushii-image-server.svg?branch=master)](https://travis-ci.org/drklee3/sushii-image-server)

Simple local web server made with [Koa](https://github.com/koajs/koa) and [puppeteer](https://github.com/GoogleChrome/puppeteer) to generate images for [sushii-bot](https://github.com/drklee3/sushii-bot).
The files directory can be used to serve static files used for HTML screenshots (e.g., JavaScript files).

## ⚠ Warning <!-- omit in toc -->>

Don't serve this publicly unless you know the risks. Any JavaScript can be ran on the system and local files can be accessed.

- [Installation](#installation)
- [Configuration](#configuration)
- [API Endpoints](#api-endpoints)
  - [Generate a screenshot of given url](#generate-a-screenshot-of-given-url)
    - [Request](#request)
    - [Example](#example)
  - [Generate a screenshot of given HTML](#generate-a-screenshot-of-given-html)
    - [Request](#request-1)
    - [Example](#example-1)
  - [Get image server statistics](#get-image-server-statistics)
    - [Example](#example-2)

## Installation

1. Install [Node.js and npm](https://nodejs.org/en/download/package-manager/)

2. Clone repository and enter the directory.

    ```bash
    git clone https://github.com/drklee3/sushii-image-server.git
    cd sushii-image-server
    ```

3. Install sushii-image-server dependencies.

    ```bash
    npm install
    ```

4. Install [chromium dependencies](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch). You can check if you are missing dependencies with `ldd chrome | grep not`.

    Example command to install common dependencies for Debian based systems:

    ```bash
    sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
    ```

5. Build TypeScript files and start with `npm start` or with a process manager like [PM2](https://github.com/Unitech/pm2).

## Configuration

An example configuration can be found in [`config.json`](./config.json). These values are also given by default if a config file is not found or fields are omitted.  
Parameter values are processed in the following priority: request parameter, configuration, default. POST request parameters will be take priority over config and default values. Default values will only be used if a parameter is neither given in the POST request nor configuration file.
For example, if the `width` setting in the config is set to `512` and a POST request to `/url` or `/html` has a paramter of `1028`, it will use `1028` for that specific request.

```javascript
{
    "interface": "localhost",
    "port": 3001,

    // set to true for debugging purposes (browser will be visible)
    "headless": false,
    // you can use these options if you absolutely trust the content opened
    // https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#setting-up-chrome-linux-sandbox
    "browserArgs": "--no-sandbox --disable-setuid-sandbox",

    // default width and height of browser viewport and screenshots
    "width": 1280,
    "height": 720,

    // possible values: "png", "jpeg"
    "imageFormat": "png"
    // quality of image between 0-100, only applicable to jpeg images
    "quality": 70
}
```

## API Endpoints

### Generate a screenshot of given url

```text
POST /url
```

#### Request

| Parameter   | Description                                | Default Value |
| :---------- | :----------------------------------------- | ------------- |
| url         | URL to generate a screenshot of (required) |               |
| width       | Screenshot width                           | 512           |
| height      | Screenshot height                          | 512           |
| imageFormat | Image format (png or jpeg)                 | png           |
| quality     | Jpeg image quality (0-100)                 | 70            |

#### Example

```bash
curl localhost:3000/url \
    -d url=https://google.com \
    -d width=1280 \
    -d height=720 \
    -d imageFormat=jpeg \
    -d quality=90 > image.jpg
```

---

### Generate a screenshot of given HTML

```text
POST /html
```

#### Request

| Parameter   | Description                                 | Default Value |
| :---------- | :------------------------------------------ | ------------- |
| html        | HTML to generate a screenshot of (required) |               |
| width       | Screenshot width                            | 512           |
| height      | Screenshot height                           | 512           |
| imageFormat | Image format (png or jpeg)                  | png           |
| quality     | Jpeg image quality (0-100)                  | 70            |

#### Example

```bash
curl localhost:3000/html \
    -d html=hi \
    -d width=1280 \
    -d height=720 \
    -d imageFormat=png > image.png
```

### Get image server statistics

```text
GET /
```

#### Example

```bash
$ curl localhost:3000
{"version":"3.0.0","urlCount":3,"htmlCount":3,"totalCount":6}
```
