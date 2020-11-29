import * as Types from "./types";

function env() {}

export default class Config {
    interface?: string;
    port: number;

    headless: boolean;
    browserArgs: string[];

    width: number;
    height: number;

    imageFormat: Types.ImageFormat;
    quality: number;

    templatesDir: string;

    constructor() {
        const {
            SUSHII_IMG_INTERFACE = "0.0.0.0",
            SUSHII_IMG_PORT = "3000",
            SUSHII_IMG_HEADLESS = "true",
            SUSHII_IMG_BROWSER_ARGS = "",
            SUSHII_IMG_WIDTH = "512",
            SUSHII_IMG_HEIGHT = "512",
            SUSHII_IMG_IMAGE_FORMAT = "png",
            SUSHII_IMG_QUALITY = "70",
            SUSHII_TEMPLATES_DIR = "./templates",
        } = process.env;

        this.interface = SUSHII_IMG_INTERFACE;
        this.port = parseInt(SUSHII_IMG_PORT) || 3000;
        this.headless = SUSHII_IMG_HEADLESS
            ? SUSHII_IMG_HEADLESS === "true"
            : true;
        this.browserArgs = (SUSHII_IMG_BROWSER_ARGS || "").split(" ");
        this.width = parseInt(SUSHII_IMG_WIDTH) || 512;
        this.height = parseInt(SUSHII_IMG_HEIGHT) || 512;
        this.imageFormat =
            (SUSHII_IMG_IMAGE_FORMAT as Types.ImageFormat) || "png";
        this.quality = parseInt(SUSHII_IMG_QUALITY) || 70;
        this.templatesDir = SUSHII_TEMPLATES_DIR || "./templates";
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
