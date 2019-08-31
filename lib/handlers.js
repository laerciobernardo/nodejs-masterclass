/*
 * Request handlers
 *
 */

//Dependencies
const _data = require('./data');
const helpers = require('./helpers');

//Define the handlers
let handlers = {};

//Users
handlers.users = function(data, callback){
   const acceptableMethods = ['get', 'post', 'put', 'delete'];
   if(acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._users[data.method](data, callback);
};

//Container for the users submethods
handlers._users = {};

//Users - post
//Required data: firstName, lastName, phone, password, toAgreement
//Optional data: none
handlers._users.post = function(data, callback){
   //Check if all required fields are filled out
   let firstName = typeof(data.payload.firstName === 'string' && data.payload.firstName.trim().length() > 0) ? data.payload.firstName : false;
   let lastName = typeof(data.payload.lastName === 'string' && data.payload.lastName.trim().length() > 0) ? data.payload.lastName : false;
   let phone = typeof(data.payload.phone === 'string' && data.payload.phone.trim().length() === 10) ? data.payload.phone : false;
   let password = typeof(data.payload.password === 'string' && data.payload.password.trim().length() > 0) ? data.payload.password : false;
   let tosAgreement = typeof(data.payload.tosAgreement === 'boolean' && data.payload.tosAgreement === true) ? true : false;

   if(!firstName || !lastName || !phone || !password || !tosAgreement) return callback(400, {'Error': 'Missing required fields.'});

   _data.read('users',phone, function(err, data){
      //User already exists
      if(!err) return callback(400, {'Error': 'A user with that phone number already exists.', err});

      //Hash the password
      const hashedPassword = helpers.hash(password);

      if(!hashedPassword) return callback(500, {'Error': 'Could not hash the user\'s password'});

      //Create a user
      const userObject = {
         'firstName': firstName,
         'lastName': lastName,
         'phone': phone,
         'hashedPassword': hashedPassword,
         'tosAgreement': true
      };

      //Store the userObject
      _data.create('users', phone,  userObject, function(err){
         if(err){
            console.log(err);
            return callback(500,{'error': 'could not create the new user'});
         }

         callback(200);
      });
   })

};

//users - get
//required data: phone
//optional data: none
//@TODO only let the authenticated user access their object. don't let them access anyone else's
handlers._users.get = function(data, callback){
   //check that the phone number is valid
   let phone = typeof(data.queryStringObject.phone === 'string' && data.queryStringObject.phone.trim().length() === 10) ? data.queryStringObject.phone : false;
   if(!phone) return callback(400, {'error': 'Missing required field'});

   //lookup the user
   _data.read('users', phone, function(err, data){
      if(err) return callback(404);

      //remove the hashed password from the user object before returnint it to the requester
      delete data.hashedpassword;
      callback(200, data);
   });
};

//users - put
//required data: phone
//optional data: firstname, lastname, password (at least one must be specified)
//@TODO only let an authenticated user update their own object. don't let them update anyone else's
handlers._users.put = function(data, callback){
   //check that the phone number is valid
   let phone = typeof(data.payload.phone === 'string' && data.payload.phone.trim().length() === 10) ? data.payload.phone : false;

   //Check the optional fields
   let firstName = typeof(data.payload.firstName === 'string' && data.payload.firstName.trim().length() > 0) ? data.payload.firstName : false;
   let lastName = typeof(data.payload.lastName === 'string' && data.payload.lastName.trim().length() > 0) ? data.payload.lastName : false;
   let password = typeof(data.payload.password === 'string' && data.payload.password.trim().length() > 0) ? data.payload.password : false;

   //Error if the phone is invalid
   if(!phone) return callback(400, {'Error': 'Missing required field'});

   if(!firstName && !lastName && !password) return callback(400, {'Error': 'Missing fields to update'});

   //Lookup the user
   _data.read('users', phone, function(err, userData){
      if(err || !userData) return callback(400, {'Error': 'The specified user does not exist'});

      //Update the fields necessary
      if(firstName) userData.firstName = firstName;
      if(lastName) userData.lastName = lastName;
      if(password) userData.hashedPassword = helpers.hash(password);

      //Store the new updates
      _data.update('users', phone, userData, function(err){
         if(err){
            console.log(err);
            return callback(500, {'Error': 'Could not update the user'});
         }
         callback(200);
      });
   });
};

//Users - delete
//Required fields: phone
//@TODO only let the authenticated user delete their object. Don't let them delete anyone.
//@TODO Cleanup (delete) any other files associated with this user
handlers._users.delete = function(data, callback){
   //Check the optional fields
   let phone = typeof(data.queryStringObject.phone === 'string' && data.queryStringObject.phone.trim().length() === 10) ? data.queryStringObject.phone : false;

   //Error if the phone is invalid
   if(!phone) return callback(400, {'Error': 'Missing required field'});
   //lookup the user
   _data.read('users', phone, function(err, data){
      if(err) return callback(404, {'Error': 'Could not find the specified user.', err});

      _data.delete('users', phone, function(err){
         if(err) return callback (500, {'Error': 'Could not delete the specified user'});
         callback(200);
      });
   });
};



//Tokens
handlers.tokens = function(data, callback){
   const acceptableMethods = ['get', 'post', 'put', 'delete'];
   if(acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._tokens[data.method](data, callback);
};

//Container for all tokens method
handlers._tokens = {};

//Tokens - post
//Requred data: phone, password
//Optional data: none
handlers._tokens.post = function(data, callback){
   //Check required fields
   let phone = typeof(data.payload.phone === 'string' && data.payload.phone.trim().length() === 10) ? data.payload.phone : false;
   let password = typeof(data.payload.password === 'string' && data.payload.password.trim().length() > 0) ? data.payload.password : false;

   if(!phone || !password) return callback(400, {'Error': 'Missing required field(s)'});

   //Lookup the user who matches that phone number
   _data.read('users', phone, function(err, userData){
      if(err || !userData) return callback(400, {'Error': 'Could not specified the user'});
      //Hash the sent password and compare it to the password stored in the user object
      const hashedPassword = helpers.hash(password);

      if(!hashedPassword) return callback(500, {'Error': 'Could not hash the user\'s password'});

      if(hashedPassword !== userData.hashedPassword) return callback(400,{'Error': 'The password don\'t match the specified user\'s stored password'});

      //If valid create the new token with a random name. Set expiration date 1 hour in the future
      const tokenId = helpers.createRandomString(20);
      const expires = Date.now() + 1000 * 60 * 60;

      const tokenObject = {
         'phone': phone,
         'id': tokenId,
         'expires': expires
      };

      //Store the token
      _data.create('tokens', tokenId, tokenObject, function(err){
         if(err) return callback(500, {'Error': 'Could not create the token'});

         callback(200, tokenObject);
      });
   });
};
//Tokens - get
//Required data: id
//Optional data: none
handlers._tokens.get = function(data, callback){
   //check that the id is valid
   let id = typeof(data.queryStringObject.id === 'string' && data.queryStringObject.id.trim().length() === 20) ? data.queryStringObject.id : false;
   if(!id) return callback(400, {'error': 'Missing required field'});

   //lookup the token
   _data.read('tokens', id, function(err, tokenData){
      if(err) return callback(404);

      callback(200, tokenData);
   });
};
//Tokens - put
handlers._tokens.put = function(data, callback){};
//Tokens - delete
handlers._tokens.delete = function(data, callback){};

//Not found handler
handlers.notFound = function(data, callback){
   callback(404);
};

//Ping handler
handlers.ping = function(data, callback){
   callback(200);
};

handlers.hello = function(data, callback){
   callback(200, {message: 'This hello route is working very well!'});
};


module.exports = handlers;
