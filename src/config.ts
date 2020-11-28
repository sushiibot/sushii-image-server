import * as Types from "./types";

function env() {}

export default class Config {
    interface?: string;
    port?: number;

    headless?: boolean;
    browserArgs?: string;

    width?: number;
    height?: number;

    imageFormat?: Types.ImageFormat;
    quality?: number;

    constructor() {
        const {
            SUSHII_IMG_INTERFACE,
            SUSHII_IMG_PORT,
            SUSHII_IMG_HEADLESS,
            SUSHII_IMG_BROWSER_ARGS,
            SUSHII_IMG_WIDTH,
            SUSHII_IMG_HEIGHT,
            SUSHII_IMG_IMAGE_FORMAT,
            SUSHII_IMG_QUALITY,
        } = process.env;

        this.interface = SUSHII_IMG_INTERFACE;
        this.port = parseInt(SUSHII_IMG_PORT) | 3000;
        this.headless = SUSHII_IMG_HEADLESS === "true";
        this.browserArgs = SUSHII_IMG_BROWSER_ARGS;
        this.width = parseInt(SUSHII_IMG_WIDTH);
        this.height = parseInt(SUSHII_IMG_HEIGHT);
        this.imageFormat = SUSHII_IMG_IMAGE_FORMAT as Types.ImageFormat;
        this.quality = parseInt(SUSHII_IMG_QUALITY);
    }

    /**
     * Gets config fields that are invalid
     */
    _getConfigErrors(): string[] {
        const errors: string[] = [];

        try {
            // should return with either config value or default
            // default value should obviously not error or I'm dumb
            const _ = this.getImageFormat({});
        } catch (err) {
            errors.push("imageFormat (string)");
        }

        if (this.interface && typeof this.interface !== "string") {
            errors.push("interface (string)");
        }

        if (this.port && typeof this.port !== "number") {
            errors.push("port (number)");
        }

        if (this.headless && typeof this.headless !== "boolean") {
            errors.push("headless (boolean)");
        }

        if (this.browserArgs && typeof this.browserArgs !== "string") {
            errors.push("browserArgs (string)");
        }

        if (this.width && typeof this.width !== "number") {
            errors.push("width (number)");
        }

        if (this.height && typeof this.height !== "number") {
            errors.push("height (number)");
        }

        if (this.quality && typeof this.quality !== "number") {
            errors.push("quality (number)");
        }

        return errors;
    }

    isValid(): boolean {
        const errs = this._getConfigErrors();

        if (errs.length === 0) {
            return true;
        }

        const errStr = errs.join("\n\t");
        console.log(
            `The following fields in your configuration have incorrect types:\n\t${errStr}`
        );
        return false;
    }

    /**
     * Gets the option if the background browser should run headless
     */
    isHeadless(): boolean {
        if (this.headless !== undefined) {
            return this.headless;
        }

        return true;
    }

    /**
     * Gets the chromium browser args from config
     */
    getBrowserArgs(): string[] {
        if (this.browserArgs !== undefined) {
            return this.browserArgs.split(" ");
        }

        return [];
    }

    /**
     * Gets the HTTP server interface
     */
    _getInterface(): string {
        if (this.interface !== undefined) {
            return this.interface;
        }

        // default run on localhost, don't want to expose publicly
        return "127.0.0.1";
    }

    /**
     * Gets the HTTP server port
     */
    _getPort(): number {
        if (this.port !== undefined) {
            return this.port;
        }

        return 3000;
    }

    /**
     * Gets the interface and port of the HTTP server
     */
    getInterfacePort() {
        const interfacePort: Types.InterfacePort = {
            interface: this._getInterface(),
            port: this._getPort(),
        };

        return interfacePort;
    }

    /**
     * Gets the image format for the response
     *
     * @param body HTTP request body
     */
    _getImageFormat(body: Types.Body): string {
        let { imageFormat } = body;
        // post body type
        if (imageFormat !== undefined) {
            return imageFormat;
        }

        // config type
        if (this.imageFormat !== undefined) {
            return this.imageFormat;
        }

        // none given in args or config
        return "png";
    }

    /**
     * Checks if a given format is valid
     *
     * @param value Format value to test
     */
    _isValidFormat(value: string): value is Types.ImageFormat {
        const allowedFormats: string[] = ["png", "jpeg"];

        return allowedFormats.indexOf(value) !== -1;
    }

    /**
     * Gets the validated image format for the response
     *
     * @param body HTTP request body
     * @returns    Image format
     */
    getImageFormat(body: Types.Body): Types.ImageFormat {
        let type = this._getImageFormat(body);
        // its jpeg not jpg bruh
        // https://tools.ietf.org/html/rfc3745, https://www.w3.org/Graphics/JPEG/
        if (type === "jpg") {
            type = "jpeg";
        }

        if (!this._isValidFormat(type)) {
            throw new TypeError(`Invalid type given: ${type}`);
        }

        return type as Types.ImageFormat;
    }

    /**
     * Gets the Content-Type for the response
     *
     * @param body HTTP request body
     * @returns    Response Type
     */
    getResponseType(body: Types.Body): Types.ResponseType {
        const type = this.getImageFormat(body);
        const responseType = `image/${type}`;

        return responseType as Types.ResponseType;
    }

    /**
     * Gets a single image and view port dimension
     *
     * @param value Value of a single dimension
     * @param dim   Dimension to look up (width / height)
     * @returns     A single image / viewport dimension
     */
    _getDimension(value: string, dim: Types.Dimension): number {
        if (value !== undefined) {
            return parseInt(value);
        }

        if (this[dim] !== undefined) {
            return this[dim];
        }

        return 512;
    }

    /**
     * Gets image and viewport dimensions
     *
     * @param body HTTP request body
     * @returns    Image / viewport dimensions
     */
    getDimensions(body: Types.Body): Types.Dimensions {
        let { width, height } = body;

        let dimensions: Types.Dimensions = {
            width: this._getDimension(width, "width"),
            height: this._getDimension(height, "height"),
        };

        return dimensions;
    }

    /**
     * Gets quality value for JPEG screenshots
     * @param body HTTP request body
     * @returns    Quality value
     */
    getQuality(body: Types.Body): number {
        let { quality } = body;

        if (quality !== undefined) {
            return parseInt(quality);
        }

        if (this.quality !== undefined) {
            return this.quality;
        }

        return 70;
    }
}
