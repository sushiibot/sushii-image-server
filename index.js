const Koa = require('koa');
const Router = require('koa-router');
const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');

const app = new Koa();
const router = new Router();

async function main() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 400, height: 300});

    router.get('/', (ctx, next) => {
        ctx.body = "hi";
    });

    router.get('/image/:url', async (ctx, next) => {
        await page.goto(ctx.params.url);
        ctx.body = await page.screenshot();


        ctx.type = 'image/png';
    });

    app
        .use(router.routes())
        .use(router.allowedMethods());


    app.listen(3000);
}


main();