const Router = require('koa-router');  //网址路由框架

const openid=require('../controllers/openid');      //登录验证

const userinfo =require('../controllers/userinfo');      //客户评价
const reviewinfo=require('../controllers/reviewinfo');      //追溯信息列表
const picture=require('../controllers/picture');      //追溯关图片信息列表

const access=require('../controllers/access');      //客户评价
const accessI=require('../controllers/accessImage');      //客户评价


const wxcode=require('../controllers/wxcode');      //二维码图片
const QcloudSms=require('../controllers/QcloudSms');      //验证注册
const qr =require('../controllers/outQcode');
const zuishu =require('../controllers/zuishu');      // H5扫码追溯查询

const router = new Router();  //建立路由对象


router.get('/openid.php',openid.openid); 


router.get('/userinfo_s.php',userinfo.s_userInfo); //客户信息查询
router.post('/userinfo_u.php',userinfo.u_userinfo); //客户信息修改
router.post('/userinfo_i.php',userinfo.i_userinfo); //客户信息新增
router.post('/loadlogo.php',userinfo.loadlogo); //客户信息上传logo


router.get('/reviewinfo_s.php',reviewinfo.s_Qcode); //追溯记录查询
router.post('/reviewinfo_u.php',reviewinfo.u_Qcode); //追溯记录修改
router.post('/reviewinfo_i.php',reviewinfo.i_Qcode); //追溯记录新增
router.post('/reviewinfo_d.php',reviewinfo.d_Qcode); //追溯记录删除

router.get('/picture_s.php',picture.s_picture); //追溯记录相关图片查询
router.post('/picture_i.php',picture.i_picture); //追溯记录相关图片新增
router.post('/picture_d.php',picture.d_picture); //追溯记录相关图片删除

//假二维码的生成和下载
router.post('/wx_code.php',wxcode.create_qr); //根据参数生成小程序二维码；
router.get('/wxcode_down.php', wxcode.download_qr);


router.get('/access_s.php',access.s_access);  //客户评价查询
router.post('/access_i.php',access.i_access); //客户评价新增
router.post('/access_u.php',access.u_access); //客户评价修改

router.get('/accessI_s.php',accessI.s_accessI); //客户评价相关图片查询
router.post('/accessI_i.php',accessI.i_accessI); //客户评价相关图片新增
router.post('/accessI_d.php',accessI.d_accessI); //客户评价相关图片删除


router.get('/sendvercode.php',QcloudSms.sendVercode); //客户评价相关图片查询
router.get('/Vercode_checkup.php',QcloudSms.Vercode_checkup); //客户评价相关图片新增

router.post('/qr_create.php',qr.create_qr); //根据参数生成外部链接二维码
router.get('/check_qr.php',qr.check_qr); //检验此次查询的外链二维码是否有效
router.get('/qcode_s.php',qr.outQcode_s); //检验此次查询的外链二维码是否有效

router.get('/zuishu.php',zuishu.s_zuishu); // H5扫码追溯查询


module.exports=router;
