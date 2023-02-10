'use strict';
const auth = require('../middleware/auth');
const acl = require('../middleware/acl');

module.exports = function(app) {

  const userController = require('../controllers/userController');

  app.route('/user/register')
      .post(userController.register);

  app.route('/user/login')
      .post(userController.login);

  app.route('/user/logout')
      .all(auth) //need check logged
      .post(userController.logout);

  app.route('/user/search')
      .all(auth) //need check logged
      .all(acl.hasPerm(acl.USER_ACL.USER_SEARCH))//need check permission access this func
      .get(userController.search);
};