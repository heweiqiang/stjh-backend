const config = require('../config');
const knex = require('knex')(config.db);
const fs = require('fs');
const formatdatetime = require('../formatdatetime');
const logRecord = require("../log_record");

module.exports = {

    s_userInfo: async (ctx, next) => { //查询记录

        let self_openid = ctx.request.query.openid; //品种编号   
        let data = null;

        await knex('userinfo')
            .where('self_openid', '=', self_openid)
            .then(function (res) {
                data = res;
            })
            .catch(function (e) {
                data = [];
                console.error(e);
            })

        return ctx.response.body = data;


    }, // end s_fanqie_view

    i_userinfo: async (ctx, next) => {  //新增记录
        const startTime = logRecord.formatDateWithMilliseconds();
        if (!ctx.request.body) {
            ctx.response.body = 'NaN';
            return;
        }
        let mydate = formatdatetime.formatDate(new Date(), '-');
        let userinfo = {
            self_openid: ctx.request.body.self_openid,
            jingyingzhe: ctx.request.body.jingyingzhe,
            xukezheng: ctx.request.body.xukezheng,
            telephone: ctx.request.body.telephone,
            dizhi: ctx.request.body.dizhi,
            lianxiren: ctx.request.body.lianxiren,
            lianxifangshi: ctx.request.body.lianxifangshi,
            wangzhi: ctx.request.body.wangzhi,
            createtime: mydate,
            updatetime: mydate,
        };
        try {
            const insertQuery = knex('userinfo').returning('id').insert(userinfo);
            const sqlString = insertQuery.toString();
            const result = await insertQuery;

            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'userinfo',
                eventType: 'INSERT',
                functionName: 'i_userinfo',
                body: { id: result[0], ...userinfo },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = result;
        } catch (error) {
            console.error(`i_userinfo接口执行错误：${error}`)
            ctx.response.body = '';
        }

    },
    u_userinfo: async (ctx, next) => {
        const startTime = logRecord.formatDateWithMilliseconds();
        let id = ctx.request.body.id;
        if (!id) {
            ctx.response.body = 'NaN';
            return;
        };
        let mydate = formatdatetime.formatDate(new Date(), '-');
        let userinfo = {
            jingyingzhe: ctx.request.body.jingyingzhe,
            xukezheng: ctx.request.body.xukezheng,
            telephone: ctx.request.body.telephone,
            dizhi: ctx.request.body.dizhi,
            lianxiren: ctx.request.body.lianxiren,
            lianxifangshi: ctx.request.body.lianxifangshi,
            wangzhi: ctx.request.body.wangzhi,
            updatetime: mydate,
        };


        try {
            const updatetQuery = knex('userinfo').update(userinfo).where('id', '=', id);
            const sqlString = updatetQuery.toString();
            await updatetQuery;

            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'userinfo',
                eventType: 'UPDATE',
                functionName: 'u_userinfo',
                body: { id, ...userinfo },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = "OK";
        } catch (error) {
            console.error(`u_userinfo接口执行错误：${error}`)
            ctx.response.body = "Fail";
        }
    },

    loadlogo: async (ctx, next) => {
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

            let upstream = fs.createWriteStream(`images/logo/${newfilename}`);
            reader.pipe(upstream);

            const updateQuery = knex('userinfo').where('self_openid', '=', filedata.self_openid).update({ logo: newfilename });
            const sqlString = updateQuery.toString();
            await updateQuery;

            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'userinfo',
                eventType: 'UPDATE',
                functionName: 'loadlogo',
                body: { self_openid: filedata.self_openid, logo: newfilename },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = "OK";
        } catch (error) {
            console.error(`loadlogo接口执行错误：${error}`)
            ctx.response.body = 'Fail';
        }

    }

};