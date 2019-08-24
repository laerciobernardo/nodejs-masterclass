/*
 * Library for storing and editing data
 *
 */

//Dependencies
const fs = require('fs');
const path = require('path');

//Container for the module (to be exported)
let lib = {};

//Define the base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');
//Write data to a file
lib.create = function(dir, file, data, callback){
   //Open the file for writing
   const filePath = lib.baseDir+dir+'/'+file+'.json';
   fs.open(filePath, 'wx', function(err, fileDescriptor){
      if(!err && fileDescriptor){
         //Convert data to string
         let stringData = JSON.stringify(data);

         //Write to file and close it
         fs.writeFile(fileDescriptor, stringData, function(err){
            if(!err){
               fs.close(fileDescriptor, function(err){
                  if(!err){
                     callback(false);
                  }else{
                     callback('Error closing new file');
                  }
               });
            }else{
               callback('Error writing to new file');
            }
         });
      }else {
         callback('Could not create new file', err, fileDescriptor);
      }
   });
};

//Read data from a file
lib.read = function(dir, file, callback){
   const filePath = lib.baseDir+dir+'/'+file+'.json';
   fs.readFile(filePath, 'utf-8', function(err, data){
      callback(err, data);
   });
}

// Export the module
module.exports = lib;
