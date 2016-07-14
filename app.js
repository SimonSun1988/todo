const koa = require('koa');
const app = koa();
const route = require('koa-route');
const bodyParser = require('koa-bodyparser');
const nunjucks = require('koajs-nunjucks');
const mount = require('koa-mount');
const serve = require('koa-static');
const mongo = require('koa-mongo');
const Promise = require('bluebird');
const moment = require('moment-timezone');
const objectId = require('objectid');


app.use(mount('/public', serve(__dirname + '/public')));
app.use(bodyParser());
app.use(nunjucks('views', {
    autoescape: true,
    watch: true
}));
app.use(mongo({
    uri: 'mongodb://localhost:27017/todo'
}));

app.use(route.get('/', function*() {
    let that = this;
    let issues = yield new Promise(function(resolve, reject) {
        that.mongo.db('todo')
            .collection('issues')
            .find({ status: { $ne: 'DELETE' } })
            .sort({ deadline: 1 })
            .toArray(function(err, docs) {
                return resolve(docs);
            });
    });

    return yield this.render('index.html', { issues: issues });
}));

app.use(route.get('/create', function*() {
    return yield this.render('create.html');
}));

app.use(route.post('/create', function*() {

    let now = Date.now();
    let that = this;
    let name = this.request.body.name || '';
    let date = this.request.body.date || moment(now).tz('Asia/Taipei').format('YYYY-MM-DD');
    let time = this.request.body.time || moment(now).tz('Asia/Taipei').format('HH:mm');
    // let start = this.request.body.start || moment(now).tz('Asia/Taipei').format('HH:mm');
    // let end = this.request.body.end || moment(now).tz('Asia/Taipei').format('HH:mm');
    let memo = this.request.body.memo || '';
    let deadlineFormat = `${date} ${time}`;
    let deadline = moment(deadlineFormat).format('x');

    yield new Promise(function(resolve, reject) {
        that.mongo.db('todo')
            .collection('issues')
            .insert({
                name: name,
                date: date,
                time: time,
                // start: start,
                // end: `,
                deadline: parseInt(deadline),
                deadlineFormat: deadlineFormat,
                memo: memo,
                createdAt: parseInt(moment(now).format('x')),
                createdAtFormat: moment(now).tz('Asia/Taipei').format('YYYY-MM-DD HH:mm'),
                status: 'OPEN'

            }, function(err, doc) {
                return resolve(doc);
            });
    });

    return this.redirect('/');
}));

app.use(route.get('/issues/:id', function*(id, next) {
        let that = this;
        let issue = yield new Promise(function(resolve, reject) {
            that.mongo.db('todo')
                .collection('issues')
                .findOne({ _id: objectId(id) }, function(err, doc)  {
                    return resolve(doc);
                });
        });
        return yield this.render('issue.html', {issue: issue});
    }));

app.use(route.post('/updateStatus', function*(next) {
        let that = this;
        let id = this.request.body.id;
        let status = this.request.body.status;
        let updatedIssue = yield new Promise(function(resolve, reject) {
            that.mongo.db('todo')
                .collection('issues')
                .update({ _id: objectId(id) }, { $set: { status: status } }, function(err, doc)  {
                    return resolve(doc);
                });
        });
        return this.body = this.request.body;
    }));

app.listen(8787);