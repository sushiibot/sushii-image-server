const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const app = new Koa();
const router = new Router();

async function main() {
    const browser = await puppeteer.launch();

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
        const width = ctx.request.body.width;
        const height = ctx.request.body.height;

        await page.setViewport({width: width, height: height});
        await page.setContent(html);

        ctx.body = await page.screenshot();
        ctx.type = 'image/png';

        page.close();
    });

    app
        .use(bodyParser())
        .use(router.routes())
        .use(router.allowedMethods());


    app.listen(3000, '127.0.0.1');
    console.log("Listening on :3000");
}


main();