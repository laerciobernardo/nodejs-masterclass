/*
 * Helpers for various tasks
 *
 */

//Dependencies
const crypto = require('crypto');
const config = require('./config');
const https = require('https');
const queryString = require('querystring');


//Container for helper
let helpers = {};

//Create a SHA256 hash
helpers.hash = function(str){
   if(typeof(str) !== 'string' || str.length === 0){
      return false;
   }

   const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
   return hash;
};

//Parse JsonToObject
helpers.parseJsonToObject = function(str){
   try{
      const parsedObj = JSON.parse(str);
      return parsedObj;
   }catch(e){
      console.log(e);
      return {};
   }
};

//Create a string of random alphanumeric characters, of a given  length
helpers.createRandomString = function(strLength){
   strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;

   if(!strLength) return false;

   //Define all possible characters that could fo into a string
   const possibleChar = 'abcdefghijklmnopqrstuvwxyz0123456789';

   //Start the final string
   let str = '';

   for(let i = 1; i <= strLength; i++){
      //Get a random character from the possible characters string
      let randomChar = possibleChar.charAt(Math.floor(Math.random() * possibleChar.length));
      //Append this character to the final string
      str += randomChar;
   }

   //Return the final string
   console.log('Random String', str);
   return str;
};

//Create an SMS message via Twilio
helpers.sendTwilioSms = function(phone, msg, callback){
   //Validate parameters
   phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
   msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length < 1600 ? msg : false;
   if(!phone || !msg) return callback('Given parameters were missing or invalid');

   //Configure the request payload
   var payload = {
      'From': config.twilio.fromPhone,
      'To': '+55'+phone,
      'Body': msg
   };

   //Stringify the payload
   const stringPayload = queryString.stringify(payload);
   
   //Configure the request details
   const requestDetails = {
      'protocol': 'https',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/'+config.twilio.accountSid+'/Messages.json',
      'auth': config.twilio.accountSid+':'+config.twilio.authToken,
      'headers':{
         'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Length': Buffer.byteLength(stringPayload)
      }
   }

   //Instantiate the request object
   const request = https.request(requestDetails, function(res){
      //Grab the status of the sent request
      const status = res.statusCode;
      //Callback successfully if the request went through

      if(status != 200 || status != 201) return callback('Status code returned was '+ status)

      callback(false);
   });

   //Bind to the error event so it doesn't get thrown
   request.on('error', function(e){
      callback(e);
   })

   //Add the payload
   request.write(stringPayload);

   //End the request
   request.end();
}

module.exports = helpers;
