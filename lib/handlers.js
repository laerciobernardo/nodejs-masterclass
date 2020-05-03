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

handlers.welcome = function (data, callback) {
   return callback(200, {
      'Welcome': 'Welcome to the Pizza form Brazil, check our API documentation and enjoy!',
      '/users': {
         'Description': 'Manage users on the API',
         'AcceptedMethods': ['get', 'post', 'put', 'delete'],
         'get': {
            'needAuth': true,
            'requiredParams': ['email'],
            'paramsDescriptor': {
               'email': {
                  type: 'string',
                  required: true,
                  constraints: {
                     isEmail: true
                  }
               },
            }
         },
         'post': {
            'needAuth': false,
            'requiredParams': ['name', 'email', 'password', 'address'],
            'paramsDescriptor': {
               'name': {
                  type: 'string',
                  required: true,
                  constraints: {
                     minLength: 3
                  }
               },
               'email': {
                  type: 'string',
                  required: true,
                  constraints: {
                     isEmail: true
                  }
               },
               'password': {
                  type: 'string',
                  required: true,
                  constraints: {
                     minLength: 4
                  }
               }
            }
         }

      },
      '/login': {
         'Description': 'Authenticate on the API',
         'AcceptedMethods': ['post'],
         'post': {
            'requiredParams': ['email', 'password'],
            'paramsDescriptor': {
               'email': {
                  type: 'string',
                  required: true,
                  constraints: {
                     isEmail: true
                  }
               },
               'password': {
                  type: 'string',
                  required: true,
                  constraints: {
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
   let email = typeof data.queryStringObject.email === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email : false;
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
//Required fields: email
//@TODO Cleanup (delete) any other files associated with this user
handlers._users.delete = function (data, callback) {
   //Check the optional fields
   let email = typeof data.queryStringObject.email === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email : false;

   //Error if the email is invalid
   if (!email) return callback(400, {
      'Error': 'Missing required field'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      //lookup the user
      _data.read('users', email, function (err, data) {
         if (err) return callback(404, {
            'Error': 'Could not find the specified user.'
         });

         _data.delete('users', email, function (err) {
            if (err) return callback(500, {
               'Error': 'Could not delete the specified user'
            });
            //delete the token
            //Deleting token
            handlers._tokens.delete(token, email, function (cb) {
               callback(cb)
            })

         });
      });
   });
};

//Login
handlers.login = function (data, callback) {
   const acceptableMethods = ['post'];
   if (acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._login[data.method](data, callback);
};

//Container for login method
handlers._login = {};


//Login - post
//Requred data: email, password
//Optional data: none
handlers._login.post = function (data, callback) {
   //Check required fields
   let email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email) ? data.payload.email : false;
   let password = (typeof data.payload.password === 'string') && data.payload.password.trim().length > 0 ? data.payload.password : false;

   if (!email || !password) return callback(400, {
      'Error': 'Missing or invalid required field(s)'
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

//Logout
handlers.logout = function (data, callback) {
   const acceptableMethods = ['post'];
   if (acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._logout[data.method](data, callback);
};

//Container for logout method
handlers._logout = {};


handlers._logout.post = function (data, callback) {
   //check that the email number is valid
   let email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 ? data.payload.email : false;
   if (!email) return callback(400, {
      'error': 'Missing or invalid required field'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      //Deleting token
      handlers._tokens.delete(token, email, function (cb) {
         callback(cb)
      })
   });
};

//Container for all tokens method
handlers._tokens = {};

//Tokens - delete
//Required fields: id
//@TODO Cleanup (delete) any other files associated with this user
handlers._tokens.delete = function (id, email, callback) {
   //Error if the id is invalid
   if (!id) return callback(400, {
      'Error': 'Missing required field'
   });
   //Check the token from the headers
   const token = typeof id === 'string' ? id : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
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

//Menu
handlers.menu = function (data, callback) {
   const acceptableMethods = ['get'];
   if (acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._menu[data.method](data, callback);
};

//Container for logout method
handlers._menu = {};

//menu - get
//required data: none
//optional data: none

handlers._menu.get = function (data, callback) {
   //check that the email number is valid
   let email = typeof data.queryStringObject.email === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email : false;
   let code = typeof data.queryStringObject.code === 'string' && data.queryStringObject.code.trim().length > 0 ? data.queryStringObject.code : false;

   if (!email) return callback(400, {
      'error': 'Missing or invalid required field'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;

   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      let menu = helpers.menu();

      if (code) {
         menu = helpers.menu().filter(function (pizza) {
            return pizza['Code'] == parseInt(code);
         })
      }

      return callback(200, menu);
   });
}

//Carts
handlers.carts = function (data, callback) {
   const acceptableMethods = ['post', 'get', 'put', 'delete'];
   if (acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._carts[data.method](data, callback);
};

//Container for cart methods
handlers._carts = {};

//Carts - post
//Required data: name, email, adress, password
//Optional data: none
handlers._carts.post = function (data, callback) {
   //Check if all required fields are filled out
   let email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email) ? data.payload.email : false;
   let code = typeof data.payload.code === 'string' && data.payload.code.trim().length > 0 ? parseInt(data.payload.code) : false;
   let quantity = typeof data.payload.quantity === 'string' && data.payload.quantity.trim().length > 0 ? parseInt(data.payload.quantity) : false;

   if (!email || !code || !quantity) return callback(400, {
      'Error': 'Missing or invalid required fields.'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });
      _data.read('carts', email, function (err, cartData) {

         let cartObject = null;
         //User already exists
         const pizza = helpers.menu().filter(function (item) {
            return item['Code'] == parseInt(code);
         })[0];

         if (typeof pizza == 'undefined') {
            return callback(400, {
               'Error': 'Pizza not found, please check the menu'
            })
         } else {
            //Already exists a cart to this email
            if (!err) {
               const alreadyExistPizza = cartData.items.filter(function (pizza) { return pizza['Code'] == code });

               if (!alreadyExistPizza.length) {
                  pizza['Quantity'] = quantity;
                  cartData.items.push(pizza);
               } else {
                  cartToUpdate = cartData.items.map(function (piz) {
                     if (piz['Code'] == code) {
                        piz['Quantity'] += quantity;
                     }
                     return piz
                  });

                  cartData.items = cartToUpdate;
               }
               //Store the new updates
               _data.update('carts', email, cartData, function (err) {
                  if (err) {
                     return callback(500, {
                        'Error': 'Could not update the cart'
                     });
                  }
                  callback(200);
               });
            } else {
               //Create a new cart
               pizza.Quantity = quantity;
               cartObject = {
                  'email': email,
                  'items': [pizza],
               };
               //Store the cartObject
               _data.create('carts', email, cartObject, function (err) {
                  if (err) {
                     console.log(err);
                     return callback(500, {
                        'error': 'could not create the new cart'
                     });
                  }
                  callback(200);
               });
            }
         }
      })
   });
};

//Carts - get
//Required data:email
//Optional data: none
handlers._carts.get = function (data, callback) {
   //Check if all required fields are filled out
   let email = typeof data.queryStringObject.email === 'string' && data.queryStringObject.email.trim().length > 0 && helpers.validateEmail(data.queryStringObject.email) ? data.queryStringObject.email : false;

   if (!email) return callback(400, {
      'Error': 'Missing or invalid required fields.'
   });
   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });
      _data.read('carts', email, function (err, cartData) {
         if (err) return callback(404);

         callback(200, cartData);
      })
   });
};

//Carts - put
//required data: email
//optional data: name, password (at least one must be specified)
handlers._carts.put = function (data, callback) {
   let email = typeof data.queryStringObject.email === 'string' && data.queryStringObject.email.trim().length > 0 && helpers.validateEmail(data.queryStringObject.email) ? data.queryStringObject.email : false;
   //Check if all required fields are filled out
   let code = typeof data.payload.code === 'string' && data.payload.code.trim().length > 0 ? parseInt(data.payload.code) : false;
   let quantity = typeof data.payload.quantity === 'string' && data.payload.quantity.trim().length > 0 ? parseInt(data.payload.quantity) : false;

   console.log('QTD', quantity);
   if (!email || !code || quantity === false) return callback(400, {
      'Error': 'Missing or invalid required fields.'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });
      _data.read('carts', email, function (err, cartData) {

         if (err) {
            return callback(500, err);
         }

         const pizza = helpers.menu().filter(function (item) {
            return item['Code'] == parseInt(code);
         })[0];

         if (typeof pizza == 'undefined') {
            return callback(400, {
               'Error': 'Pizza not found, please check the menu'
            })
         }
         const indexOfPizza = cartData.items.map(function (pizza) { return pizza['Code'] }).indexOf(code);

         if (indexOfPizza == -1) {
            return callback(400, {
               'Error': 'Pizza not found, please choose other item on your cart'
            });
         }
         //Remove pizza if quantity is equal to zero
         if (quantity === 0) {
            cartData.items.splice(indexOfPizza, 1);
         } else {
            cartData.items[indexOfPizza].Quantity = quantity;
         }

         //Store the new updates
         _data.update('carts', email, cartData, function (err) {
            if (err) {
               return callback(500, {
                  'Error': 'Could not update the cart'
               });
            }
            callback(200);
         });
      })
   });
};

//Carts - delete
//Required fields: email
handlers._carts.delete = function (data, callback) {
   //Check the optional fields
   let email = typeof data.queryStringObject.email === 'string' && data.queryStringObject.email.trim().length > 0 ? data.queryStringObject.email : false;

   //Error if the email is invalid
   if (!email) return callback(400, {
      'Error': 'Missing required field'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });

      //lookup the user
      _data.read('carts', email, function (err, data) {
         if (err) return callback(404, {
            'Error': 'Could not find the specified user.'
         });

         _data.delete('carts', email, function (err) {
            if (err) return callback(500, {
               'Error': 'Could not delete the specified user'
            });
            callback(200);
         });
      });
   });
};

//Not found handler
handlers.notFound = function (data, callback) {
   callback(404);
};

//Orders
handlers.orders = function (data, callback) {
   const acceptableMethods = ['post'];
   if (acceptableMethods.indexOf(data.method) === -1) return callback(405);

   handlers._orders[data.method](data, callback);
};

//Container for orders methods
handlers._orders = {};

//Orders - post
//Required data: email, creditCardHash
//Optional data: none
handlers._orders.post = function (data, callback) {
   //Check if all required fields are filled out
   let email = typeof data.payload.email === 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email) ? data.payload.email : false;
   
   if (!email) return callback(400, {
      'Error': 'Missing or invalid required fields.'
   });

   //Check the token from the headers
   const token = typeof data.headers.token === 'string' ? data.headers.token : false;
   handlers._tokens.verifyToken(token, email, function (isValid) {
      if (!isValid) return callback(403, {
         'Error': 'Missing or invalid token'
      });
      _data.read('carts', email, function (err, cartData) {

         //Calc ammount of cart and convert in cents
         let amount = (cartData.items.reduce(function(acc, curr){
            return acc + (curr['Price'] * curr['quantity']);
         }, 0) * 100);

         const payload = {
            amount: amount,
            currency: cartData.items[0].Currency,
            description: 'New order from pizza to '+cartData.email,
            source: 'tok_visa' 
         }

         //Create a new order to STRIPE
         const baseUrl = config.stripe_base_url;
         const path = '/'+config.stripe_api_version+'/'+config.string_payment_url;
         const auth = config.stripe_secret_key;
         helpers.makeRequest(baseUrl, path, auth, payload, function(response){
            return callback(200, response);
         });

      })
   });
};

module.exports = handlers;