import { compileTemplates } from "../index";

test("templates compile successfully", async () => {
    const templates = await compileTemplates("./templates");

    expect(templates.size > 0);
});
