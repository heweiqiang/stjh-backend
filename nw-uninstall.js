let Service = require('node-windows').Service;

    let svc = new Service({
      name: 'wx_gzwxl',    //服务名称
      description: '广州伟兴利二维码追溯系统的小程序启动项', //描述
      script: 'E:/mysqlSystem/gzwxl/gzwxl.js' //nodejs项目要启动的文件路径
    });
  svc.on('uninstall',function(){
      console.log('Uninstall complete.');
      console.log('The service exists: ',svc.exists);
    });

  svc.uninstall();