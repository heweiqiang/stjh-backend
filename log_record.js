

const config = require('./config');
const knex = require('knex')(config.db);
const table1 = 'Agricultural_SAAS_Managing_System.log_record';


const QUERY_TIMEOUT = 30000;

const DefaultField ={
  serverName:'腾讯云Linux服务器',
  softwareNo:'汕头金韩小程序',
  environment:'qcode_review',
  companyName:"汕头市金韩种业有限公司",
};

function createErrorResponse(message) {
  return { code: 0, error: message };
}

function createReturnResponse(returnCode = 1, returnData = [], returnMessage = '执行成功!') {
  return { code: returnCode, data: returnData, message: returnMessage };
}


function getUserInfo(token) {
  const userConfig = config?.security?.[token];
  
  if (!userConfig) {
    return {};
  }
  
  return {
    companyID: userConfig.companyID || "",
    companyName: userConfig.companyName || "",
    operatorID: userConfig.id || "",
    operator: userConfig.username || "",
  };
}


function getIdsString(body) {
  const ids = Array.isArray(body) 
    ? body.map(item => item?.id).filter(Boolean)
    : [body?.id].filter(Boolean);
  
  return ids.join(',');
}

function stringifyIfObject(value){
  return  value && typeof value === "object" ? JSON.stringify(value) : value;
}


async function insertLogRecord(options) {
  

  const { eventType, body} = options;

  if(eventType ==="SELECT"){
    return createErrorResponse('查询语句暂不添加备份');
  }
  // 1. 处理 recordId
  if (!options.recordId && ["INSERT","UPDATE"].includes(eventType) &&  body) {
    options.recordId = getIdsString(body);
  }

  //2. 获取用户信息
 // const userInfo = getUserInfo(token);

  //3. 数据格式化
  const formattedBody = {
    ...DefaultField,
   // ...userInfo,
    ...options,
    body:stringifyIfObject(body),  
  };

  const trx = await knex.transaction();
  
  try {
    // 5. 执行插入
    await trx(table1)
      .timeout(QUERY_TIMEOUT, { cancel: true })
      .insert(formattedBody);
    
    await trx.commit();

    // 6. 统一返回格式
    return createReturnResponse(1, "添加成功");
    
  } catch (error) {
    await trx.rollback();
    
    // 7. 增强错误处理
    console.error('日志记录插入失败:', {
      error: error.message,
      sql: trx(table1).insert(formattedBody).toSQL().toNative(),
    });

    return createErrorResponse(error.sqlMessage || '添加失败，请稍后重试');
  }
}


function formatDateWithMilliseconds(datetime) {
  const now = datetime || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

module.exports = {
  insertLogRecord:insertLogRecord, //新增备份记录
  formatDateWithMilliseconds:formatDateWithMilliseconds,
};