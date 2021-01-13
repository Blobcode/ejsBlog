//! SECRET KEY
secret = "secret";

// koa stuff
const Koa = require("koa");
const Router = require("@koa/router");
const bodyParser = require("koa-bodyparser");
const logger = require("koa-logger");
const render = require("koa-ejs");
const path = require("path");

// db
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

// misc.
const { nanoid } = require("nanoid");
const { request } = require("http");
const showdown = require("showdown"),
  converter = new showdown.Converter();

// init app
const app = new Koa();
const router = new Router();
const adapter = new FileSync("db.json");
const db = low(adapter);

app.use(bodyParser());
app.use(logger());

render(app, {
  root: path.join(__dirname, "views"),
  layout: "template",
  viewExt: "ejs",
  cache: false,
  debug: true,
});

// Set some defaults (required if your JSON file is empty)
db.defaults({ posts: [] }).write();

// routes
router.get("/", async (ctx, next) => {
  await ctx.render("index", { posts: db.get("posts").value() });
});

router.get("/p/:id", async (ctx, next) => {
  await ctx.render("post", {
    post: db.get("posts").find({ id: ctx.params.id }).value(),
  });
});

router.get("/a", async (ctx, next) => {
  await ctx.render("admin", { posts: db.get("posts").value() });
});

router.get("/a/new", async (ctx, next) => {
  await ctx.render("new");
});

router.get("/a/edit/:id", async (ctx, next) => {
  await ctx.render("edit", {
    post: db.get("posts").find({ id: ctx.params.id }).value(),
  });
});

router.post("/api/new", async (ctx, next) => {
  if (ctx.request.body.key == secret) {
    md = ctx.request.body.md;
    body = converter.makeHtml(md);
    db.get("posts")
      .push({
        id: nanoid(6),
        title: ctx.request.body.title,
        md: md,
        body: body,
      })
      .write();
  }
});

router.patch("/api/edit", async (ctx, next) => {
  if (ctx.request.body.key == secret) {
    md = ctx.request.body.md;
    body = converter.makeHtml(md);
    db.get("posts")
      .find({ id: ctx.request.body.id })
      .assign({
        title: ctx.request.body.title,
        md: md,
        body: body,
      })
      .write();
  }
});

router.delete("/api/delete", async (ctx, next) => {
  if (ctx.request.body.key == secret) {
    db.get("posts").remove({ id: ctx.request.body.id }).write();
  }
});

// start server
app.use(router.routes()).use(router.allowedMethods());
app.listen(3000);
