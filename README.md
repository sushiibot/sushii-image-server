# sbot2-image-server
Simple local web server made with [Koa](https://github.com/koajs/koa) and [puppeteer](https://github.com/GoogleChrome/puppeteer) to generate images. 
The files directory can be used to serve static files used for HTML screenshots (e.g., JavaScript files).

## ⚠ Warning
Don't serve this publicly unless you know the risks.  Any JavaScript can be ran on the system and local files can be accessed.

## API Endpoints
### Generate a screenshot of given url.
```
GET /url/:url
```

#### Example
```bash
$ curl localhost:3000/url/https%3A%2F%2Fgoogle.com > image.png
```

---

### Generate a screenshot of given HTML
```
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
$ curl localhost:3000/html \
    -d html=hi \
    -d width=1280 \
    -d height=720 > image.png
```