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
            return callback(500,{'Error': 'Could not create the new user'});
         }

         callback(200);
      });
   })

};

//Users - get
//Required data: phone
//Optional data: none
//@TODO: Only let the authenticated user access their object. Don't let them access anyone else's
handlers._users.get = function(data, callback){
   //Check that the phone number is valid
   let phone = typeof(data.queryStringObject.phone === 'string' && data.queryStringObject.phone.trim().length() === 10) ? data.queryStringObject.phone : false;
   if(!phone) return callback(400, {'Error': 'Missing required field'});

   //Lookup the user
   _data.read('users', phone, function(err, data){
      if(error) return callback(404);

      //Remove the hashed password from the user object before returnint it to the requester
      delete data.hashedPassword;
      callback(200, data);
   });
};

//Users - put
handlers._users.put = function(data, callback){

};

//Users - delete
handlers._users.delete = function(data, callback){

};

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
