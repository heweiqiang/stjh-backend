const config = require('../config');
const knex = require('knex')(config.db);
const formatdatetime = require('../formatdatetime');
const logRecord = require("../log_record");

function getIsExistQcode(zhuisuID, Qcode) { //获取小程序码 ，path不能带参数
    return new Promise((resolve, reject) => {
        knex.select('id')
            .from('outQcode')
            .whereRaw('zhuisuID = ? and Qcode = ?', [zhuisuID, Qcode])
            .then(function (res) {
                return resolve(res);
            })
            .catch(function (e) {
                console.error(e);
                return reject(e);

            })
    })  //end promise
}

module.exports = {

    s_Qcode: async (ctx, next) => { //查询记录

        let currentID = ctx.request.query.currentID; //当前加载的最大id
        let loadcount = ctx.request.query.loadcount;//每次加载的记录数量
        let zhuisuID = ctx.request.query.zhuisuID; //品种编号
        let kehuid = ctx.request.query.kehuid; //品种编号
        let searchValue = ctx.request.query.searchValue// 搜索值
        let Qcode = ctx.request.query.Qcode;
        if (Qcode !== '' && Qcode !== null && Qcode !== undefined) { //真正的一袋一码，但outqcode表中查询失败，则返回
            let Qcodelist = await getIsExistQcode(zhuisuID, Qcode);
            if (Qcodelist.length == 0) {
                return ctx.response.body = '';
            }
        };

        let data = null;
        //如没有设置搜索的最大的编号，则初始化为0
        if (currentID == "" || currentID == undefined || currentID == null) {
            currentID = 1000000;
        };
        //如没有设置一次加载的记录数量则设置为每次加载10条
        if (loadcount == "" || loadcount == undefined || loadcount == null) {
            loadcount = 10;
        };

        //条件值初始化
        let sql_where = 'reviewinfo.id <?';
        let sql_value = [currentID];

        if (searchValue !== "" && searchValue !== undefined && searchValue !== null) {
            sql_where = sql_where + ' and (pinzhongmingcheng like ? or zuowu like ?) ';
            sql_value.push('%' + searchValue + '%');
            sql_value.push('%' + searchValue + '%');
        };

        if (zhuisuID !== "" && zhuisuID !== undefined && zhuisuID !== null) {
            if (zhuisuID.length == 6) {
                sql_where = sql_where + ' and  zhuisuID1 = ? ';
            } else {
                sql_where = sql_where + ' and  zhuisuID = ? ';
            };
            sql_value.push(zhuisuID);
        };

        if (kehuid !== "" && kehuid !== undefined && kehuid !== null) {
            sql_where = sql_where + ' and  kehuid = ? ';
            sql_value.push(kehuid);
        };



        await knex('reviewinfo')
            .leftJoin('userinfo', 'reviewinfo.kehuid', 'userinfo.id')
            .select('reviewinfo.*', 'userinfo.jingyingzhe', 'userinfo.xukezheng', 'userinfo.dizhi', 'userinfo.lianxifangshi', 'userinfo.wangzhi', 'userinfo.telephone')
            .orderBy('reviewinfo.id', 'desc')
            .limit(loadcount)
            .whereRaw(sql_where, sql_value)
            .then(function (res) {
                data = res;
            })
            .catch(function (e) {
                data = '';
                console.error(e);
            })

        // 防御：如果 LEFT JOIN 结果为 null（kehuid 指向已删除的人员），
        // 用默认公司信息（userinfo id=55）补全
        if (data && data.length > 0) {
            const hasNull = data.some(r => !r.jingyingzhe);
            if (hasNull) {
                try {
                    const defaultCompany = await knex('userinfo').where('id', '55').first();
                    if (defaultCompany) {
                        data = data.map(r => {
                            if (!r.jingyingzhe) {
                                r.jingyingzhe = defaultCompany.jingyingzhe;
                                r.xukezheng = defaultCompany.xukezheng;
                                r.dizhi = defaultCompany.dizhi;
                                r.lianxifangshi = defaultCompany.lianxifangshi;
                                r.wangzhi = defaultCompany.wangzhi;
                                r.telephone = defaultCompany.telephone;
                            }
                            return r;
                        });
                    }
                } catch (_) { /* 静默忽略 fallback 查询失败 */ }
            }
        }

        return ctx.response.body = data;
    },
    d_Qcode: async (ctx, nex) => { //删除记录
        const startTime = logRecord.formatDateWithMilliseconds();
        let zhuisuID = ctx.request.body;
        if (!zhuisuID) {
            ctx.response.body = 'NaN';
            return;
        }


        try {
            const deleteQuery = knex('reviewinfo').del().where('zhuisuID', '=', zhuisuID)
            const sqlString = deleteQuery.toString();
            await deleteQuery;

            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'reviewinfo',
                eventType: 'DELETE',
                functionName: 'd_Qcode',
                body: { zhuisuID: zhuisuID },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = "OK";
        } catch (error) {
            console.error(`d_Qcode接口执行错误：${error}`)
            ctx.response.body = "Fail";
        }
    },
    i_Qcode: async (ctx, next) => {  //新增记录
        const startTime = logRecord.formatDateWithMilliseconds();
        if (!ctx.request.body) {
            ctx.response.body = 'NaN';
            return;
        }
        let zhuisuID = formatdatetime.randStr(12);
        let imgid = '';
        if (ctx.request.body.imgid == undefined || ctx.request.body.imgid == null || ctx.request.body.imgid == '') {
            imgid = formatdatetime.randStr(12);
        } else {
            imgid = ctx.request.body.imgid;
        };

        let chanpinid = ctx.request.body.chanpinid;
        if (chanpinid == null || chanpinid == undefined || chanpinid == '') {
            chanpinid = zhuisuID;
        };
        let mydate = formatdatetime.formatDateTime(new Date(), '-', ':');
        let Qcode = {

            kehuid: ctx.request.body.kehuid,
            chanpinid: chanpinid,
            zhuisuID: zhuisuID,
            imgid: imgid,
            pinzhongmingcheng: ctx.request.body.pinzhongmingcheng,
            zuowu: ctx.request.body.zuowu,

            zhongzileibie: ctx.request.body.zhongzileibie,
            zaipeitezheng: ctx.request.body.zaipeitezheng,
            zaipeiyaodian: ctx.request.body.zaipeiyaodian,

            zhixingbiaozhun: ctx.request.body.zhixingbiaozhun,
            jiagongpici: ctx.request.body.jiagongpici,
            chundu: ctx.request.body.chundu,
            jingdu: ctx.request.body.jingdu,
            fayalv: ctx.request.body.fayalv,
            shuifen: ctx.request.body.shuifen,

            jingxiaoshang: ctx.request.body.jingxiaoshang,
            jingxiaoshangdianhua: ctx.request.body.jingxiaoshangdianhua,

            wuliugongsi: ctx.request.body.wuliugongsi,
            fahuoriqi: ctx.request.body.fahuoriqi,
            fengxiantishi: ctx.request.body.fengxiantishi,

            zhuisu: ctx.request.body.zhuisu,
            beizhu: ctx.request.body.beizhu,
            createtime: mydate,
            updatetime: mydate,
        };
        try {
            const insertQuery = knex('reviewinfo').returning('id').insert(Qcode);
            const sqlString = insertQuery.toString();
            const result = await insertQuery;

            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'reviewinfo',
                eventType: 'INSERT',
                functionName: 'i_Qcode',
                body: { id: result[0], ...Qcode },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = { id: result, zhuisuID: zhuisuID };
        } catch (error) {
            console.error(`i_Qcode接口执行错误：${error}`)
            ctx.response.body = '';
        }
    },
    u_Qcode: async (ctx, next) => {
        const startTime = logRecord.formatDateWithMilliseconds();
        let id = ctx.request.body.id;
        if (!id) {
            ctx.response.body = 'NaN';
            return;
        };
        let mydate = formatdatetime.formatDate(new Date(), '-');
        let Qcode = {
            chanpinid: ctx.request.body.chanpinid,
            pinzhongmingcheng: ctx.request.body.pinzhongmingcheng,
            zuowu: ctx.request.body.zuowu,

            zhongzileibie: ctx.request.body.zhongzileibie,
            zaipeitezheng: ctx.request.body.zaipeitezheng,
            zaipeiyaodian: ctx.request.body.zaipeiyaodian,

            zhixingbiaozhun: ctx.request.body.zhixingbiaozhun,
            jiagongpici: ctx.request.body.jiagongpici,
            chundu: ctx.request.body.chundu,
            jingdu: ctx.request.body.jingdu,
            fayalv: ctx.request.body.fayalv,
            shuifen: ctx.request.body.shuifen,

            jingxiaoshang: ctx.request.body.jingxiaoshang,
            jingxiaoshangdianhua: ctx.request.body.jingxiaoshangdianhua,

            wuliugongsi: ctx.request.body.wuliugongsi,
            fahuoriqi: ctx.request.body.fahuoriqi,
            fengxiantishi: ctx.request.body.fengxiantishi,

            zhuisu: ctx.request.body.zhuisu,
            beizhu: ctx.request.body.beizhu,
            updatetime: mydate,
        };

        try {
            const updatetQuery = knex('reviewinfo').update(Qcode).where('id', '=', id);
            const sqlString = updatetQuery.toString();
            await updatetQuery;


            // 记录日志
            await logRecord.insertLogRecord({
                tableName: 'reviewinfo',
                eventType: 'UPDATE',
                functionName: 'u_Qcode',
                body: { id, ...Qcode },
                SQL: sqlString,
                startTime,
                endTime: logRecord.formatDateWithMilliseconds(),
            });
            ctx.response.body = "OK";
        } catch (error) {
            console.error(`u_Qcode接口执行错误：${error}`)
            ctx.response.body = 'Fail';
        }

    },
};