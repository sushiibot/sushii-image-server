const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const Router = require('koa-router');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const app = new Koa();
const router = new Router();

async function main() {
    const browser = await puppeteer.launch({args: ['--no-sandbox' '--disable-setuid-sandbox']});

    router.get('/', (ctx, next) => {
        ctx.body = "hi";
    });

    router.get('/url/:url', async (ctx, next) => {
        const page = await browser.newPage();

        await page.goto(ctx.params.url);
        ctx.body = await page.screenshot();
        ctx.type = 'image/png';

        page.close();
    });

    router.post('/html', async (ctx, next) => {
        const page = await browser.newPage();

        const html = ctx.request.body.html;
        const width = parseInt(ctx.request.body.width);
        const height = parseInt(ctx.request.body.height);

        await page.setViewport({width: width, height: height});
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


    app.listen(3000, '127.0.0.1');
    console.log("Listening on :3000");
}


main();