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
   'stripe_publishable_key':'pk_test_s3HMgNKDJxoiCzy4QpiGLkCq0033HS2WKg',
   'stripe_secret_key':'sk_test_SFwSkIDGD7HJ5Gt1bD6yWaLh00D34IuT67',
   'stripe_base_url': 'api.stripe.com',
   'stripe_api_version': 'v1',
   'string_payment_url':'charges',
   'mailgun_base_url': 'api.mailgun.net',
   'mailgun_path': '/v3/sandbox0d6306b714ab46938767bbced21915f0.mailgun.org/messages',
   'mailgun_api_key': 'api:ffdfab06de136760f4c594b5593b4d6b-a2b91229-7e65b486',
   'mailgun_to': 'contato@laerciobernardo.com.br'
};

//Production environment
environments.production = {
   'httpPort': 5000,
   'httpsPort': 5001,
   'envName': 'production',
   'hashingSecret': 'thisIsAlsoASecret',
   'stripe_publishable_key':'pk_test_s3HMgNKDJxoiCzy4QpiGLkCq0033HS2WKg',
   'stripe_secret_key':'sk_test_SFwSkIDGD7HJ5Gt1bD6yWaLh00D34IuT67',
   'stripe_base_url': 'https://api.stripe.com/',
   'stripe_api_version': 'v1',
   'string_payment_url':'payment_intents',
   'mailgun_base_url': 'https://api.mailgun.net/v3',
   'mailgun_domainame': 'sandbox0d6306b714ab46938767bbced21915f0.mailgun.org',
   'mailgun_endpoint': '/messages',
   'mailgun_username': 'api',
   'mailgun_api_key': 'ffdfab06de136760f4c594b5593b4d6b-a2b91229-7e65b486'
};

//Determine which environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check that the current environment is one of the environments above, if not, default to staging
const environmentToExport = typeof(environments[currentEnvironment]) === 'object' ? environments[currentEnvironment] : environments.staging;

//Export the module
module.exports = environmentToExport;
