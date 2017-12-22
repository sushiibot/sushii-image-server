# sbot2-image-server
Simple local web server made with Koa and puppeteer to generate images. 

## API Endpoints
### Generate a screenshot of given url.
```
GET /url/:url
```

#### Example
```bash
$ curl localhost:3000/url/https%3A%2F%2Fgoogle.com
```

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
    -d height=720
```