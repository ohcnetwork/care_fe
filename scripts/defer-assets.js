const fs = require("fs");
const path = require("path");
const { parse } = require("node-html-parser");

const indexFilePath = path.resolve(__dirname, "..", "build", "index.html");

fs.readFile(indexFilePath, "utf8", function (err, data) {
    if (err) {
        return console.log(err);
    }

    const document = parse(data);

    // Add defer attribute to script tags
    const scripts = document.querySelectorAll("script")
    for (let script of scripts) {
        if (!script.attrs.src) {
            continue;
        }
        script.setAttribute("defer", "");
    }

    // make css non-blocking
    const links = document.querySelectorAll("link")
    for (let link of links) {
        if (link.attrs.rel === "stylesheet") {
            link.setAttribute("media", "print");
            link.setAttribute("onload", "this.onload=null;this.removeAttribute('media');");
        }
    }

    const updatedHTML = document.toString();
    fs.writeFile(indexFilePath, updatedHTML, "utf8", function (err) {
        if (err) {
            return console.log(err);
        }
    });
});