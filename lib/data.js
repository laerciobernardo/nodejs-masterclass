/*
 * Library for storing and editing data
 *
 */

//Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers')

//Container for the module (to be exported)
let lib = {};

//Define the base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');
//Write data to a file
lib.create = function(dir, file, data, callback){
   //Open the file for writing
   const filePath = lib.baseDir+dir+'/'+file+'.json';
   fs.open(filePath, 'wx', function(err, fileDescriptor){
      if(err || !fileDescriptor){
        return callback('Could not create new file', err, fileDescriptor);
      }
      //Convert data to string
      let stringData = JSON.stringify(data);

      //Write to file and close it
      fs.writeFile(fileDescriptor, stringData, function(err){
         if(err){
            return callback('Error writing to new file');
         }
         fs.close(fileDescriptor, function(err){
            if(err){
               return callback('Error closing new file');
            }
            callback(false);
         });
      });
   });
};

//Read data from a file
lib.read = function(dir, file, callback){
   const filePath = lib.baseDir+dir+'/'+file+'.json';
   fs.readFile(filePath, 'utf-8', function(err, data){
      if(err || !data){
        return callback(err, data);
      }
      const parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
   });
}

//Update date inside a file
lib.update = function(dir, file, data, callback){
   const filePath = lib.baseDir+dir+'/'+file+'.json';
   //Open the file to writing
   fs.open(filePath, 'r+',function(err, fileDescriptor){
      if(err || !fileDescriptor) return callback("Could not open the file for updating, it may not exist yet");

      //Convert the data to string
      const stringData = JSON.stringify(data);

      //Truncate the file
      fs.ftruncate(fileDescriptor, function(err){
         if(err) return callback('Error truncating file');

         //Write the file and close it
         fs.writeFile(fileDescriptor, stringData, function(err){
            if(err) return callback('Error writing to existing file');
            fs.close(fileDescriptor, function(err){
               if(err) return callback('Error closing existing file');
               callback(false);
            });
         });
      });
   });
};

//Delete a file
lib.delete = function(dir, file, callback){
   //Unlink the file
   const filePath = lib.baseDir+dir+'/'+file+'.json';
   fs.unlink(filePath, function(err){
      if(err) return callback('Error deleting file');

      callback(false);
   });
};

//List all the items in a directory
lib.list = function(dir, callback){
   fs.readdir(lib.baseDir+dir+'/',function(err, data){
      if(err || !data || data.length == 0) return callback(err, data);

      const trimmedFileNames = [];
      data.forEach(function(fileName){
         trimmedFileNames.push(fileName.replace('.json', ''))
      });
      callback(false, trimmedFileNames);
   });
};

// Export the module
module.exports = lib;
