const Koa        = require("koa");
const serve      = require("koa-static");
const Router     = require("koa-router");
const bodyParser = require("koa-bodyparser");
const puppeteer  = require("puppeteer");
const package    = require("./package.json");
const Config     = require("./config");

const app    = new Koa();
const router = new Router();
const config = new Config();

async function main() {
    const browserArgs = config.getBrowserArgs();
    const browser     = await puppeteer.launch({
        headless: config.isHeadless(),
        args: browserArgs
    });

    let urlCount  = 0;
    let htmlCount = 0;

    router.get("/", (ctx) => {
        ctx.body = {
            version: package.version,
            urlCount,
            htmlCount,
            totalCount: urlCount + htmlCount,
        };
    });

    router.post("/url", async (ctx) => {
        const page  = await browser.newPage();
        const body  = ctx.request.body;
        const {url} = body;

        const {width, height} = config.getDimensions(body);

        await page.setViewport({width, height});
        await page.goto(url);

        ctx.body = await page.screenshot();
        ctx.type = config.getResponseType(body);

        urlCount++;
        page.close();
    });

    router.post("/html", async (ctx) => {
        const page   = await browser.newPage();
        const body   = ctx.request.body;
        const {html} = body;

        const {width, height} = config.getDimensions(body);

        await page.setViewport({width, height});
        await page.goto(`data:text/html,${html}`, { waitUntil: "load" });

        ctx.body = await page.screenshot({omitBackground: true});
        ctx.type = config.getResponseType(body);

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
        .use(serve("./files"))
        .use(bodyParser())
        .use(router.routes())
        .use(router.allowedMethods());
    
    const {interface, port} = config.getInterfacePort();
    app.listen(port, interface);
    console.log(`Listening on: ${interface}:${port}`);
}

main();
