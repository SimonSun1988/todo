const koa = require('koa');
const app = koa();
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');
const nunjucks = require('koajs-nunjucks');

app.use(bodyParser());
app.use(nunjucks('views', {
    autoescape: true,
    watch: true
}));

app.use(route.get('/', function*() {
    yield this.render('index.html');
}));


app.use(route.post('/pets', function*() {
    console.log(this.request.body);
    let json = {};
    yield this.body = json;
}));

app.listen(3000);