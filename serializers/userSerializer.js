'use strict';

module.exports = {
  responseForDevice: function (device, userModel) {
    switch(device) {
      case 'mobile':
        return {
          email: userModel.email,
          name: userModel.name,
          created: userModel.created,
          updated: userModel.updated,
          last_login: userModel.last_login,
        };
        break;

      case 'web-browser':
        return {
          email: userModel.email,
          name: userModel.name,
          created: new Date(userModel.created).toISOString(),
          updated: userModel.updated !== '' ? new Date(userModel.updated).toISOString() : '',
          last_login: userModel.last_login !== '' ? new Date(userModel.last_login).toISOString() : ''
        };
        break;

      default:
        return {
          email: userModel.email,
          name: userModel.name,
          created: new Date(userModel.created).toISOString(),
          updated: userModel.updated !== '' ? new Date(userModel.updated).toISOString() : '',
          last_login: userModel.last_login !== '' ? new Date(userModel.last_login).toISOString() : ''
        };
    }
  },

}