const Koa        = require('koa');
const serve      = require('koa-static');
const Router     = require('koa-router');
const bodyParser = require('koa-bodyparser');
const puppeteer  = require('puppeteer');

const port = process.env.PORT || 3000;

const app = new Koa();
const router = new Router();

async function main() {
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});

    router.get('/', (ctx) => {
        ctx.body = 'hi';
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

        page.close();
    });

    app
        .use(serve('./files'))
        .use(bodyParser())
        .use(router.routes())
        .use(router.allowedMethods());
    
    app.listen(port, '127.0.0.1');
    console.log('Listening on :' + port);
}

main();
