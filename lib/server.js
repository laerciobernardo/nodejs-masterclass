/*
 * Server-related tasks
 *
 */

//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');


//Instantiate the server module object
let server = {};

//Instantiate the HTTP server
server.httpServer = http.createServer(function(req, res){
   server.unifiedServer(req, res);
});


//Config HTTPS server
server.httpsServerOptions = {
   'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
   'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
};

//Instantiate https server
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
   server.unifiedServer(req, res);
});


//All the server logic for both the http and https server

server.unifiedServer = function(req, res){
   //Get the URL and parse it
   const parsedUrl = url.parse(req.url, true);

   //Get the path
   const path = parsedUrl.pathname;
   const trimmedPath = path.replace(/^\/+|\/$/g,'');

   //Get the query string as an object
   const queryStringObject = parsedUrl.query;

   //Get the HTTP Method
   const method = req.method.toLowerCase();

   //Get the headers as an object
   const headers = req.headers;

   //Get the payload, if any
   const decoder = new StringDecoder('utf-8');
   let buffer = '';
   req.on('data', function(data){
      buffer += decoder.write(data);
   });

   req.on('end',function(){
      buffer += decoder.end();
      //Choose the handler this request should go to. If one is not found, use the notFount handler
      const chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

      //Construct the data object to send to handler
      const data = {
         'trimmedPath': trimmedPath,
         'queryStringObject': queryStringObject,
         'method': method,
         'headers': headers,
         'payload': helpers.parseJsonToObject(buffer)
      };

      //Route the request to the handler specified in the router
      chosenHandler(data, function(statusCode, payload){
         //Use the status code called back by the handler, or default to 200
         statusCode = typeof(statusCode) === 'number' ? statusCode : 200;

         //Use the payload called back by the handler, or dafult to empty object
         payload = typeof(payload) === 'object' ? payload : {};

         //Convert the payload to a string
         const payloadString = JSON.stringify(payload);

         //Return the response
         res.setHeader('Content-Type', 'application/json');
         res.writeHead(statusCode);
         res.end(payloadString);

         //Log the request path
         console.log("Returning this response: ",statusCode, payloadString);
      })
   })
};


//Define a request router
server.router = {
   'ping': handlers.ping,
   'hello': handlers.hello,
   'users': handlers.users,
   'tokens': handlers.tokens,
   'checks': handlers.checks
}

//Init script
server.init = function(){
   //Start the HTTP server
   server.httpServer.listen(config.httpPort, function(){
      console.log(`The server is listening on port ${config.httpPort}`);
   });

   //Start the HTTPS server
   server.httpsServer.listen(config.httpsPort, function(){
      console.log(`The server is listening on port ${config.httpsPort}`);
   });

}

//Export the module
module.exports = server;
