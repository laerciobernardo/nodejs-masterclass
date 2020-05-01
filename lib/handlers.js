/*
 * Request handlers
 *
 */

//Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');
//Define the handlers
let handlers = {};

handlers.welcome = function(data, callback){
   return callback(200, {
      'Welcome': 'Welcome to the Pizza form Brazil, check our API documentation and enjoy!',
      '/users':{
         'Description': 'Manage users on the API',
         'AcceptedMethods': ['get','post','put','delete'],
         'get' : {
            'needAuth':true,
            'requiredParams':['email'],
            'paramsDescriptor': {
               'email': {
                  type: 'string',
                  required: true,
                  constraints:{
                     isEmail: true
                  }
               },
            }
         },
         'post': {
            'needAuth':false,
            'requiredParams': ['name', 'email', 'password', 'address'],
            'paramsDescriptor':{
               'name': {
                  type: 'string',
                  required: true,
                  constraints:{
                     minLength: 3
                  }
               },
               'email': {
                  type: 'string',
                  required: true,
                  constraints:{
                     isEmail: true
                  }
               },
               'password': {
                  type: 'string',
                  required: true,
                  constraints:{
                     minLength: 4
                  } 
               }
            }
         }
         
      },
      '/login' : {
         'Description': 'Authenticate on the API',
         'AcceptedMethods': ['post'],
         'post': {
            'requiredParams': ['email', 'password'],
            'paramsDescriptor':{
               'email': {
                  type: 'string',
                  required: true,
                  constraints:{
                     isEmail: true
                  }
               },
               'password': {
                  type: 'string',
                  required: true,
                  constraints:{
                     length: 8
                  } 
               }
            }
         }
         
      }
   });
}

//Users
handlers.users = function (data, callback) {
   const acceptableMethods = ['get', 'post', 'put', 'delete'];
   if (acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._users[data.method](data, callback);
};

//Container for the users submethods
handlers._users = {};

//Users - post
//Required data: name, email, adress, password
//Optional data: none
handlers._users.post = function (data, callback) {
   //Check if all required fields are filled out
   let name = typeof data.payload.name === 'string' && data.payload.name.trim().length > 3 ? data.payload.name : false;
   let email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email) ? data.payload.email : false;
   let address = typeof data.payload.address === 'string' && data.payload.address.trim().length > 0 ? data.payload.address : false;
   let password = typeof data.payload.password === 'string' && data.payload.password.trim().length >= 4 ? data.payload.password : false;

   if (!name || !email || !address || !password) return callback(400, {
      'Error': 'Missing or invalid required fields.'
   });

   _data.read('users', email, function (err, data) {
      //User already exists
      if (!err) return callback(400, {
         'Error': 'A user with that email already exists.',
         err
      });

      //Hash the password
      const hashedPassword = helpers.hash(password);

      if (!hashedPassword) return callback(500, {
         'Error': 'Could not hash the user\'s password'
      });

      //Create a user
      const userObject = {
         'name': name,
         'email': email,
         'hashedPassword': hashedPassword,
         'address': address
      };

      //Store the userObject
      _data.create('users', email, userObject, function (err) {
         if (err) {
            console.log(err);
            return callback(500, {
               'error': 'could not create the new user'
            });
         }

         callback(200);
      });
   })

};

//users - get
//required data: email
//optional data: none
handlers._users.get = function (data, callback) {
   //check that the email number is valid
   let email = typeof data.queryStringObject.email === 'string' && data.queryStringObject.email.trim().length === 10 ? data.queryStringObject.email : false;
   if (!email) return callback(400, {
      'error': 'Missing or invalid required field'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      //lookup the user
      _data.read('users', email, function (err, data) {
         if (err) return callback(404);

         //remove the hashed password from the user object before returnint it to the requester
         delete data.hashedPassword;
         callback(200, data);
      });
   });
};

//users - put
//required data: email
//optional data: name, password (at least one must be specified)
handlers._users.put = function (data, callback) {
   //check that the email number is valid
   let email = typeof data.queryStringObject.email === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email : false;

   //Check the optional fields
   let name = typeof data.payload.name === 'string' && data.payload.name.trim().length > 3 ? data.payload.name : false;
   let address = typeof data.payload.address === 'string' && data.payload.address.trim().length > 0 ? data.payload.address : false;
   let password = typeof data.payload.password === 'string' && data.payload.password.trim().length > 4 ? data.payload.password : false;

   //Error if the phone is invalid
   if (!email) return callback(400, {
      'Error': 'Missing or invalid required field'
   });

   if (!name && !address && !password) return callback(400, {
      'Error': 'Missing fields to update'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      //Lookup the user
      _data.read('users', email, function (err, userData) {
         if (err || !userData) return callback(400, {
            'Error': 'The specified user does not exist'
         });

         //Update the fields necessary
         if (name) userData.name = name;
         if (address) userData.address = address;
         if (password) userData.hashedPassword = helpers.hash(password);

         //Store the new updates
         _data.update('users', email, userData, function (err) {
            if (err) {
               console.log(err);
               return callback(500, {
                  'Error': 'Could not update the user'
               });
            }
            callback(200);
         });
      });
   });
};

//Users - delete
//Required fields: phone
//@TODO Cleanup (delete) any other files associated with this user
handlers._users.delete = function (data, callback) {
   //Check the optional fields
   let phone = typeof data.queryStringObject.phone === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone : false;

   //Error if the phone is invalid
   if (!phone) return callback(400, {
      'Error': 'Missing required field'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, phone, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      //lookup the user
      _data.read('users', phone, function (err, data) {
         if (err) return callback(404, {
            'Error': 'Could not find the specified user.'
         });



         _data.delete('users', phone, function (err) {
            if (err) return callback(500, {
               'Error': 'Could not delete the specified user'
            });
            //Delete all checks associated to this user;

            const userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : [];
            const checksToDelete = userChecks.length;
            if (checksToDelete === 0) {
               return callback(200);
            }
            let checksDeleted = 0;
            let deletionErrors = false;

            // Loop through the checks
            userChecks.forEach(function (checkID) {
               //Delete the check
               _data.delete('checks', checkID, function (err) {
                  if (err) deletionErrors = true;
                  checksDeleted++;
                  if (checksDeleted == checksToDelete) {
                     if (!deletionErrors) return callback(200);

                     return callback(500, {
                        'Error': 'Errors encountered while attempting to delete all of the user\'s checks. All checks may not have been deleted from the system successfully'
                     });
                  }
               });
            });
         });
      });
   });
};

//Tokens
handlers.tokens = function (data, callback) {
   const acceptableMethods = ['get', 'post', 'put', 'delete'];
   if (acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._tokens[data.method](data, callback);
};

//Container for all tokens method
handlers._tokens = {};

//Tokens - post
//Requred data: phone, password
//Optional data: none
handlers._tokens.post = function (data, callback) {
   //Check required fields
   let email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email) ? data.payload.email : false;
   let password = (typeof data.payload.password === 'string') && data.payload.password.trim().length > 0 ? data.payload.password : false;

   if (!email || !password) return callback(400, {
      'Error': 'Missing required field(s)'
   });

   //Lookup the user who matches that email
   _data.read('users', email, function (err, userData) {
      if (err || !userData) return callback(400, {
         'Error': 'Could not specified the user'
      });
      //Hash the sent password and compare it to the password stored in the user object
      const hashedPassword = helpers.hash(password);

      if (!hashedPassword) return callback(500, {
         'Error': 'Could not hash the user\'s password'
      });

      if (hashedPassword !== userData.hashedPassword) return callback(400, {
         'Error': 'The password don\'t match the specified user\'s stored password'
      });

      //If valid create the new token with a random name. Set expiration date 1 hour in the future
      const tokenId = helpers.createRandomString(20);
      const expires = Date.now() + 1000 * 60 * 60;

      const tokenObject = {
         'email': email,
         'id': tokenId,
         'expires': expires
      };

      //Store the token
      _data.create('tokens', tokenId, tokenObject, function (err) {
         if (err) return callback(500, {
            'Error': 'Could not create the token'
         });

         callback(200, tokenObject);
      });
   });
};
//Tokens - get
//Required data: id
//Optional data: none
handlers._tokens.get = function (data, callback) {
   //check that the id is valid
   const id = (typeof data.queryStringObject.id === 'string') && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false;
   if (!id) return callback(400, {
      'error': 'Missing required field'
   });

   //lookup the token
   _data.read('tokens', id, function (err, tokenData) {
      if (err) return callback(404);

      callback(200, tokenData);
   });
};
//Tokens - put
//Required data: id, extend
//Optional data: none
handlers._tokens.put = function (data, callback) {
   //check that the id is valid
   const id = (typeof data.payload.id === 'string') && data.payload.id.trim().length === 20 ? data.payload.id : false;
   const extend = (typeof data.payload.extend === 'boolean') && data.payload.extend === true ? true : false;

   if (!id || !extend) return callback(400, {
      'error': 'Missing required field'
   });

   //lookup the token
   _data.read('tokens', id, function (err, tokenData) {
      if (err) return callback(404);

      //Check to make sure the token is already expired
      if (tokenData.expires < Date.now()) return callback(400, {
         'Error': 'The token already expired, and cannot be extended'
      });

      //Set the expiration an hour from now
      tokenData.expires = Date.now() + 1000 * 60 * 60;

      //Store the new updates
      _data.update('tokens', id, tokenData, function (err) {
         if (err) return callback(500, {
            'Error': 'Could not update the token\'s expiration'
         });
         callback(200);
      });
   });

};
//Tokens - delete
//Required fields: id
//@TODO Cleanup (delete) any other files associated with this user
handlers._tokens.delete = function (data, callback) {
   //Check the requred fields
   const id = (typeof data.queryStringObject.id === 'string') && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false;

   //Error if the id is invalid
   if (!id) return callback(400, {
      'Error': 'Missing required field'
   });
   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, phone, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      //lookup the user
      _data.read('tokens', id, function (err, data) {
         if (err) return callback(404, {
            'Error': 'Could not find the specified token.'
         });

         _data.delete('tokens', id, function (err) {
            if (err) return callback(500, {
               'Error': 'Could not delete the specified token'
            });
            callback(200);
         });
      });
   });
};

//verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, email, callback) {
   //Lookup the token
   _data.read('tokens', id, function (err, tokenData) {
      if (err) return callback(false);
      if (email !== tokenData.email || tokenData.expires < Date.now()) return callback(false);

      callback(true);
   });
};
//Not found handler
handlers.notFound = function (data, callback) {
   callback(404);
};

//Ping handler
handlers.ping = function (data, callback) {
   callback(200);
};

handlers.hello = function (data, callback) {
   callback(200, {
      message: 'This hello route is working very well!'
   });
};

module.exports = handlers;