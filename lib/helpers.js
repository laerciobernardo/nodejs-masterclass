/*
 * Helpers for various tasks
 *
 */

//Dependencies
const crypto = require('crypto');
const config = require('./config');
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
   console.log("THE STRING", str);
   try{
      if(str.length){
         const parsedObj = JSON.parse(str);
         return parsedObj;
      }
      return {};
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

module.exports = helpers;
