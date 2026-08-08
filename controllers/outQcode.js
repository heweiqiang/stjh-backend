//import { arch } from 'os';

const config = require('../config');
const knex = require('knex')(config.db);
const fs = require('fs');


const formatdatetime = require('../formatdatetime');
const logRecord = require("../log_record");


module.exports = {
    create_qr: async (ctx, next) => {
        // 生成并保存外部链接二维码
        const startTime = logRecord.formatDateWithMilliseconds();

        // 使用解构赋值获取请求参数
        const {
            qrCount,
            zhuisuID,
            chanpinid,
            pinzhongmingcheng,
            zuowu,
            self_openid
        } = ctx.request.body;

        // 参数验证
        if (!qrCount || !zhuisuID || !chanpinid) {
            ctx.response.body = '缺少必要参数';
            return;
        }

        const filename = `files/${Math.random().toString()}.txt`;
        const mydate = formatdatetime.formatDateTime(new Date(), '-', ':');
        const BATCH_SIZE = 5000;

        // 创建空文件
        try {
            fs.writeFileSync(filename, "");
            console.log("The file was saved!");
        } catch (err) {
            console.error("创建文件失败:", err);
            ctx.response.body = '文件创建失败';
            return;
        }

        let qrcodeList = [];
        let qrlist = '';
        let sqlString = '';

        // 定义批量插入函数
        const insertBatch = async (batchData, batchLinks) => {
            if (batchData.length === 0) return;
            try {
                sqlString += knex('outQcode').returning('id').insert(batchData).toString();
                await knex('outQcode')
                    .returning('id')
                    .insert(batchData);

                // 写入文件
                fs.writeFileSync(filename, batchLinks, {
                    flag: 'a',
                    encoding: 'utf-8',
                    mode: '0666'
                });
                console.log(`批量处理成功: ${batchData.length}条记录`);
            } catch (error) {
                console.error("批量操作失败:", error);
                throw error;
            }
        };

        try {
            // 批量生成和处理二维码
            for (let i = 1; i <= qrCount; i++) {
                const Qcode = formatdatetime.randNumber(8);
                const QcodeLink = `${config.qrLink}${zhuisuID}${Qcode}`;

                const qrcode = {
                    zhuisuID,
                    chanpinid,
                    pinzhongmingcheng,
                    zuowu,
                    Qcode,
                    filedir: filename,
                    QcodeLink,
                    self_openid,
                    createtime: mydate,
                    updatetime: mydate,
                };

                qrcodeList.push(qrcode);
                qrlist += `${QcodeLink}\r\n`;

                // 达到批量大小或最后一次时执行批量操作
                if (i % BATCH_SIZE === 0 || i === qrCount) {
                    await insertBatch(qrcodeList, qrlist);
                    qrcodeList = [];
                    qrlist = '';
                }
            }

            // 记录操作日志
            await logRecord.insertLogRecord({
                tableName: 'outQcode',
                eventType: 'INSERT',
                functionName: 'create_qr',
                remarks: `生成二维码: 产品${chanpinid},追溯码${zhuisuID}, 生成数量${qrCount}`,
                body: { filename },
                SQL: sqlString || '未生成SQL',
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });

            // 返回结果保持不变
            ctx.response.body = `http://image.goodluckpacking.com:8090/stjh/${filename}`;
        } catch (error) {
            console.error("生成二维码过程中出错:", error);
            ctx.response.body = '二维码生成失败';
        }
    },

    outQcode_s: async (ctx, nex) => { //查询外部码列表信息

        let zhuisuID = ctx.request.query.zhuisuID;
        let Qcode = ctx.request.query.Qcode;
        let chanpinid = ctx.request.query.chanpinid;
        let loadcount = ctx.request.query.loadcount;
        let currentID = ctx.request.query.currentID;

        if (loadcount == null || loadcount == undefined || loadcount == '') {
            loadcount = 10;
        }
        // 设置过滤条件信息
        let sql_where = "scancount >? and id<?"
        let sql_tj;
        if (currentID == null || currentID == undefined || currentID == '') {
            sql_tj = [0, 99999999];
        } else {
            sql_tj = [0, currentID];
        }


        if (zhuisuID !== null && zhuisuID !== undefined && zhuisuID !== '') {
            sql_where = sql_where + ' and zhuisuID = ?';
            sql_tj.push(zhuisuID);
        };

        if (chanpinid !== null && chanpinid !== undefined && chanpinid !== '') {
            sql_where = sql_where + ' and chanpinid = ?';
            sql_tj.push(chanpinid);
        };

        if (Qcode !== null && Qcode !== undefined && Qcode !== '') {
            sql_where = sql_where + ' and Qcode = ?';
            sql_tj.push(Qcode);
        };

        //完成过滤条件设置

        // 查询数据表并返回

        await knex.select('id', 'zhuisuID', 'chanpinid', 'pinzhongmingcheng', 'zuowu', 'Qcode', 'scancount')
            .from('outQcode')
            .limit(loadcount)
            .whereRaw(sql_where, sql_tj)
            .orderBy('scancount', 'desc')
            .then(function (res) {
                data = res;
            })
            .catch(function (e) {
                data = null;
                console.error(e);
            });

        ctx.response.body = data;
    },
    check_qr: async (ctx, next) => {  //验证此次查询是否有效

        let zhuisuID = ctx.request.query.zhuisuID;
        let Qcode = ctx.request.query.Qcode;
        let data = 0;
        await knex.select('id')
            .from('outQcode')
            .whereRaw("zhuisuID = ? and Qcode=?", [zhuisuID, Qcode])
            .then(function (res) {
                if (res.length > 0) {
                    data = 1;
                }
            })
            .catch(function (e) {
                console.error(e);
            });
        ctx.response.body = data;

    },
};


