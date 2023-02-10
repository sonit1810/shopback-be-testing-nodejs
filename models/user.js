'use strict';

module.exports = {
  User: function (name, email, password, userRole)
  {
    const user = {};

    //define fields of user model
    user.name = name;
    user.email = email;
    user.password = password;
    user.role = userRole;
    user.acl = [];
    user.uuid = '';
    user.uuid_generated_time = ''; //last time uuid generated, we need this to check expire
    user.created = '';
    user.updated = '';
    user.last_login = '';//last login, know last time logged in
    user.device_registered = '';
    user.devive_last_logged = '';
    user.language = '';

    return user;
  },
};