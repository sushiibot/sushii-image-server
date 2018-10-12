# sushii-image-server

Simple local web server made with [Koa](https://github.com/koajs/koa) and [puppeteer](https://github.com/GoogleChrome/puppeteer) to generate images for [sushii-bot](https://github.com/drklee3/sushii-bot).
The files directory can be used to serve static files used for HTML screenshots (e.g., JavaScript files).

## ⚠ Warning

Don't serve this publicly unless you know the risks.  Any JavaScript can be ran on the system and local files can be accessed.

## API Endpoints

### Generate a screenshot of given url

```text
POST /url
```

#### Arguments

| Parameter | Description                      |
| :-------- | :------------------------------- |
| url       | URL to generate a screenshot of  |
| width     | Screenshot width                 |
| height    | Screenshot height                |

#### Example

```bash
curl localhost:3000/url \
    -d url=https://google.com \
    -d width=1280 \
    -d height=720 > image.png
```

---

### Generate a screenshot of given HTML

```text
POST /html
```

#### Arguments

| Parameter | Description                      |
| :-------- | :------------------------------- |
| html      | HTML to generate a screenshot of |
| width     | Screenshot width                 |
| height    | Screenshot height                |

#### Example

```bash
curl localhost:3000/html \
    -d html=hi \
    -d width=1280 \
    -d height=720 > image.png
```

### Get image server statistics

```text
GET /
```

#### Example

```bash
$ curl localhost:3000
{"version":"2.1.0","count":2}
```

## Installation

1. Install [Node.js and npm](https://nodejs.org/en/download/package-manager/)
    ```bash
    curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
2. Clone repository and enter the directory.
    ```bash
    git clone https://github.com/drklee3/sushii-image-server.git
    cd sushii-image-server
    ```
3. Install sushii-image-server dependencies.
    ```bash
    npm install
    ```
4. Install [chromium dependencies](https://github.com/GoogleChrome/puppeteer/blob/master/docs/troubleshooting.md#chrome-headless-doesnt-launch) (optional).
    ```bash
    sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
    ```
5. Start with `npm start` or with a process manager like [PM2](https://github.com/Unitech/pm2). To start it with a custom port use `PORT=3001 npm start` (port 3001 in this example).
