//import { arch } from 'os';

const config = require('../config');
const knex = require('knex')(config.db);
const formatdatetime = require('../formatdatetime');
const logRecord = require("../log_record");


module.exports={

  s_checkQcode: async (ctx, next) => { //查询记录 可根据客户编号，品种编号和试验编号的任意组合进行查询，如没有查询条件则返回所有的评价记录
    
    let data =null;
    let zhuisuID =ctx.request.query.zhuisuID;
    let chanpinid=ctx.request.query.chanpinid;
    let Qcode =ctx.request.query.Qcode;
    let self_openid=ctx.request.query.self_openid; 


    let sql_where ="id>?"
    sql_tj =[0];
  
    
    if (zhuisuID!== null && zhuisuID !== undefined && zhuisuID !==''){
        sql_where =sql_where+' and zhuisuID = ?';
        sql_tj.push(zhuisuID);
    };

    if (chanpinid!== null && chanpinid !== undefined && chanpinid !==''){
        sql_where =sql_where+' and chanpinid = ?';
        sql_tj.push(chanpinid);
    }

    if ( Qcode!== null &&  Qcode !== undefined &&  Qcode !==''){
        sql_where =sql_where+' and  Qcode = ?';
        sql_tj.push( Qcode);
    };

    if (self_openid!== null && self_openid !== undefined && self_openid !==''){
        sql_where =sql_where+' and self_openid = ?';
        sql_tj.push(self_openid);
    }

    await knex.select()
    .from('checkQcode')
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

 
 i_checkQcode: async (ctx,next) =>{  //新增记录
    const startTime = logRecord.formatDateWithMilliseconds();
    //待插入的数据值
    let self_openid =ctx.request.body.self_openid;
    if (!ctx.request.body){
        ctx.response.body ='NaN';
        return;
    } else if(self_openid =={} || self_openid == undefined ||self_openid =='' || self_openid ==null){
        self_openid='';
    }

    let mydate= formatdatetime.formatDateTime(new Date(),'-',':');
    let checkQcode= {
        zhuisuID:ctx.request.body.zhuisuID,
        chanpinid:ctx.request.body.chanpinid,
        pinzhongmingcheng:ctx.request.body.pinzhongmingcheng,
        zuowu:ctx.request.body.zuowu,

        Qcode:ctx.request.body.Qcode,
        longitude: ctx.request.body.longitude,
        latitude:ctx.request.body.latitude,
        location:ctx.request.body.location,
        beizhu:ctx.request.body.beizhu,
        createtime: mydate,  
    };


    try {
        const insertQuery =  knex('checkQcode').returning('id').insert(checkQcode);
        const sqlString = insertQuery.toString();
        const result = await insertQuery;

        // 记录日志
        await logRecord.insertLogRecord({
            tableName: 'checkQcode',
            eventType: 'INSERT',
            functionName: 'i_checkQcode',
            body: {id:result[0],...checkQcode},
            SQL: sqlString,
            startTime,
            endTime: logRecord.formatDateWithMilliseconds(),
        });
        ctx.response.body = result;
    } catch (error) {
        console.error(`i_checkQcode接口执行错误：${error}`)
        ctx.response.body = null;
    }
 },

 u_checkQcode: async (ctx,next) =>{  //修改追溯记录中获得的记录信息
    const startTime = logRecord.formatDateWithMilliseconds();
    //待插入的数据值
    if (!ctx.request.body){
        ctx.response.body ='NaN';
        return;
    }
    let checkQcode= {
        longitude: ctx.request.body.longitude,
        latitude:ctx.request.body.latitude,
        location:ctx.request.body.location,
    };

    try {
        const updatetQuery = knex('checkQcode').update(checkQcode).where('id','=',ctx.request.body.id);
        const sqlString = updatetQuery.toString();
        const result = await updatetQuery;
        
        // 记录日志
        await logRecord.insertLogRecord({
            tableName: 'checkQcode',
            eventType: 'UPDATE',
            functionName: 'u_checkQcode',
            body: ctx.request.body,
            SQL: sqlString,
            startTime,
            endTime: logRecord.formatDateWithMilliseconds(),
        });
        ctx.response.body = result;
    } catch (error) {
        console.error(`u_checkQcode接口执行错误：${error}`)
        ctx.response.body = null;
    }
 },

};