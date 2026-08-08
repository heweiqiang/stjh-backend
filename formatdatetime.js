

const formatNumber = n => {
    n = n.toString()
     return n[1] ? n : '0' + n
}

const formatDateTime = (date,space_date,space_time) => { //日期时间格式化
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(formatNumber).join(space_date) + ' ' 
        + [hour, minute, second].map(formatNumber).join(space_time);
      
}

const formatTime = (date,space_time) => { //时间格式化
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [hour, minute, second].map(formatNumber).join(space_time);
          
}

const formatDate = (date,space_date) => { //日期格式化
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    return [year, month, day].map(formatNumber).join(space_date);
      
}      

const randStr=randlong =>{
    let len = randlong || 16;
    var $chars = '0123456789';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    var maxPos = $chars.length;
    var pwd = '';
    for (let i = 0; i < len; i++) {
      pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
}

const randNumber = (n) =>{
    let len = n || 16;
    var $chars = '0123456789';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
    var maxPos = $chars.length;
    var pwd = '';
    for (let i = 0; i < len; i++) {
      pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return pwd;
  }
 module.exports = { formatDateTime, formatTime, formatDate, randStr ,randNumber}
