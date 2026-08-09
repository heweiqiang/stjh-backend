//import { arch } from 'os';

const config = require('../config');
const knex = require('knex')(config.db);
const fs = require('fs');
const logRecord = require("../log_record");


module.exports = {

    s_picture: async (ctx, next) => { //查询记录

        let data = null;
        let zhuisuID = ctx.request.query.zhuisuID;

        if (!zhuisuID) {
            data = '';
        } else {  //
            await knex.select().from('picture').where('zhuisuID', '=', zhuisuID)
                .then(function (res) {
                    data = res;
                })
                .catch(function (e) {
                    data = '';
                    console.error(e);
                });
        }; //end if  
        ctx.response.body = data;
    }, // end 

    d_picture: async (ctx, nex) => { //删除记录
        const startTime = logRecord.formatDateWithMilliseconds();
        const id = ctx.request.body.id;
        let urlpath = ctx.request.body.urlpath;// 删除图片文件
        if (!id) {
            ctx.response.body = 'NaN';
            return;
        }

        try {
            fs.unlink(urlpath, function (error) {
                if (error) { throw error; }
            });
            const deleteQuery = knex('picture').del().where('id', '=', id) //删除数据库记录
            const sqlString = deleteQuery.toString();
            await deleteQuery;


            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'picture',
                eventType: 'DELETE',
                functionName: 'd_picture',
                body: { id: id, picture: urlpath },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = "OK";
        } catch (error) {
            console.error(`d_picture接口执行错误：${error}`)
            ctx.response.body = "Fail";
        }
    },
    i_picture: async (ctx, next) => {  //新增记录
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
            const image = `images/${newfilename}`;

            let upstream = fs.createWriteStream(`images/${newfilename}`);
            reader.pipe(upstream);

            let mydate = new Date();
            let picture = {
                zhuisuID: filedata.zhuisuID,
                picture: `images/${newfilename}`,
                createtime: mydate.toLocaleDateString(),
            };
            const insertQuery = knex('picture').returning('id').insert(picture);
            const sqlString = insertQuery.toString();
            const result = await insertQuery;

            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'picture',
                eventType: 'INSERT',
                functionName: 'i_picture',
                body: { id: result[0], ...picture },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = { ID: result, picture: image };
        } catch (error) {
            console.error(`i_picture接口执行错误：${error}`)
            ctx.response.body = null;
        }
    },
};