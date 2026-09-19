const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const config=require('./config');
const {koaBody} = require('koa-body');



var oplog = require('./oplog'); //错误日志上报(oplog-collector 127.0.0.1:8301)

// ── 业务错误捕获(埋点 2026-09-19): catch 内 console.error 吞掉的错误自动上报 oplog ──
(function () {
  var _origErr = console.error.bind(console);
  var _last = {}, _busy = false;
  var _skip = /^(?:uncaughtException:|unhandledRejection:|Unhandled Rejection at:|request error:|\[oplog\])|Packets out of order|ECONNRESET|ETIMEDOUT|socket hang up|Connection Error/i;
  function _str(o) { try { return (o && o.stack) ? String(o.stack) : (typeof o === 'string' ? o : JSON.stringify(o)); } catch (e) { return String(o); } }
  console.error = function () {
    try {
      if (!_busy) {
        _busy = true;
        var args = Array.prototype.slice.call(arguments);
        var msg = args.map(_str).join(' ').slice(0, 2000);
        var st = '';
        for (var i = 0; i < args.length; i++) { if (args[i] && args[i].stack) { st = String(args[i].stack); break; } }
        var now = Date.now();
        if (msg && !_skip.test(msg) && (!_last[msg] || now - _last[msg] > 10000)) {
          if (Object.keys(_last).length > 500) { _last = {}; }
          _last[msg] = now;
          oplog.report({ type: 'console-error', level: 'error', api: 'console.error', error_msg: msg, stack: st });
        }
      }
    } catch (e) {} finally { _busy = false; }
    return _origErr.apply(console, arguments);
  };
})();

// 进程级兜底: uncaughtException/unhandledRejection 记录并上报(失败静默,不影响业务)
process.on('uncaughtException', function (err) { console.error('uncaughtException:', err); try { oplog.report({ type: 'backend_error', level: 'error', error_msg: 'uncaughtException: ' + ((err && err.message) || err), stack: err && err.stack }); } catch (e) {} });
process.on('unhandledRejection', function (reason) { console.error('unhandledRejection:', reason); try { oplog.report({ type: 'unhandledrejection', level: 'error', error_msg: 'unhandledRejection: ' + ((reason && reason.message) || reason), stack: reason && reason.stack }); } catch (e) {} });

const app = new Koa();

// 全局错误中间件: 捕获路由抛出的异常并上报
app.use(async (ctx, next) => {
  try { await next(); }
  catch (err) {
    console.error('request error:', ctx.method, ctx.url, err);
    try { oplog.report({ type: 'backend_error', level: 'error', api: ctx.url, method: ctx.method, error_msg: (err && err.message) || String(err), stack: err && err.stack }); } catch (e) {}
    ctx.status = (err && err.status) || 500;
    ctx.body = { code: 0, error: (err && err.message) || '服务器内部错误' };
  }
});

app.use(koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 2000*1024*1024, // 设置上传文件大小最大限制，默认2M
      allowEmptyFiles: false, 
    }
  }));
  
app.use(bodyParser());
const router=require('./routes/routes');
app.use(router.routes());
app.listen(config.port,function(){
    console.log('started http://localhost:'+config.port);
});