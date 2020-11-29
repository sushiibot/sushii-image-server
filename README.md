# sushii-image-server <!-- omit in toc -->

[![CI](https://github.com/sushiibot/sushii-image-server/workflows/CI/badge.svg)](https://github.com/sushiibot/sushii-image-server/actions?query=workflow%3ACI)

Simple local web server made with [Koa](https://github.com/koajs/koa) and
[puppeteer](https://github.com/GoogleChrome/puppeteer) to generate images for
[sushii-bot](https://github.com/drklee3/sushii-bot). The files directory can be
used to serve static files used for HTML screenshots (e.g., JavaScript files).

## ⚠ Warning <!-- omit in toc -->

Don't serve this publicly unless you know the risks. Any JavaScript code can be
run on the system and local files can be accessed.

## Table of Contents <!-- omit in toc -->

- [Running](#running)
  - [With Docker](#with-docker)
  - [Without Docker](#without-docker)
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

## Running

### With Docker

```bash
docker run \
    -p 3000:3000 \
    --init \
    --rm \
    --cap-add=SYS_ADMIN \
    ghcr.io/sushiibot/sushii-image-server
```

`--cap-add=SYS_ADMIN` is needed to run Chromium in a sandbox. If you don't want
to provide `SYS_ADMIN` to the container, you will need to launch Chromium
without sandbox by setting `SUSHII_IMG_BROWSER_ARGS="--no-sandbox --disable-setuid-sandbox"`.
Keep in mind that running without a sandbox is
strongly discouraged and only should be done if you absolutely trust the content
you open in Chromium.

`--init` is used to reap zombie processes.

### Without Docker

1. Install [Node.js and npm](https://nodejs.org/en/download/package-manager/)

2. Clone repository and enter the directory.

    ```bash
    git clone https://github.com/sushiibot/sushii-image-server.git
    cd sushii-image-server
    ```

3. Install sushii-image-server dependencies.

    ```bash
    yarn
    ```

4. Install [chromium dependencies](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch). You can check if you are missing dependencies with `ldd chrome | grep not`.

    Example command to install common dependencies for Debian based systems:

    ```bash
    sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
    ```

5. Build TypeScript files and start with `yarn start` or with a process manager
   like [PM2](https://github.com/Unitech/pm2).

## Configuration

Configuration options can be passed via environment variables or an `.env` file
in the base project directory.

Available options with their default values are listed below:

```bash
SUSHII_IMG_INTERFACE=0.0.0.0
SUSHII_IMG_PORT=3000
SUSHII_IMG_HEADLESS=true
SUSHII_IMG_BROWSER_ARGS=""
SUSHII_IMG_WIDTH=512
SUSHII_IMG_HEIGHT=512
SUSHII_IMG_IMAGE_FORMAT=png
SUSHII_IMG_QUALITY=70
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
