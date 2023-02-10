'use strict';
var config = require('../config');
var crypto = require('crypto');

module.exports = {
  makeUserPasswordHash: function(passwordStr) {
    return crypto.createHash('sha256').update(passwordStr + config.secretKey).digest('base64');
  },
  generateUuid: function(uniqueString) {
    //enough to use, since uniqueString is unique
    //else we can use uuid package
    return crypto.createHash('sha256').update(uniqueString).digest('base64');
  },
  //i do not use node-js-db, i use custom code
  //maybe we can split func into business services, now i just put it in ultis
  loadUserDataFromJsonFile: function(dataFile, fs) {
    try {
      const fileData = fs.readFileSync(dataFile, 'utf8');
      try {
        return JSON.parse(fileData);
      } catch (err) {
        //if we can not parse exiting file, meaning wrong format, just return empty array so it will be overwrite
        return [];
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.log('File not found!');
        //if file not existing, just return empty array so we can write new one
        return [];
      } else {
        //something wrong with file system
        //we should catch error instead show it back to end user, now i leave it
        throw err;
      }
    }
  },
  errorResponse(errorCode) {
    return { error_code: errorCode, success: false };
  },
  successResponse(messageCode, data = {}) {
    return { message_code: messageCode, success: true, data: data };
  }
};