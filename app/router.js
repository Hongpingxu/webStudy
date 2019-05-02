'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/user/login', controller.user.login);
  router.get('/user/finduser/:id', controller.user.info);//查询
  router.post('/user/register', controller.user.useradd)
  router.post('/user/checkuser', controller.user.finduser)
  router.post('/user/submitrecord', controller.user.submitrecord)
  router.post('/user/getlist', controller.user.getlist)
  router.post('/user/addicon', controller.user.addicon)
  router.post('/user/geticon', controller.user.geticon)
  router.post('/user/updateItem', controller.user.updateItem)
  router.post('/user/getEchartData', controller.user.getEchartData)
};
