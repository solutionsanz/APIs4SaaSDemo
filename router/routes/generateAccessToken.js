var gmailApiSync = require('gmail-api-sync');
var args = process.argv.slice(2);
var serverAuthCode = args[0];

gmailApiSync.setClientSecretsFile('../../client_secret.json');
gmailApiSync.getNewAccesToken(serverAuthCode,function(err,token){
  if(err) {
    return console.error(err);
  } 
  else {
    console.log('accessToken: ' + JSON.stringify(token));
  }
});