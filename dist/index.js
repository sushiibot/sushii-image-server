"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Koa = require("koa");
const serve = require("koa-static");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
const puppeteer = require("puppeteer");
const package_json_1 = require("../package.json");
const config_1 = require("./config");
const app = new Koa();
const router = new Router();
const config = new config_1.default();
async function main() {
    const browserArgs = config.getBrowserArgs();
    const browser = await puppeteer.launch({
        headless: config.isHeadless(),
        args: browserArgs
    });
    let urlCount = 0;
    let htmlCount = 0;
    router.get("/", (ctx) => {
        const stats = {
            version: package_json_1.default.version,
            urlCount,
            htmlCount,
            totalCount: urlCount + htmlCount,
        };
        ctx.body = stats;
    });
    router.post("/url", async (ctx) => {
        const page = await browser.newPage();
        const body = ctx.request.body;
        const { url } = body;
        const { width, height } = config.getDimensions(body);
        await page.setViewport({ width, height });
        await page.goto(url);
        const imageFormat = config.getImageFormat(body);
        const screenshotOptions = {
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
        const page = await browser.newPage();
        const body = ctx.request.body;
        const { html } = body;
        const { width, height } = config.getDimensions(body);
        await page.setViewport({ width, height });
        await page.goto(`data:text/html,${html}`, { waitUntil: "load" });
        const imageFormat = config.getImageFormat(body);
        const screenshotOptions = {
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
        }
        catch (err) {
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
main();
//# sourceMappingURL=index.js.map