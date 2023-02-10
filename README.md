# Install libraries
We can use npm or yarn. I uses npm to demonstrate 
 - npm install
 
# Config files
- main config in config.js
- ACL config in middleware/acl.js. We have 2 roles ADMIN and USER.
ADMIN role can access any function
USER role can access function if it has role defined in USER_ACL

###### USER_ACL: {
    USER_SEARCH: 'USER_SEARCH',
    USER_EDIT: 'USER_EDIT',
    OTHER_PERM: 'OTHER_PERM',
  }
######

# Run application
After all libraries installed, run app by this command
 - npm run start

# APIs
All parameters posted as application/json Content-Type
- Register User:
  - POST: [host]/user/register
  - body params : {"name": "Son", "email": "truongson1810@gmail.com", "password": "12345"}
  - header params : 
    + X-Device
    + X-Language
    
- Login:
  - POST: [host]/user/login
  - header params:
    + uuid
    
- Logout:
  - POST: [host]/user/logout?email=truongson1810@gmail.com
  - header params:
    + uuid

- Search user:
  - GET: [host]/user/search?name=NAME&email=EMAIL&last_login_from=FROM&last_login_to=TO
  - header params:
    + uuid
  - Notes 
    + search params are optional, but at least one param must given.
    + name & email compared not case sensitive
    + last_login_to and last_login_from are datetime ISOString (example : 2019-09-12T05:04:04.126Z)
    + if both last_login_to and last_login_from given, rule is
        + last_login_from <= last_login <= last_login_to
    + else if only last_login_from given, rule is
        + last_login_from <= last_login
    + else if only last_login_to given, rule is
        + last_login_to >= last_login 
 
# Notes:
- app auto create user_data.json file
- if you want promo one user to ADMIN role to testing, firstly register it, then please open user_data.json and change role to ADMIN and save it. Then that user will have ADMIN role for testing ACL.
- to set Authorization required & ACL permission, check in routes/user.js
Example :
- app.route('/user/search')
    + .all(auth)
    + .all(acl.hasRole(acl.USER_ACL.USER_SEARCH))
    + .get(userController.search);

auth : this is authorization function (check if logged, uuid is valid?)
acl.hasRole(ROLE_TEXT) : this check permission to access function. See middleware/acl.js, USER_ACL for permissions of user (currently we assume ADMIN has all permission)
      
      
