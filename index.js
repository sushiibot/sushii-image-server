const Koa        = require('koa');
const serve      = require('koa-static');
const Router     = require('koa-router');
const bodyParser = require('koa-bodyparser');
const puppeteer  = require('puppeteer');
const package    = require('./package.json');

const port   = process.env.PORT || 3000;
const app    = new Koa();
const router = new Router();

async function main() {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    let urlCount = 0;
    let htmlCount = 0;

    router.get('/', (ctx) => {
        ctx.body = {
            version: package.version,
            urlCount,
            htmlCount,
            totalCount: urlCount + htmlCount,
        };
    });

    router.post('/url', async (ctx) => {
        const page = await browser.newPage();
        const {url, width, height} = ctx.request.body;

        const widthInt = parseInt(width);
        const heightInt = parseInt(height);

        await page.setViewport({width: widthInt, height: heightInt});
        await page.goto(url);

        ctx.body = await page.screenshot();
        ctx.type = 'image/png';

        urlCount++;
        page.close();
    });

    router.post('/html', async (ctx) => {
        const page = await browser.newPage();
        const {html, width, height} = ctx.request.body;

        const widthInt = parseInt(width);
        const heightInt = parseInt(height);

        await page.setViewport({width: widthInt, height: heightInt});
        await page.goto(`data:text/html,${html}`, { waitUntil: 'load' });

        ctx.body = await page.screenshot({omitBackground: true});
        ctx.type = 'image/png';

        htmlCount++;
        page.close();
    });

    app
        .use(async (ctx, next) => {
            try {
                await next();
            } catch (err) {
                // will only respond with JSON
                ctx.status = err.statusCode || err.status || 500;
                ctx.body = {
                    message: err.message
                };
            }
        })
        .use(serve('./files'))
        .use(bodyParser())
        .use(router.routes())
        .use(router.allowedMethods());
    
    app.listen(port, '127.0.0.1');
    console.log('Listening on :' + port);
}

main();
