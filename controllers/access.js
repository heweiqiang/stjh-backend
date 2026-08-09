//import { arch } from 'os';

const config = require('../config');
const knex = require('knex')(config.db);
const formatdatetime = require('../formatdatetime');
const logRecord = require("../log_record");


module.exports={

  s_access: async (ctx, next) => { //查询记录 可根据客户编号，品种编号和试验编号的任意组合进行查询，如没有查询条件则返回所有的评价记录
    
    let data =null;
    let zhuisuID =ctx.request.query.zhuisuID;
    let self_openid=ctx.request.query.self_openid;
    let currentID =ctx.request.query.currentID;
    let loadcount =ctx.request.query.loadcount;
    
    if (loadcount==null || loadcount == undefined || loadcount == ''){
        loadcount =5;
    }

    let sql_where ="id<?"
    let sql_tj;
    if (currentID==null || currentID == undefined || currentID == ''){
        sql_tj =[99999999];
    } else {
        sql_tj =[currentID];
    }

    
    if (zhuisuID!== null && zhuisuID !== undefined && zhuisuID !==''){
        sql_where =sql_where+' and zhuisuID = ?';
        sql_tj.push(zhuisuID);
    };

    if (self_openid!== null && self_openid !== undefined && self_openid !==''){
        sql_where =sql_where+' and self_openid = ?';
        sql_tj.push(self_openid);
    }


    await knex.select()
    .from('access')
    .limit(loadcount)
    .whereRaw(sql_where,sql_tj)
    .orderBy('id','desc')
    .then(function (res) {
        data=res;
    })
    .catch(function(e) {
        data = null;
        console.error(e);
    });

   ctx.response.body = data;
 }, // end s_access

 
 i_access: async (ctx,next) =>{  //新增记录
    const startTime = logRecord.formatDateWithMilliseconds();
    //待插入的数据值
    if (!ctx.request.body){
        ctx.response.body ='NaN';
        return;
    }


    let mydate= formatdatetime.formatDate(new Date(),'-');
    let access= {
        zhuisuID:ctx.request.body.zhuisuID,
        pinzhongmingcheng:ctx.request.body.pinzhongmingcheng,
        zuowu:ctx.request.body.zuowu,
        shenqingyangpin:ctx.request.body.shenqingyangpin,
        shenqinggoumai:ctx.request.body.shenqinggoumai,
        self_openid: ctx.request.body.self_openid,
        lianxiren:ctx.request.body.lianxiren,
        shoujihaoma:ctx.request.body.shoujihaoma,
        shouhuodizhi:ctx.request.body.shouhuodizhi,
        dianzan:ctx.request.body.dianzan,
        pingjia:ctx.request.body.pingjia,
        createtime: mydate,
        updatetime: mydate,
    };

    try {
        const insertQuery = knex('access').returning('id').insert(access);
        const sqlString = insertQuery.toString();
        const result = await insertQuery;
        // 记录日志
        await logRecord.insertLogRecord({
            tableName: 'access',
            eventType: 'INSERT',
            functionName: 'i_access',
            body: {id:result[0],...access},
            SQL: sqlString,
            startTime,
            endTime: logRecord.formatDateWithMilliseconds(),
        });
        ctx.response.body = result;
    } catch (error) {
        console.error(`i_access接口执行错误：${error}`)
        ctx.response.body = null;
    }
 },


 u_access: async (ctx,next) =>{  //修改评价信息，试验本身的信息不允许修改
    const startTime = logRecord.formatDateWithMilliseconds();

    if (!ctx.request.body){
        ctx.response.body ='NaN';
        return;
    }
    let mydate= formatdatetime.formatDate(new Date(),'-');
    let access= {
        shenqingyangpin:ctx.request.body.shenqingyangpin,
        shenqinggoumai:ctx.request.body.shenqinggoumai,
        dianzan:ctx.request.body.dianzan,
        pingjia:ctx.request.body.pingjia,
        lianxiren:ctx.request.body.lianxiren,
        shoujihaoma:ctx.request.body.shoujihaoma,
        shouhuodizhi:ctx.request.body.shouhuodizhi,
        updatetime: mydate,  
    };
    try {
        const updatetQuery = knex('access').update(access).where('id', '=', ctx.request.body.id);
        const sqlString = updatetQuery.toString();
        const result = await updatetQuery;

        // 记录日志
        await logRecord.insertLogRecord({
            tableName: 'access',
            eventType: 'UPDATE',
            functionName: 'u_access',
            body: {id:ctx.request.body.id,...access},
            SQL: sqlString,
            startTime,
            endTime: logRecord.formatDateWithMilliseconds(),
        });
        ctx.response.body = result;
    } catch (error) {
        console.error(`u_access接口执行错误：${error}`)
        ctx.response.body = null;
    }
 },

};