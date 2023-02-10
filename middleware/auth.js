'use strict';
const ultis = require('../helpers/ultis');
const config = require('../config');
const fs = require('fs');
const acl = require('./acl');

module.exports = (req, res, next) => {
  try {
    const token = req.header('uuid');
    if (token === undefined || token === '') {
      return res.status(401).json(ultis.errorResponse("AUTH_UUID_IS_REQUIRED"));
    }

    //load user data
    let userData = ultis.loadUserDataFromJsonFile(config.dataFile ,fs);
    if (userData.length === 0) {
      return res.status(500).json({ error_code: "AUTH_ERROR_EMPTY_DATABASE", success: false });
    }

    let found = false;
    const currentTime = Date.now();
    let lastGeneratedToken = '';
    let loggedUserData = {};

    const newUserData = userData.map((userItem, index, array) => {
      if (userItem.uuid === token) {
        found = true;
        lastGeneratedToken = userItem.uuid_generated_time;
        //now we assume timezone set to UTC-0 in server already, any converting timezone should be done later or at client side
        userItem.uuid = ultis.generateUuid(userItem.email + currentTime);
        userItem.uuid_generated_time = currentTime;

        loggedUserData = userItem;
      }
      return userItem;
    });

    if (!found) {
      return res.status(401).json(ultis.errorResponse("AUTH_ERROR_UUID_NOT_FOUND"));
    }

    //check expire
    if ( (currentTime - lastGeneratedToken) / 1000 >  config.tokenExpiredInSeconds) {
      return res.status(401).json(ultis.errorResponse("AUTH_ERROR_UUID_EXPIRED"));
    }

    //write all data to file
    fs.writeFile(config.dataFile, JSON.stringify(newUserData), function (err) {
      if (err) {
        return res.status(500).json(ultis.errorResponse("AUTH_ERROR_PROBLEM_WRITING_DATABASE"));
      } else {
        //new uuid must send back to header, for every request need authorization
        res.header('uuid', loggedUserData.uuid);
        //set logged user acl to body for next middleware
        req.user = loggedUserData;
        next();
      }
    });
  } catch {
      return res.status(401).json(ultis.errorResponse("AUTH_INVALID_REQUEST"));
  }
};