/*
 * Helpers for various tasks
 *
 */

//Dependencies
const crypto = require('crypto');
const config = require('./config');
//Container for helper

const helpers = {};

//Create a SHA256 hash
helpers.hask = function(str){
   if(typeof(str) !=== 'string' || string.length === 0) return false;

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
}

module.exports = helpers;
