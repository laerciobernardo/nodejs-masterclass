/*
 * Request handlers
 *
 */

//Dependencies


//Define the handlers
let handlers = {};

//Users
handlers.users = function(data, callback){
   const acceptableMethods = ['get', 'post', 'put', 'delete'];
   if(acceptableMethods.indexOf(data.method) === -1) callback(405);

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
   let phone = typeof(data.payload.phone === 'string' && data.payload.phone.trim().length() > 0) ? data.payload.phone : false;
   let password = typeof(data.payload.password === 'string' && data.payload.password.trim().length() > 0) ? data.payload.password : false;
   let toAgreement = typeof(data.payload.toAgreement === 'boolean' && data.payload.toAgreement === true) ? true : false;

   if(!firstName || !lastName || !phone || !password || !toAgreement) callback(400, {'Error': 'Missing required fields.'});


};

//Users - get
handlers._users.get = function(data, callback){

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
