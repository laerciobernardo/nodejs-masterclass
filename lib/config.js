//
//Create and export configuration variables
//
//

//Container for all the environments
let environments = {};

//Staging (default) environment
environments.staging = {
   'httpPort': 3000,
   'httpsPort': 3001,
   'envName': 'staging',
   'hashingSecret': 'thisIsASecret',
   'maxChecks': 5,
   'twilio':{
      'accountSid': 'AC04b45a6bba19bd3a126f8c3f92042ad0',
      'authToken': 'a518412f698bb67eb7a35c68062d419c',
      'fromPhone': '+12029722966'
   }
};

//Production environment
environments.production = {
   'httpPort': 5000,
   'httpsPort': 5001,
   'envName': 'production',
   'hashingSecret': 'thisIsAlsoASecret',
   'maxChecks': 5,
   'twilio':{
      'accountSid': '',
      'authToken': '',
      'fromPhone': ''
   }
};

//Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

//Export the module
module.exports = environmentToExport;
