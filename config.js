const fs = require("fs");

module.exports = class Config {
    constructor(location = "./config.json") {
        this._readConfig(location);
    }

    _readConfig(location) {
        try {
            this.config = JSON.parse(fs.readFileSync(location));
        } catch (err) {
            if (err.code === "ENOENT") {
                console.log("Config not found, using default values");
            } else {
                console.log("Something went wrong reading config file");
            }
        }
    }

    isHeadless() {
        if (this.config && this.config.headless !== undefined) {
            return this.config.headless;
        }

        return true;
    }

    getBrowserArgs() {
        if (this.config && this.config.browserArgs !== undefined) {
            return this.config.browserArgs.split(" ");
        }

        return [];
    }

    _getInterface() {
        if (this.config && this.config.interface !== undefined) {
            return this.config.interface;
        }

        return "127.0.0.1";
    }

    _getPort() {
        if (this.config && this.config.port !== undefined) {
            return this.config.port;
        }

        return 3000;
    }

    getInterfacePort() {
        return {
            interface: this._getInterface(),
            port: this._getPort(),
        };
    }

    _getImageFormat(body) {
        let {imageFormat} = body;
        // post body type
        if (imageFormat !== undefined) {
            return imageFormat;
        }

        // config type
        if (this.config && this.config.imageFormat !== undefined) {
            return this.config.imageFormat;
        }

        // none given in args or config
        return "png";
    }

    getImageFormat(body) {
        let type = this._getImageFormat(body);
        // its jpeg not jpg bruh
        // https://tools.ietf.org/html/rfc3745, https://www.w3.org/Graphics/JPEG/
        if (type === "jpg") {
            type = "jpeg";
        }

        return type;
    }

    getResponseType(body) {
        let type = this.getImageFormat(body);

        return `image/${type}`;
    }

    _getDimension(val, dim) {
        if (val !== undefined) {
            return val;
        }

        if (this.config && this.config[dim] !== undefined) {
            return this.config[dim];
        }

        return 512;
    }

    getDimensions(body) {
        let {width, height} = body;

        return {
            width: parseInt(this._getDimension(width, "width")),
            height: parseInt(this._getDimension(height, "height")),
        };
    }

    _getQuality(body) {
        let {quality} = body;
        
        if (quality !== undefined) {
            return quality;
        }

        if (this.config && this.config.quality !== undefined) {
            return this.config.quality;
        }

        return 70;
    }

    getQuality(body) {
        return parseInt(this._getQuality(body));
    }
};
