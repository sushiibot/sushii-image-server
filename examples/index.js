const axios = require("axios");
const fs = require("fs");

async function main() {
    const res = await axios({
        method: "post",
        url: "http://localhost:3000/template",
        data: {
            templateHtml: "hello {{name}}",
            width: 256,
            height: 128,
            context: {
                name: "world",
            },
        },
        responseType: "stream",
    });

    // res.data image buffer
    res.data.pipe(fs.createWriteStream("./img.png"));
}

main();
