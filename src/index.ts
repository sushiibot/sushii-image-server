import Koa from "koa";
import serve from "koa-static";
import Router from "@koa/router";
import bodyParser from "koa-bodyparser";
import puppeteer from "puppeteer";
import logger from "koa-logger";
import { Stats, ScreenshotOptions } from "./types";
import pkg from "../package.json";
import Config from "./config";
import Handlebars, { template } from "handlebars";
import fs from "fs";
import util from "util";
import path from "path";
import dotenv from "dotenv";

async function compileTemplates(
    templatesDir: string
): Promise<Map<string, HandlebarsTemplateDelegate>> {
    const readdir = util.promisify(fs.readdir);
    const readFile = util.promisify(fs.readFile);

    const files = await readdir(templatesDir, "utf-8");
    const templates: Map<string, HandlebarsTemplateDelegate> = new Map();

    for (let i = 0; i < files.length; i++) {
        const filePath = path.join(templatesDir, files[i]);
        const content = await readFile(filePath);

        const fileName = path
            .basename(filePath)
            .replace(path.extname(filePath), "");

        templates.set(fileName, Handlebars.compile(content.toString()));
    }

    return templates;
}

async function main() {
    dotenv.config();

    const { TEMPLATES_DIR = "./templates" } = process.env;

    const config = new Config();
    if (!config.isValid()) {
        process.exit();
    }

    const app = new Koa();
    const router = new Router();
    const templates = await compileTemplates(TEMPLATES_DIR).catch((e) => {
        console.log("Error compiling templates: ", e);
        process.exit(1);
    });

    const browserArgs = config.getBrowserArgs();
    const browser = await puppeteer.launch({
        headless: config.isHeadless(),
        args: browserArgs,
    });

    let urlCount = 0;
    let htmlCount = 0;

    router.get("/", (ctx) => {
        const stats: Stats = {
            version: pkg.version,
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
        const screenshotOptions: ScreenshotOptions = {
            omitBackground: true,
            type: imageFormat,
        };

        if (imageFormat == "jpeg") {
            screenshotOptions.quality = config.getQuality(body);
        }

        ctx.body = await page.screenshot(screenshotOptions);
        ctx.type = config.getResponseType(body);

        page.close();
    });

    async function renderHtml(ctx: Koa.Context, html: string) {
        const page = await browser.newPage();
        const body = ctx.request.body;

        const { width, height } = config.getDimensions(body);

        // Encode HTML string in base64
        const buff = Buffer.from(html, "utf-8");
        const htmlBase64 = buff.toString("base64");

        await page.setViewport({ width, height });
        await page.goto(`data:text/html;charset=utf-8;base64,${htmlBase64}`);

        const imageFormat = config.getImageFormat(body);
        const screenshotOptions: ScreenshotOptions = {
            omitBackground: true,
            type: imageFormat,
        };

        if (imageFormat == "jpeg") {
            screenshotOptions.quality = config.getQuality(body);
        }

        ctx.body = await page.screenshot(screenshotOptions);
        ctx.type = config.getResponseType(body);

        page.close();
    }

    router.post("/html", async (ctx) => {
        await renderHtml(ctx, ctx.request.body.html);
    });

    router.post("/template", async (ctx) => {
        const { templateName, context } = ctx.request.body;

        const template = templates.get(templateName);
        if (!template) {
            throw Error(`No template named ${templateName} found`);
        }

        const html = template(context);

        await renderHtml(ctx, html);
    });

    app.use(logger())
        .use(async (ctx, next) => {
            try {
                await next();
            } catch (err) {
                console.error(err);
                // will only respond with JSON
                ctx.status = err.statusCode || err.status || 500;
                ctx.body = {
                    message: err.message,
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
