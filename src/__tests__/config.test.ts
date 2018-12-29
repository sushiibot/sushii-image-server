import Config from "../config";

// different values
const config = new Config("./src/__tests__/config.test.json");
// default config, same as config.json in root dir
const defaultConfig = new Config("./notavalidfile.json");

test("config file is read successfully", () => {
    expect(config.config).toBeDefined;
})

test("Nonexistant config file is undefined", () => {
    expect(defaultConfig.config).toBeUndefined;
})

test("Is headless", () => {
    const isHeadless = config.isHeadless();
    expect(isHeadless).toBe(false);
})

test("Is headless by default", () => {
    const isHeadless = defaultConfig.isHeadless();
    expect(isHeadless).toBe(true);
})

test("Browser args", () => {
    const args = config.getBrowserArgs();
    expect(args).toEqual(["--no-sandbox", "--disable-setuid-sandbox"]);
})

test("Browser args by default", () => {
    const args = defaultConfig.getBrowserArgs();
    expect(args).toEqual([]);
})

test("Interface and port from config", () => {
    const interfacePort = {
        interface: "localhost",
        port: 3001,
    };

    expect(config.getInterfacePort()).toEqual(interfacePort);
})

test("Interface and port by default", () => {
    const interfacePort = {
        interface: "127.0.0.1",
        port: 3000,
    };

    expect(defaultConfig.getInterfacePort()).toEqual(interfacePort);
})

test("Response type given in body", () => {
    const formats = ["png", "jpg", "jpeg"];
    const responseTypes = ["image/png", "image/jpeg", "image/jpeg"];

    for (let i = 0; i < formats.length; ++i) {
        const body = {imageFormat: formats[i]};
        const responseType = config.getResponseType(body);

        expect(responseType).toBe(responseTypes[i]);
    }
})

test("Response type given in config", () => {
    const responseType = config.getResponseType({});
    expect(responseType).toBe("image/jpeg");
})

test("Response type given by default", () => {
    const responseType = defaultConfig.getResponseType({});
    expect(responseType).toBe("image/png");
})

test("Both dimensions given in body", () => {
    const body = {
        width: "30",
        height: "40",
    };

    const dimensions = config.getDimensions(body);
    expect(dimensions).toEqual({width: 30, height: 40});
})

test("Width given in body", () => {
    const body = {
        width: "30",
    };

    const dimensions = config.getDimensions(body);
    expect(dimensions).toEqual({width: 30, height: 720});
})

test("Height given in body", () => {
    const body = {
        height: "30",
    };

    const dimensions = config.getDimensions(body);
    expect(dimensions).toEqual({width: 1280, height: 30});
})

test("Both dimensions given in config", () => {
    const dimensions = config.getDimensions({});
    expect(dimensions).toEqual({width: 1280, height: 720});
})

test("Both dimensions given by default", () => {
    const dimensions = defaultConfig.getDimensions({});
    expect(dimensions).toEqual({ width: 512, height: 512 });
})

test("Quality given in body", () => {
    const body = {
        quality: "50",
    };

    const quality = config.getQuality(body);
    expect(quality).toEqual(50);
})

test("Quality given in config", () => {
    const quality = config.getQuality({});
    expect(quality).toEqual(100);
})

test("Quality given by default", () => {
    const quality = defaultConfig.getQuality({});
    expect(quality).toEqual(70);
})
