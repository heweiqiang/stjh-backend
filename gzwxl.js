const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const config=require('./config');
const {koaBody} = require('koa-body');



const app = new Koa();

app.use(koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 2000*1024*1024, // 设置上传文件大小最大限制，默认200M
      allowEmptyFiles: false,
    }
  }));
  
app.use(bodyParser());
const router=require('./routes/routes');
app.use(router.routes());
app.listen(config.port,function(){
    console.log('started http://localhost:'+config.port);
});