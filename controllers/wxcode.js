//import { arch } from 'os';

const config = require('../config');
const knex = require('knex')(config.db);
const fs = require('fs');
const qr= require('qr-image');
const send = require('koa-send');
const logRecord = require("../log_record");
const formatdatetime = require('../formatdatetime');


  function createimg(zhuisuID){  //查询数据库，看是否已经生成并保存了此条件的二维码
    return new Promise((resolve,reject) =>{
      knex.select('codeimage')
      .from('qcode')
      .where('zhuisuID','=',zhuisuID)
      .then(function (res){
        if (res.length == 0){
          resolve('');
        } else{
          resolve(res[0].codeimage)
        }
      })
      .catch(function(e) {
        reject(e);
       console.error(e);
      });
    }); // end promise
  };


module.exports={


 create_qr: async (ctx,next) =>{  //生成并保存外部链接二维码
  const startTime = logRecord.formatDateWithMilliseconds();
    const zhuisuID =ctx.request.body.zhuisuID; //追溯id
    const chanpinid =ctx.request.body.chanpinid; //产品id
    const pinzhongmingcheng =ctx.request.body.pinzhongmingcheng; //品种名称
    const zuowu =ctx.request.body.zuowu; //作物
    const self_openid =ctx.request.body.self_openid; // 生成者识别码
    const img = await createimg(zhuisuID);
    if (img){
      return ctx.response.body = img;
    }



    try {
      //生成二维码并保存到对应目录里面                    
      let filename = Math.random().toString();
      filename = 'images/Qcode/' + filename + '.jpg';
      let upstream = fs.createWriteStream(filename);
      const imgpath = qr.image(config.qrLink + zhuisuID, { size: 10 });
      imgpath.pipe(upstream);

      //把数据写入数据库
      const QcodeLink = config.qrLink + zhuisuID;
      let qrcode = {
        zhuisuID: zhuisuID,
        chanpinid:chanpinid ,
        pinzhongmingcheng:pinzhongmingcheng ,
        zuowu: zuowu ,
        codeimage:filename,
        QcodeLink: QcodeLink,
        self_openid: self_openid,
        createtime:formatdatetime.formatDateTime(new Date(),'-',':'),
      };

      const insertQuery = knex('qcode').returning('id').insert(qrcode);
      const sqlString = insertQuery.toString();
      const result = await insertQuery;

      // 记录日志
      await logRecord.insertLogRecord({
        tableName: 'qcode',
        eventType: 'INSERT',
        functionName: 'createCode',
        body: {id:result[0],...qrcode},
        SQL: sqlString,
        startTime,
        endTime: logRecord.formatDateWithMilliseconds(),
      });
      ctx.response.body = filename;
    } catch (error) {
      console.error(`create_qr接口执行错误：${error}`)
      ctx.response.body = null;
    };
 },


 download_qr: async (ctx,next) =>{  //下载打包后的二维码
    let fileName = ctx.request.query.file;
    ctx.attachment(fileName);
    await send(ctx, fileName); 
 },
};