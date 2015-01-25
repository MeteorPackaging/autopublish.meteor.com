/* global publishPackage: true, AutoPublish: false */

// General meteor integration

var sshShell = Meteor.npmRequire('ssh2shell');

//Host Object:
var host = function(serverDetails, msgCallback){
  'use strict';

  this.server = serverDetails;
  this.commands = [];
  this.msg = msgCallback;

  // Standard messages
  this.connectedMessage = "Connected to Build Machine";
  this.readyMessage = "Now Running publish sequence";
  this.closedMessage = "Completed";

  this.commandProcessingActions = [];
  this.commandCompleteActions = [];
  this.endActions = [];

  // Final result object where command actions can add stuff...
  this.result = {};
  // Possible error list where command actions can log errors...
  this.errors = [];

  // Debug options
  //this.verbose = true;
  //this.debug = true;
};

host.prototype.onCommandProcessing = function(cmd, response, hostObj, stream) {
  'use strict';
  var self = this;
  _.each(this.commandProcessingActions, function(action){
    if (cmd === action.cmd){
      action.callback.call(self, response, hostObj, stream);
    }
  });
};

host.prototype.onCommandComplete = function(cmd, response, hostObj) {
  //response is the full response from the command completed
  //hostObj is this object and gives access to the current set of commands
  'use strict';

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

host.prototype.onEnd = function(sessionText, hostObj) {
  //sessionText is the full text for this hosts session

  'use strict';

  // Retrieves the prompt string
  var prmpt = hostObj.prompt;
  prmpt = prmpt.split('~');
  // Escapes special characters
  prmpt[0] = prmpt[0].replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  prmpt[1] = prmpt[1].replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  // Accepts everything from the initial prompt up to the $
  prmpt = prmpt[0] + '.*' + prmpt[1];
  // Removes the prompt from sessionText
  var prmptRe = new RegExp(prmpt, "mg");
  sessionText = sessionText.replace(prmptRe, "");
  // Removes "Connected to xxx.xxx.xxx.xxx" from sessionText
  sessionText = sessionText.replace(/Connected to [0-9.\n\r]*/g, "");

  // Removes trailing new line from sessionText
  sessionText = sessionText.replace(/\n$/, '');

  var self = this;
  _.each(this.endActions, function(action){
    action.call(self, null, sessionText, hostObj);
  });
};

host.prototype.addCommand = function(cmd){
  'use strict';
  this.commands.push(cmd);
};

host.prototype.addCommandToFront = function(cmd){
  'use strict';
  this.commands.unshift(cmd);
};

host.prototype.addProcessingAction = function(action){
  'use strict';
  this.commandProcessingActions.push(action);
};

host.prototype.addCompleteAction = function(action){
  'use strict';
  this.commandCompleteActions.push(action);
};

host.prototype.addEndAction = function(action){
  'use strict';
  this.endActions.push(action);
};

host.prototype.endCommands = function(){
  'use strict';
  while(this.commands.length > 0) {
    this.commands.pop();
  }
  this.commands.push("exit");
};

host.prototype.run = function(endCallback){
  'use strict';
  this.addCommand("exit");
  //Create a new instance
  var ssh = new sshShell(this);
  var self = this;

  if (endCallback) {
    self.addEndAction(endCallback);

    ssh.on("error", function onError(err, type, close, callback) {
      endCallback(err, self.sessionText, self);
    });
  }

  //Start the process
  this.connection = ssh.connect();

  return ssh;
};

var clearGitSessionText = function(sessionText){
  'use strict';
  // Removes useless git clone output lines...
  sessionText = sessionText.replace(/^remote: Compressing.*\r/gm, '');
  sessionText = sessionText.replace(/^Receiving objects.*\r/mg, '');
  sessionText = sessionText.replace(/^Resolving deltas.*\r/mg, '');
  return sessionText;
};

var clearMeteorSessionText = function(sessionText){
  'use strict';
  // Removes useless meteor publish output lines...
  sessionText = sessionText.replace(/^   Building.*\r/gm, '');
  sessionText = sessionText.replace(/^   Creating.*\r/gm, '');
  sessionText = sessionText.replace(/^   Downloading.*\r/gm, '');
  sessionText = sessionText.replace(/^   Initializing.*\r/gm, '');
  sessionText = sessionText.replace(/^   Preparing.*\r/gm, '');
  sessionText = sessionText.replace(/^   Publishing.*\r/gm, '');
  sessionText = sessionText.replace(/^   Selecting.*\r/gm, '');
  sessionText = sessionText.replace(/^   Updating.*\r/gm, '');
  sessionText = sessionText.replace(/^   Uploading.*\r/gm, '');
  sessionText = sessionText.replace(/^\s*[\\\|\/\-]\r/gm, '');
  sessionText = sessionText.replace(/^\s*\r/gm, '');
  return sessionText;
};

publishPackage = function(pkgInfo, callback) {
  'use strict';

  var progress = {
    send: Meteor.bindEnvironment(function(msg){
      // Possibly removes initial IP address of the build machie
      msg = msg.replace(/^[0-9.]*: /, "");

      // Updates the publish action object to show this last message
      AutoPublish.update(pkgInfo._id, {
        $set: {
          publishing: msg
        }
      });
    })
  };

  // Creates the ssh interface to the remote machine
  // XXX: this should be transformed into a cycle to get machines
  //      for all three architectures when it is the case.
  var machine = new host(
    Meteor.settings.machine['os.linux.x86_64'],
    progress
  );

  // Commands
  var cmd;

  // Checks for currently installed Meteor Version
  cmd = '~/.meteor/meteor --version';
  machine.addCommand('msg:Checking Meteor Version...');
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: function(version, hostObj) {
      if (version) {
        hostObj.result.meteorVersion = version;
      } else {
        hostObj.errors.push('Could not run meteor on remote machine');
        this.endCommands();
      }
    }
  });

  // Checks currently logged in meteor user
  cmd = '~/.meteor/meteor whoami';
  machine.addCommand('msg:Checking Meteor User...');
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: function(username, hostObj) {
      if (username) {
        hostObj.result.username = username;
      } else {
        hostObj.result.success = false;
        hostObj.errors.push('Could not login user on remote machine');
        this.endCommands();
      }
    }
  });

  // Possibly removes old autopublish folder
  cmd = 'rm -rf autopublish';
  machine.addCommand('msg:Preparing environment...');
  machine.addCommand(cmd);

  // Clones the repository
  cmd = "git clone -b " + pkgInfo.tagName + " " + pkgInfo.repoCloneUrl +
    " autopublish"
  ;
  machine.addCommand('msg:Cloning Repository...');
  machine.addCommand(cmd);

  // Moves into the cloned repo
  cmd = 'cd autopublish';
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: function(response, hostObj) {
      if (/No such file or directory/.test(response)){
        hostObj.result.success = false;
        hostObj.errors.push('Unable to clone the repository');
        this.endCommands();
      }
      else {
        this.addCommandToFront('msg:' +
          'Running publish ' +
          pkgInfo.pkgName +
          ' on ' +
          hostObj.result.meteorVersion +
          '...'
        );
      }
    }
  });

  // Runs 'meteor publish'
  cmd = "~/.meteor/meteor publish";
  var afterPublishCallback = function(response, hostObj) {
    response = clearMeteorSessionText(response);
    if (/Errors while publishing/.test(response)){
      // Some error occurred...
      if (/There is no package named/.test(response)) {
        // Not published, first time publishing!
        // Triggers a `meteor publish --create` command
        var cmd = "~/.meteor/meteor publish --create";
        machine.addCommandToFront(cmd);
        machine.addCommandToFront("msg:First time publishing...");
        machine.addCompleteAction({
          cmd: cmd,
          callback: afterPublishCallback
        });
      }
      else if (/Version already exists/.test(response)) {
        // Not published, version already existed!
        hostObj.result.success = false;
        hostObj.errors.push("Version already exists");
        this.endCommands();
      }
      else if (/Documentation not found/.test(response)) {
        // Not published, Documentation not found!
        hostObj.result.success = false;
        hostObj.errors.push(
          "Documentation not found! Check your *documentation* option inside " +
          "Package.describe (defaults to README.md)");
        this.endCommands();
      }
      else if (/Longform package description is too long/.test(response)) {
        // Not published, description is too long!
        hostObj.result.success = false;
        hostObj.errors.push("First section too long inside README.m");
        this.endCommands();
      }
      else {
        hostObj.result.success = false;
        hostObj.errors.push("Some error occurred");
        this.endCommands();
      }
    }
    // Otherwise extracts
    else if (/Published/.test(response)) {
      // Successfully published!
      hostObj.result.success = true;

      // Gets the published version
      var ver = response.split('@');
      hostObj.result.version = ver[1].replace(/.$/, '');
    }
    else {
      hostObj.result.success = false;
      hostObj.errors.push("Some error occurred");
      this.endCommands();
    }
  };
  machine.addCommand(cmd);
  machine.addCompleteAction({
    cmd: cmd,
    callback: afterPublishCallback
  });

  // Everything done!
  machine.addCommand('msg:Done!');


  // Actually starts the command sequence
  machine.run(function(err, sessionText, hostObj){
    // Possibly cleans up the git output
    sessionText = clearGitSessionText(sessionText);
    // Possibly cleans up the meteor publish output
    sessionText = clearMeteorSessionText(sessionText);

    var result = hostObj.result;
    // Stores the sessionText as the sequence log
    result.log = sessionText;

    if (hostObj.errors.length > 0){
      result.errors = hostObj.errors;
    }
    else {
      result.success = true;
    }

    // Eventually calls the final callback
    callback(null, result);
  });
};
