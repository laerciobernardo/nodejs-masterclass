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

//Validate email
helpers.validateEmail = function(email){
   var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
   return re.test(String(email).toLowerCase());
}

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
   return str;
};

//Return the pizza menu
helpers.menu = function(){
   return [
      {
         'Code':1,
         'Name': 'Homerun Pizza',
         'Description': 'Plenty of cheese, pepperoni, mushrooms, sausage, bacon, onions, green peppers, ham and beef.',
         'Currency': 'U$',
         'Price': 9.00,
         
      },
      {
         'Code':2,
         'Name': 'Steak & Veggies Pizza',
         'Description': '1-2 lb. of sirloin steak with mushrooms, onions and sliced green peppers.',
         'Currency': 'U$',
         'Price': 8.30
      },
      {
         'Code': 3,
         'Name': 'Mediterranean Pizza',
         'Description': 'Garlic, olive oil, sliced tomato, feta cheese, olives, spinach, topped with mozzarella cheese.',
         'Currency': 'U$',
         'Price': 8.30
      },
      {
         'Code': 4,
         'Name': 'BLT Pizza',
         'Description': 'Plenty of cheese, bacon, tomato, lettuce and ranch dressing.',
         'Currency': 'U$',
         'Price': 9.00
      },
      {
         'Code': 5,
         'Name': 'Aloha Hawaiian Pizza',
         'Description': 'Imported ham, juicy pineapple and bacon over cheese and sauce.',
         'Currency': 'U$',
         'Price': 8.30
      },
      {
         'Code': 6,
         'Name': 'BBQ Chicken Pizza',
         'Description': 'Grilled Barbeque chicken, Barbeque sauce, red onions. (no red sauce).',
         'Currency': 'U$',
         'Price': 8.15
      }
   ]
}

module.exports = helpers;
