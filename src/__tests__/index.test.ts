import { compileTemplates, Context, getApp } from "../index";
import Koa from "koa";
import request, { SuperTest, Test } from "supertest";
import Config from "../config";

test("templates compile successfully", async () => {
    const templates = await compileTemplates("./templates");

    expect(templates.size > 0);
});

describe("HTTP", () => {
    let app: Koa<Koa.DefaultState, Context>;
    let r: SuperTest<Test>;

    beforeAll(async () => {
        app = await getApp(new Config());
        r = request(app.callback());
    });

    afterAll(async () => {
        await app.context.browser.close();
    });

    it("should handle /metrics", async () => {
        const res = await r.get("/metrics");

        expect(res.status).toBe(200);
    });

    it("should handle /url", async () => {
        await r
            .post("/url")
            .set("Content-Type", "application/json")
            .send({
                url: "https://sushii.xyz",
                width: 1280,
                height: 720,
                imageFormat: "jpeg",
                quality: 90,
            })
            .expect(200)
            .expect("Content-Type", "image/jpeg");
    });

    it("should handle /html", async () => {
        await r
            .post("/html")
            .set("Content-Type", "application/json")
            .send({
                html: "<h1>Hello Kitty meowmeow</h1>",
                width: 1280,
                height: 720,
                imageFormat: "png",
            })
            .expect(200)
            .expect("Content-Type", "image/png");
    });

    it("/template with templateHtml", async () => {
        await r
            .post("/template")
            .set("Content-Type", "application/json")
            .send({
                templateHtml: "<h1>Hello {{name}}</h1>",
                context: {
                    name: "bunbun",
                },
            })
            .expect(200)
            .expect("Content-Type", "image/png");
    });

    it("/template with templateName", async () => {
        await r
            .post("/template")
            .set("Content-Type", "application/json")
            .send({
                templateName: "test",
                context: {
                    name: "meowmeow",
                },
            })
            .expect(200)
            .expect("Content-Type", "image/png");
    });
});
