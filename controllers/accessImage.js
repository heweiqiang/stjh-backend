//import { arch } from 'os';

const config = require('../config');
const knex = require('knex')(config.db);
const fs = require('fs');
const logRecord = require("../log_record");


module.exports = {

    s_accessI: async (ctx, next) => { //查询记录

        let data = null;
        let zhuisuID = ctx.request.query.zhuisuID;
        let self_openid = ctx.request.query.self_openid;
        if (!zhuisuID || !self_openid) {
            data = '';
        } else {  //
            await knex.select('id', 'picture').from('accessImage')
                .where('zhuisuID', '=', zhuisuID)
                .andWhere('self_openid', '=', self_openid)
                .then(function (res) {
                    data = res;
                })
                .catch(function (e) {
                    data = '';
                    console.error(e);
                });
        }; //end if  
        ctx.response.body = data;
    }, 

    d_accessI: async (ctx, nex) => { //删除记录
        const startTime = logRecord.formatDateWithMilliseconds();
        let id = ctx.request.body.id;
        let urlpath = ctx.request.body.urlpath;// 删除图片文件
        if (!id) {
            ctx.response.body = 'NaN';
            return;
        }

        try {
            fs.unlink(urlpath, function (error) {
                if (error) { throw error; }
            });
            const deleteQuery = knex('accessImage').del().where('id', '=', id) //删除数据库记录
            const sqlString = deleteQuery.toString();
            await deleteQuery;

            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'accessImage',
                eventType: 'DELETE',
                functionName: 'd_accessI',
                body: { id: id, picture: urlpath },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = "OK";
        } catch (error) {
            console.error(`d_accessI接口执行错误：${error}`)
            ctx.response.body = "Fail";
        }
    },
    i_accessI: async (ctx, next) => {  //新增记录
        const startTime = logRecord.formatDateWithMilliseconds();
        const filedata = ctx.request.body; //获取额外的图片数据
        const file = ctx.request.files.file; // 获取上传文件
        if (!ctx.request.body) {
            ctx.response.body = 'NaN';
            return;
        }

        try {
            let reader = fs.createReadStream(file.filepath); //创建可读流
            let ext = file.originalFilename.split('.').pop(); //获取上传文件的扩展名
            let newfilename = Math.random().toString() + '.' + ext; //生成新的文件名 
            const image = `images/access/${newfilename}`;

            let upstream = fs.createWriteStream(`images/access/${newfilename}`);
            reader.pipe(upstream);

            let mydate = new Date();
            let picture = {
                zhuisuID: filedata.zhuisuID,
                self_openid: filedata.self_openid,
                picture: `images/access/${newfilename}`,
                createtime: mydate.toLocaleDateString(),
            };

            const insertQuery = knex('accessImage').returning('id').insert(picture);
            const sqlString = insertQuery.toString();
            const result = await insertQuery;

            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'accessImage',
                eventType: 'INSERT',
                functionName: 'i_accessI',
                body: { id: result[0], ...picture },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = { ID: result, picture: image };
        } catch (error) {
            console.error(`i_accessI接口执行错误：${error}`)
            ctx.response.body = null;
        }
    },
};