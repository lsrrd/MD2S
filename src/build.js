const fs = require('fs');
const glob = require("glob");
const grayMatter = require("gray-matter");
const handlebars = require("handlebars");
const hljs = require("highlight.js");
const marked = require("marked");
const path = require('path');

marked.setOptions({
    highlight: function(code, lang) {
        return hljs.highlight(code, { language: lang }).value;
    }
});

// Array of posts for index
let posts = [];

const parse = (name) => {
    const raw = fs.readFileSync(name, 'utf8');
    const parsed = grayMatter(raw);
    const html = marked.parse(parsed.content);
    return { ...parsed, html }
}

const createPost = (source,  data) => {
    const template = handlebars.compile(source);
    return template(data);
}

const processPost = (name, template) => {
    const file = parse(name);
    const outFile = file.data.slug + ".html";
    const date = new Date(file.data.time * 1000).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric" });
    const built = createPost(template, { title: file.data.title, time: date, slug: file.data.slug, content: file.html });
    fs.writeFileSync(path.resolve("public", "posts") + "/" + outFile, built)

    posts.push({ title: file.data.title, slug: file.data.slug, description: file.data.description, time: new Date(file.data.time) })
}

const createIndex = (source, data) => {
    const template = handlebars.compile(source);
    return template(data);
}

const processIndex = (template) => {
    const outFile = "index.html";
    const built = createIndex(template, { posts: posts });
    fs.writeFileSync(path.resolve("public") + "/" + outFile, built);
}

const build = () => {
    const postTemplate = fs.readFileSync(path.resolve("template/post.html")).toString();
    const files = glob.sync(path.resolve("posts") + "/**/*.md");

    files.forEach((file) => {
        processPost(file, postTemplate);
    })

    // Sort newest first
    posts.sort((x, y) => {
        return y.time - x.time;
    });

    const indexTemplate = fs.readFileSync(path.resolve("template/index.html")).toString();
    processIndex(indexTemplate);
}

build();