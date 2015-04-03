/* global
    Host: true
*/
'use strict';

var sshShell = Meteor.npmRequire('ssh2shell');


Host = function(serverDetails, msgCallback){

  this.server = serverDetails;
  this.commands = [];
  this.msg = msgCallback;

  this.idleTimeOut = 120000;  // Two minute timeout...

  // Standard messages
  this.connectedMessage = "Connected to Build Machine";
  this.readyMessage = "Now running command sequence";
  this.closedMessage = "Completed";

  this.commandProcessingActions = [];
  this.commandCompleteActions = [];
  this.endActions = [];

  // Final result object where command actions can add stuff...
  this.result = {};
  // Possible error list where command actions can log errors...
  this.errors = [];

  // Debug options
  this.verbose = false;
  this.debug = false;
};

Host.prototype.addCommand = function(cmd){
  this.commands.push(cmd);
};

Host.prototype.addCommandToFront = function(cmd){
  this.commands.unshift(cmd);
};

Host.prototype.addCompleteAction = function(action){
  this.commandCompleteActions.push(action);
};

Host.prototype.addEndAction = function(action){
  this.endActions.push(action);
};

Host.prototype.addProcessingAction = function(action){
  this.commandProcessingActions.push(action);
};

Host.prototype.cleanCR = function(buffer) {
  var tmp = buffer.replace(/\r.*\r/gm, "\r");
  while (tmp !== buffer) {
    buffer = tmp;
    tmp = buffer.replace(/\r.*\r/gm, "\r");
  }
  return buffer;
};

Host.prototype.endCommands = function(){
  while(this.commands.length > 0) {
    this.commands.pop();
  }
  this.commands.push("exit");
};

Host.prototype.onCommandComplete = function(cmd, response, hostObj) {
  //response is the full response from the command completed
  //hostObj is this object and gives access to the current set of commands

  // Strips useless \r...\r parts...
  // FIXME: it seems this creates problems while trying to detect final
  //        commands' outcome: sometimes also the last line is stripped out :(
  // response = this.cleanCR(response);

  // XXX: check the "\r\n" line break on different OS!
  var responses = response.split("\r\n");

  // Possibly saves the prompt text for later removal
  if (!this.prompt && responses.length > 0) {
    this.prompt = responses[responses.length - 1];
  }
  // Possibly removes the first command line
  if (cmd.length > 0) {
    responses = responses.slice(1);
  }
  // Removes the last prompt line
  responses = responses.slice(0, -1);

  // Back to single response string
  response = responses.join("\n");

  var self = this;
  _.each(this.commandCompleteActions, function(action){
    if (cmd === action.cmd){
      action.callback.call(self, response, hostObj);
    }
  });
};

Host.prototype.onCommandProcessing = function(cmd, response, hostObj, stream) {
  // Strips useless \r...\r parts...
  // FIXME: it seems this creates problems while trying to detect final
  //        commands' outcome: sometimes also the last line is stripped out :(
  // response = this.cleanCR(response);

  // XXX: check the "\r\n" line break on different OS!
  var responses = response.split("\r\n");

  // Possibly saves the prompt text for later removal
  if (!this.prompt && responses.length > 0) {
    this.prompt = responses[responses.length - 1];
  }
  // Possibly removes the first command line
  if (cmd.length > 0) {
    responses = responses.slice(1);
  }

  // Back to single response string
  response = responses.join("\n");

  var self = this;
  _.each(this.commandProcessingActions, function(action){
    if (cmd === action.cmd){
      action.callback.call(self, response, hostObj, stream);
    }
  });
};

Host.prototype.onEnd = function(sessionText, hostObj) {
  //sessionText is the full text for this hosts session

  // Retrieves the prompt string
  var prmpt = hostObj.prompt;
  prmpt = prmpt.split('~');
  // Escapes special characters
  prmpt[0] = prmpt[0].replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  prmpt[1] = prmpt[1].replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  // Accepts everything from the initial prompt up to the $
  prmpt = prmpt[0] + '.*' + prmpt[1];
  var prmptRe = new RegExp(prmpt, "mg");

  // Strips useless \r...\r parts...
  sessionText = this.cleanCR(sessionText);

  // Removes the prompt from sessionText
  sessionText = sessionText.replace(prmptRe, "");
  // Removes "Connected to xxx.xxx.xxx.xxx" from sessionText
  sessionText = sessionText.replace(/Connected to [0-9.\n\r]*/g, "");

  // Removes empty lines from sessionText
  sessionText = sessionText.replace(/^\s*\r\n?/gm, '');
  // Removes trailing new line from sessionText
  sessionText = sessionText.replace(/[\n\r]+$/, '');

  // Replaces '\r\n' with '\n' only
  sessionText = sessionText.replace(/\r\n/gm, '\n');

  var self = this;
  _.each(this.endActions, function(action){
    action.call(self, null, sessionText, hostObj);
  });
};

Host.prototype.run = function(endCallback){
  this.addCommand("exit");
  //Create a new instance
  var ssh = new sshShell(this);
  var self = this;

  if (endCallback) {
    self.addEndAction(endCallback);
  }

  ssh.on("error", function onError(err) {
    if (self.verbose) {
      console.log("SSH2SHELL ERROR!!!");
      console.dir(err);
    }

    self.errors.push(err);
    self.sessionText += '\n' + err;

    if (endCallback) {
      endCallback(err, self.sessionText, self);
    }
  });

  //Start the process
  this.connection = ssh.connect();

  return ssh;
};
