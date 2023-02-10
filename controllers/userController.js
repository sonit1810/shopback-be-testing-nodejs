'use strict';
const model = require('../models/user');
const ultis = require('../helpers/ultis');
const config = require('../config');
const fs = require('fs');
const userSerializer = require('../serializers/userSerializer');
const acl = require('../middleware/acl');

module.exports = {

  register: function (req, res) {
    //validate
    if (req.body.name === undefined || req.body.name === '') {
      return res.status(422).json(ultis.errorResponse("USER_REGISTER_ERROR_MISSING_FIELD_NAME"));
    }
    if (req.body.email === undefined || req.body.email === '') {
      return res.status(422).json(ultis.errorResponse("USER_REGISTER_ERROR_MISSING_FIELD_EMAIL"));
    }
    if (req.body.password === undefined || req.body.password === '') {
      return res.status(422).json(ultis.errorResponse("USER_REGISTER_ERROR_MISSING_FIELD_PASSWORD"));
    }
    //check password strength? i do simple check
    if (req.body.password.length < 5) {
      res.status(422);
      return res.json(ultis.errorResponse("USER_REGISTER_ERROR_PASSWORD_IS_WEAK"));
    }

    //HOW ABOUT locking file to read & write ? Because other api calling can make with same user & pass before we write to file
    //if we use database, it supports transaction, easy to do
    //but how about with json file ? we can implement locking method by create lock file before process and remove it after finish
    //seems very stupid

    let userData = ultis.loadUserDataFromJsonFile(config.dataFile ,fs);
    if (userData.length !== 0) {
      //checking duplicate email?
      const existing = userData.filter((userItem, index, array) => {
        return userItem.email === req.body.email;
      });
      if (existing.length > 0) {
        return res.status(409).json(ultis.errorResponse("USER_REGISTER_ERROR_EMAIL_ALREADY_EXIST"));
      }
    }

    //append to json data
    let user = new model.User(req.body.name,
        req.body.email,
        ultis.makeUserPasswordHash(req.body.password));
    user.created = Date.now();
    user.device_registered = req.header('X-Device');
    user.language = req.header('X-Language') === undefined ? 'vi' : req.header('X-Language');
    //role, default is user
    //we can create first admin user, then admin logged, then create user with ROLE posted, we need another function for this
    //now just set default role is USER, if we need upgrade to ADMIN role, open data base and change role
    user.role = 'USER';
    user.acl = Object.keys(acl.USER_ACL);
    userData.push(user);

    //write all data to file
    fs.writeFile(config.dataFile, JSON.stringify(userData), function (err) {
      if (err) {
        return res.status(500).json(ultis.errorResponse("USER_REGISTER_ERROR_PROBLEM_WRITING_DATABASE"));
      } else {
        return res.json(ultis.successResponse("USER_REGISTER_SUCCESS"));
      }
    });
  },

  login: function (req, res) {
    //validate
    if (req.body.email === undefined || req.body.email === '') {
      return res.status(422).json(ultis.errorResponse("USER_LOGIN_ERROR_MISSING_FIELD_EMAIL"));
    }
    if (req.body.password === undefined || req.body.password === '') {
      return res.status(422).json(ultis.errorResponse("USER_LOGIN_ERROR_MISSING_FIELD_PASSWORD"));
    }

    //load user data
    let userData = ultis.loadUserDataFromJsonFile(config.dataFile ,fs);
    if (userData.length === 0) {
      return res.status(500).json(ultis.errorResponse("USER_LOGIN_ERROR_EMPTY_DATABASE"));
    }

    let found = false;
    let loggedUserData = {};
    const newUserData = userData.map((userItem, index, array) => {
      if (userItem.email === req.body.email && userItem.password === ultis.makeUserPasswordHash(req.body.password)) {
        found = true;
        //now we assume timezone set to UTC-0 in server already, any converting timezone should be done later or at client side
        const currentTime = Date.now();
        userItem.uuid = ultis.generateUuid(userItem.email + currentTime);
        userItem.uuid_generated_time = currentTime;
        userItem.last_login = currentTime;
        userItem.devive_last_logged = req.header('X-Device');

        loggedUserData = userItem;
      }
      return userItem;
    });

    if (!found) {
      return res.json(ultis.errorResponse("USER_LOGIN_ERROR_WRONG_EMAIL_OR_PASSWORD"));
    }

    //write all data to file
    fs.writeFile(config.dataFile, JSON.stringify(newUserData), function (err) {
      if (err) {
        return res.status(500).json(ultis.errorResponse("USER_LOGIN_ERROR_PROBLEM_WRITING_DATABASE"));
      } else {
        res.header('uuid', loggedUserData.uuid);
        return res.json(ultis.successResponse("USER_LOGIN_SUCCESS",
            userSerializer.responseForDevice(req.header('X-Device'), loggedUserData)));
      }
    });
  },

  logout: function (req, res) {
    //validate
    if (req.query.email === undefined || req.query.email === '') {
      return res.json(ultis.successResponse("USER_LOGOUT_SUCCESS"));
    }

    //load user data
    let userData = ultis.loadUserDataFromJsonFile(config.dataFile ,fs);
    if (userData.length === 0) {
      return res.json(ultis.successResponse("USER_LOGOUT_SUCCESS"));
    }

    let found = false;
    const newUserData = userData.map((userItem, index, array) => {
      if (userItem.email === req.query.email) {
        found = true;
        userItem.uuid = '';
        userItem.uuid_generated_time = '';
      }
      return userItem;
    });

    if (found) {
      return res.json(ultis.successResponse("USER_LOGOUT_SUCCESS"));
    }

    //write all data to file
    fs.writeFile(config.dataFile, JSON.stringify(newUserData), function (err) {
      if (err) {
        return res.status(500).json(ultis.errorResponse("USER_LOGOUT_ERROR_PROBLEM_WRITING_DATABASE"));
      } else {
        return res.json(ultis.successResponse("USER_LOGOUT_SUCCESS"));
      }
    });
  },

  search: function (req, res) {
    const name = req.query.name;
    const email = req.query.email;
    const lastLoginFrom = req.query.last_login_from;
    const lastLoginTo = req.query.last_login_to;
    let page = req.query.page !== undefined ? parseInt(req.query.page) : 1 ;
    const pageSize = req.query.page_size !== undefined ? parseInt(req.query.page_size) : config.defaultPageSize;

    //load user data
    let userData = ultis.loadUserDataFromJsonFile(config.dataFile ,fs);
    if (userData.length === 0) {
      return res.json(ultis.successResponse("NO_RESULT", { total_page: 0, items: []}));
    }

    let matchedData = [];
    for (let i = 0 ; i < userData.length ; i ++) {
      let matchRule = (name !== undefined && name !== '' && userData[i].name.toLowerCase().indexOf(name.toLowerCase()) !== -1)
          || (email !== undefined && email !== '' && userData[i].email.toLowerCase().indexOf(email.toLowerCase()) !== -1);

      //i dont validate format of datetime, FE should do or post correct format
      //example : 2019-09-12T05:04:04.126Z
      if (userData[i].last_login) {
        if (lastLoginFrom !== undefined && lastLoginFrom !== '' && lastLoginTo !== undefined && lastLoginTo !== '') {
          matchRule = matchRule ||
              ( (userData[i].last_login >= new Date(lastLoginFrom).getTime()) &&
                  (userData[i].last_login <= new Date(lastLoginTo).getTime()) )
        }
        else if (lastLoginFrom !== undefined && lastLoginFrom !== '') {
          matchRule = matchRule || userData[i].last_login >= new Date(lastLoginFrom).getTime();
        }
        else if (lastLoginTo !== undefined && lastLoginTo !== '') {
          matchRule = matchRule || userData[i].last_login <= new Date(lastLoginTo).getTime();
        }
      }

      if (matchRule) {
        matchedData.push(userSerializer.responseForDevice(req.header('X-Device'), userData[i]));
      }
    }
    if (matchedData.length === 0) {
      return res.json(ultis.successResponse("NO_RESULT", { total_page: 0, items: []}));
    }

    //pagination
    const totalRecords = matchedData.length;
    const totalPage = Math.ceil(totalRecords/pageSize);
    if (page > totalPage) {
      page = totalPage;
    }
    const offset = (page - 1) * pageSize;
    const segment = offset + pageSize ;
    const finalResult = matchedData.slice(offset, segment);

    return res.json(ultis.successResponse("HAS_DATA",
        { total_page: totalPage, page: page, page_size: pageSize, items: finalResult}));
  },

};