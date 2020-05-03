/*
 * Helpers for various tasks
 *
 */

//Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const querystring = require('querystring');
//Container for helper

let helpers = {};

//Create a SHA256 hash
helpers.hash = function (str) {
   if (typeof (str) !== 'string' || str.length === 0) {
      return false;
   }

   const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
   return hash;
};

//Parse JsonToObject
helpers.parseJsonToObject = function (str) {
   try {
      if (str.length) {
         const parsedObj = JSON.parse(str);
         return parsedObj;
      }
      return {};
   } catch (e) {
      console.log(e);
      return {};
   }
};

//Validate email
helpers.validateEmail = function (email) {
   var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
   return re.test(String(email).toLowerCase());
}

//Create a string of random alphanumeric characters, of a given  length
helpers.createRandomString = function (strLength) {
   strLength = typeof (strLength) === 'number' && strLength > 0 ? strLength : false;

   if (!strLength) return false;

   //Define all possible characters that could fo into a string
   const possibleChar = 'abcdefghijklmnopqrstuvwxyz0123456789';

   //Start the final string
   let str = '';

   for (let i = 1; i <= strLength; i++) {
      //Get a random character from the possible characters string
      let randomChar = possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
      //Append this character to the final string
      str += randomChar;
   }

   //Return the final string
   return str;
};

//Return the pizza menu
helpers.menu = function () {
   return [
      {
         'Code': 1,
         'Name': 'Homerun Pizza',
         'Description': 'Plenty of cheese, pepperoni, mushrooms, sausage, bacon, onions, green peppers, ham and beef.',
         'Currency': 'usd',
         'Price': 9.00,

      },
      {
         'Code': 2,
         'Name': 'Steak & Veggies Pizza',
         'Description': '1-2 lb. of sirloin steak with mushrooms, onions and sliced green peppers.',
         'Currency': 'usd',
         'Price': 8.30
      },
      {
         'Code': 3,
         'Name': 'Mediterranean Pizza',
         'Description': 'Garlic, olive oil, sliced tomato, feta cheese, olives, spinach, topped with mozzarella cheese.',
         'Currency': 'usd',
         'Price': 8.30
      },
      {
         'Code': 4,
         'Name': 'BLT Pizza',
         'Description': 'Plenty of cheese, bacon, tomato, lettuce and ranch dressing.',
         'Currency': 'usd',
         'Price': 9.00
      },
      {
         'Code': 5,
         'Name': 'Aloha Hawaiian Pizza',
         'Description': 'Imported ham, juicy pineapple and bacon over cheese and sauce.',
         'Currency': 'usd',
         'Price': 8.30
      },
      {
         'Code': 6,
         'Name': 'BBQ Chicken Pizza',
         'Description': 'Grilled Barbeque chicken, Barbeque sauce, red onions. (no red sauce).',
         'Currency': 'usd',
         'Price': 8.15
      }
   ]
}

//Create a new request
helpers.makeRequest = function (baseUrl, path, auth, payload, callback) {
   //Stringify the payload
   const stringPayload = querystring.stringify(payload);

   //Configure the request details
   const requestDetails = {
      'protocol': 'https:',
      'hostname': baseUrl,
      'method': 'POST',
      'path': path,
      'auth': auth,
      'headers': {
         'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Length': Buffer.byteLength(stringPayload)
      }
   }

   //Instantiate the request object
   const req = https.request(requestDetails, function (res) {
      //Grab the status of the sent request
      status = res.statusCode;
      //Callback successfully if the request went through
      if (status == 200 || status == 201) {
         //Get the payment data
         res.on('data', function (data) {
            const statusPayment = helpers.parseJsonToObject(data);
            callback(statusPayment);
         });
      } else {
         callback(status)
      }
   });

   //Add the payload
   req.write(stringPayload);

   //Bind to the error event so it
   req.on('error', function (e) {
      callback(e)
   });

   //End the request
   req.end();

}

module.exports = helpers;
