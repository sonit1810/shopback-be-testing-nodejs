'use strict';
const ultis = require('../helpers/ultis');

module.exports = {
  USER_ROLES: {
    ADMIN: 'admin role',
    USER: 'user role'
  },

  ADMIN_ACL : {
  },
  USER_ACL: {
    USER_SEARCH: 'USER_SEARCH',
    USER_EDIT: 'USER_EDIT',
    OTHER_PERM: 'OTHER_PERM',
  },

  hasPerm: function (role = '') {
    return function (req, res, next) {
      //wrong coding, passed empty role
      if (role.length === 0) {
        return res.status(500).json(ultis.errorResponse("AUTH_ERROR_MISSING_PERMISSION_PARAM"));
      }

      //admin can access all
      if (req.user.role !== 'ADMIN') {
        //user does not have role
        if (req.user.acl.length === 0 || !req.user.acl.includes(role)) {
          return res.status(401).json(ultis.errorResponse("AUTH_ERROR_DOES_NOT_HAVE_PERMISSION_TO_ACCESS"));
        }
      }

      //ok
      next();
    }
  }

};