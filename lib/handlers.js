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

//Users
handlers.users = function (data, callback) {
   const acceptableMethods = ['get', 'post', 'put', 'delete'];
   if (acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._users[data.method](data, callback);
};

//Container for the users submethods
handlers._users = {};

//Users - post
//Required data: firstName, lastName, phone, password, toAgreement
//Optional data: none
handlers._users.post = function (data, callback) {
   //Check if all required fields are filled out
   let firstName = typeof data.payload.firstName === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
   let lastName = typeof data.payload.lastName === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
   let phone = typeof data.payload.phone === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone : false;
   let password = typeof data.payload.password === 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;
   let tosAgreement = typeof data.payload.tosAgreement === 'boolean' && data.payload.tosAgreement === true ? true : false;

   if (!firstName || !lastName || !phone || !password || !tosAgreement) return callback(400, {
      'Error': 'Missing required fields.'
   });

   _data.read('users', phone, function (err, data) {
      //User already exists
      if (!err) return callback(400, {
         'Error': 'A user with that phone number already exists.',
         err
      });

      //Hash the password
      const hashedPassword = helpers.hash(password);

      if (!hashedPassword) return callback(500, {
         'Error': 'Could not hash the user\'s password'
      });

      //Create a user
      const userObject = {
         'firstName': firstName,
         'lastName': lastName,
         'phone': phone,
         'hashedPassword': hashedPassword,
         'tosAgreement': true
      };

      //Store the userObject
      _data.create('users', phone, userObject, function (err) {
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
//required data: phone
//optional data: none
handlers._users.get = function (data, callback) {
   //check that the phone number is valid
   let phone = typeof data.queryStringObject.phone === 'string' && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone : false;
   if (!phone) return callback(400, {
      'error': 'Missing required field'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, phone, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      //lookup the user
      _data.read('users', phone, function (err, data) {
         if (err) return callback(404);

         //remove the hashed password from the user object before returnint it to the requester
         delete data.hashedPassword;
         callback(200, data);
      });
   });
};

//users - put
//required data: phone
//optional data: firstname, lastname, password (at least one must be specified)
handlers._users.put = function (data, callback) {
   //check that the phone number is valid
   let phone = typeof data.payload.phone === 'string' && data.payload.phone.trim().length === 10 ? data.payload.phone : false;

   //Check the optional fields
   let firstName = typeof data.payload.firstName === 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName : false;
   let lastName = typeof data.payload.lastName === 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName : false;
   let password = typeof data.payload.password === 'string' && data.payload.password.trim().length > 0 ? data.payload.password : false;

   //Error if the phone is invalid
   if (!phone) return callback(400, {
      'Error': 'Missing required field'
   });

   if (!firstName && !lastName && !password) return callback(400, {
      'Error': 'Missing fields to update'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, phone, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      //Lookup the user
      _data.read('users', phone, function (err, userData) {
         if (err || !userData) return callback(400, {
            'Error': 'The specified user does not exist'
         });

         //Update the fields necessary
         if (firstName) userData.firstName = firstName;
         if (lastName) userData.lastName = lastName;
         if (password) userData.hashedPassword = helpers.hash(password);

         //Store the new updates
         _data.update('users', phone, userData, function (err) {
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
   let phone = (typeof data.payload.phone === 'string') && data.payload.phone.trim().length === 10 ? data.payload.phone : false;
   let password = (typeof data.payload.password === 'string') && data.payload.password.trim().length > 0 ? data.payload.password : false;

   if (!phone || !password) return callback(400, {
      'Error': 'Missing required field(s)'
   });

   //Lookup the user who matches that phone number
   _data.read('users', phone, function (err, userData) {
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
         'phone': phone,
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
//Checks
handlers.checks = function (data, callback) {
   const acceptableMethods = ['get', 'post', 'put', 'delete'];
   if (acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._checks[data.method](data, callback);
};

//Container for all tokens method
handlers._checks = {};

//Check - post
//Required data: protocol, url, method, successCodes, timeoutSeconds
//Optional data: none
handlers._checks.post = function (data, callback) {
   //Check if all required fields are filled out
   let protocol = (typeof data.payload.protocol === 'string') && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
   let url = (typeof data.payload.url === 'string') && data.payload.url.trim().length > 0  ? data.payload.url : false;
   let method = (typeof data.payload.method === 'string') && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
   let successCodes = (typeof data.payload.successCodes === 'object') && (data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0) ? data.payload.successCodes : false;
   let timeoutSeconds = (typeof data.payload.timeoutSeconds === 'number') && (data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5) ? data.payload.timeoutSeconds : false;

   if (!protocol || !url || !method || !successCodes || !timeoutSeconds) return callback(400, {
      'Error': 'Missing required fields or are invalid'
   });

   //get the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;

   //Lookup the user by reading the token
   _data.read('tokens', token, function (err, tokenData) {
      if (err) return callback(403);

      const userPhone = tokenData.phone;

      //Lookup the user data
      _data.read('users', userPhone, function (err, userData) {
         if (err) return callback(403);

         const userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : [];
         //Veify that the user has more than the number of max-checks-per-user
         if (userChecks.length > config.maxChecks) return callback(400, {
            'Error': 'The user already has the maximum number of checks (' + config.maxChecks + ')'
         })

         //Create a random id for the check
         const checkID = helpers.createRandomString(20);

         //Create the check object and include the user's phone
         const checkObject = {
            'id': checkID,
            'userPhone': userPhone,
            'protocol': protocol,
            'url': url,
            'method': method,
            'successCodes': successCodes,
            'timeoutSeconds': timeoutSeconds
         };

         //Save the object
         _data.create('checks', checkID, checkObject, function (err) {
            if (err) return callback(500, {
               'Error': 'Could not create the new check'
            });

            //Add the checkID to the user's object
            userData.checks = userChecks;
            userData.checks.push(checkID);

            //Save the new user data
            _data.update('users', userPhone, userData, function (err) {
               if (err) return callback(500, {
                  'Error': 'Could not update the user with the new check'
               });

               //Return the data about the new check
               callback(200, checkObject);
            });
         });
      });
   });
};

//Check - get
//Required data: id
//Optional data: none
handlers._checks.get = function (data, callback) {
   //check that the id is valid
   let id = typeof data.queryStringObject.id === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false;
   if (!id) return callback(400, {
      'error': 'Missing required field'
   });
   //Lookup the check
   _data.read('checks', id, function (err, checkData) {
      if (err || !checkData) return callback(404, {});
      //Check the token from the headers
      const token = typeof data.headers.token === 'string' ? data.headers.token : false;
      handlers._tokens.verifyToken(token, checkData.userPhone, function (isValid) {
         if (!isValid) return callback(403, {
            'Error': 'Missing or invalid token'
         });

         return callback(200, checkData);
      });
   });
};

//Check - put
//Required data: id
//Optional data: protocol, url, method, successCodes, timeoutSeconds (one must be sent)
handlers._checks.put = function (data, callback) {
   //check that the phone number is valid
   let id = typeof data.payload.id === 'string' && data.payload.id.trim().length === 20 ? data.payload.id : false;

   //Check the optional fields
   let protocol = typeof data.payload.protocol === 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
   let url = typeof data.payload.url === 'string' && data.payload.url.trim().length > 0 ? data.payload.url : false;
   let method = typeof data.payload.method === 'string' && ['post', 'get', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
   let successCodes = typeof data.payload.successCodes === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
   let timeoutSeconds = typeof data.payload.timeoutSeconds === 'number' && data.payload.timeoutSeconds % 1 === 0  && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

   if (!id || (!protocol && !url && !method && !successCodes && !timeoutSeconds)) return callback(400, {
      'Error': 'Missing required fields, are invalid or missing fields to update'
   });

   // Lookup the check
   _data.read('checks', id, function (err, checkData) {
      if (err || !checkData) return callback(400, {
         'Error': 'Check ID did not exist'
      });

      //Check the token from the headers
      const token = typeof data.headers.token === 'string' ? data.headers.token : false;
      handlers._tokens.verifyToken(token, checkData.userPhone, function (isValid) {
         if (!isValid) return callback(403, {
            'Error': 'Missing or invalid token'
         });

         // Update the check where necessary
         if (protocol) checkData.protocol = protocol;
         if (url) checkData.url = url;
         if (method) checkData.method = method;
         if (successCodes) checkData.successCodes = successCodes;
         if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;

         // Store the new updates
         _data.update('checks', id, checkData, function (err) {
            if (err) return callback(500, {
               'Error': 'Could not update the check'
            });

            return callback(200);
         });
      });
   });
};

//Check - delete
//Required fields: id
//Optional data: none
handlers._checks.delete = function (data, callback) {
   //Check the optional fields
   let id = typeof data.queryStringObject.id === 'string' && data.queryStringObject.id.trim().length === 20 ? data.queryStringObject.id : false;

   //Error if the id is invalid
   if (!id) return callback(400, {
      'Error': 'Missing required field'
   });

   //lookup the check
   _data.read('checks', id, function (err, checkData) {
      if (err) return callback(400, {
         'Error': 'the specified check ID does not exist.'
      });

      //Check the token from the headers
      const token = typeof data.headers.token === 'string' ? data.headers.token : false;
      handlers._tokens.verifyToken(token, checkData.userPhone, function (isValid) {
         if (!isValid) return callback(403, {
            'Error': 'Missing or invalid token'
         });

         //Delete the check data
         _data.delete('checks', id, function (err) {
            if (err) return callback(500, {
               'Error': 'Could not delete the specified user'
            });

            //lookup the user
            _data.read('users', checkData.userPhone, function (err, userData) {
               if (err) return callback(404, {
                  'Error': 'Could not find the user who created the check, so could not delete the check from the list on the user object'
               });
               const userChecks = typeof userData.checks === 'object' && userData.checks instanceof Array ? userData.checks : [];

               //Remove the delete check from their list of checks
               var checkPosition = userChecks.indexOf(id);
               if (checkPosition <= -1) return callback(500, {
                  "Error": "Could not find the check on the users object, so could not remove it"
               });

               userChecks.splice(checkPosition, 1);
               userData.checks = userChecks;

               //Re-save the user's data
               _data.update('users', checkData.userPhone, userData, function (err) {
                  if (err) return callback(500, {
                     'Error': 'Could not update the specified user'
                  });
                  callback(200);
               });
            });
         });
      });
   });
};

//verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = function (id, phone, callback) {
   //Lookup the token
   _data.read('tokens', id, function (err, tokenData) {
      if (err) return callback(false);
      if (phone !== tokenData.phone || tokenData.expires < Date.now()) return callback(false);

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