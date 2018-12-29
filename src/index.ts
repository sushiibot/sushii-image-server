import * as Koa        from "koa";
import * as serve      from "koa-static";
import * as Router     from "koa-router";
import * as bodyParser from "koa-bodyparser";
import * as puppeteer  from "puppeteer";
import * as Types      from "./types";
import pkg             from "../package.json";
import Config          from "./config";

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
        const stats: Types.Stats = {
            version: pkg.version,
            urlCount,
            htmlCount,
            totalCount: urlCount + htmlCount,
        };
        ctx.body = stats;
    });

    router.post("/url", async (ctx) => {
        const page  = await browser.newPage();
        const body  = ctx.request.body;
        const {url} = body;

        const {width, height} = config.getDimensions(body);

        await page.setViewport({width, height});
        await page.goto(url);

        const imageFormat = config.getImageFormat(body);
        const screenshotOptions: Types.ScreenshotOptions = {
            omitBackground: true,
            type: imageFormat
        };

        if (imageFormat == "jpeg") {
            screenshotOptions.quality = config.getQuality(body);
        }

        ctx.body = await page.screenshot(screenshotOptions);
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
        await page.goto(`data:text/html;charset=utf-8,${html}`, { waitUntil: "load" });

        const imageFormat = config.getImageFormat(body);
        const screenshotOptions: Types.ScreenshotOptions = {
            omitBackground: true,
            type: imageFormat
        };

        if (imageFormat == "jpeg") {
            screenshotOptions.quality = config.getQuality(body);
        }

        ctx.body = await page.screenshot(screenshotOptions);
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

    const ifacePort = config.getInterfacePort();
    app.listen(ifacePort.port, ifacePort.interface);
    console.log(`Listening on: ${ifacePort.interface}:${ifacePort.port}`);
}

if (!config.isValid()) {
    process.exit();
}

main();
