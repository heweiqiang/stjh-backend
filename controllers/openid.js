const config = require('../config');
const knex = require('knex')(config.db);
const request =require('request');

function getopenid(code) {
  let url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.appId}&secret=${config.appSecret}&js_code=${code}&grant_type=authorization_code`;
  //console.log(url);
  return new Promise((resolve, reject) => {
    request(url, function (err, res, body) {
      if (err){
        return reject(err);
      }
      if (res.statusCode!= 200){
        return reject(`back statusCode:${res.statuscode}`);
      }
      return resolve(body);
      
    }); // end request
  })  //end promise
}

module.exports={ 
  openid: async (ctx, next) => { //获得openid信息
    let code =ctx.request.query.code;
    let res_openid = await getopenid(code);
    res_openid = JSON.parse(res_openid);
    if(res_openid.openid){
      ctx.response.body =res_openid.openid
    } else{
      ctx.response.body ='';   
    }
  } // end openid

} //end module
