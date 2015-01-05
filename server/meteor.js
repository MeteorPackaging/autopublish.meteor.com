/* global publishPackage: true */

// General meteor integration

var sshConnect = Meteor.npmRequire('ssh2-connect');
var sshExec = Meteor.npmRequire('ssh2-exec');

var machine = function() {
  'use strict';

  var execHandlers = [];
  var progressHandlers = [];
  var doneCallback;

  var errorCallback = function(err) {
    // Exit now
    doneCallback(err);
    ssh.end();
  };

  var progressCallback = function(index, cmd) {
    progressHandlers.forEach(function(handler) {
      try {
        handler(index, cmd);
      } catch(err) {
        console.error('Progress callback for machine failed!');
        throw err;
      }
    });
  };

  var runCommand = function(ssh, command, callback) {
    ssh.exec(command.cmd, command.options, function(err, stream) {
      var result = '';

      if (err) {
        callback(err);
      } else {
        stream.on('data', function(data) {
          console.log('STDOUT: ' + data);
          result += data.toString();
        });

        stream.on('error', function(err) {
          callback(err);
        });

        stream.on('end', function() {
          // Remove the trailing newline...
          result = result.replace(/\n$/, '');
          callback(null, result);
        });
      }
    });
  };

  // ssh.end();
  var start = function() {
    sshConnect({
      host: Meteor.settings.host,
      username: Meteor.settings.username,
      privateKey: Meteor.settings.key
    }, function(err, ssh){
      if (err) {
        doneCallback(err);
      } else {
        var next = function() {
          // Get the first command
          var command = execHandlers.shift();
          // Check to make sure we are not done
          if (command) {
            // Update progress
            progressCallback(execHandlers.length, command.cmd);
            // Run the command
            runCommand(ssh, command, function(err, result) {
              if (err) {
                // Run error callbacks
                errorCallback(err);
              } else {
                try {
                  // Run command callback
                  command.f(result);
                  // Next command
                  next();
                } catch(err) {
                  doneCallback(err);
                  ssh.end();
                }
              }
            });
          } else {
            // End this connection
            doneCallback();
            ssh.end();
          }
        };
        // Initial start
        next();
      }
    });
  }; // EO start

  var element = {
    exec: function(cmd, options, callback) {
      // Just check arguments before pushing it to task list
      if (arguments.length === 2) {
        if (typeof options !== 'function') {
          throw new Error('exec expects callback function');
        }
        execHandlers.push({
          cmd: cmd,
          options: {},
          f: options
        });
      } else if (arguments.length === 3) {
        if (typeof callback !== 'function') {
          throw new Error('exec expects callback function');
        }
        execHandlers.push({
          cmd: cmd,
          options: options,
          f: callback
        });
      } else {
        throw new Error('exec expects (cmd, [options], callback)');
      }
      return element;
    },
    progress: function(f) {
      if (typeof f !== 'function') {
        throw new Error('progress expects callback function');
      }
      progressHandlers.push(f);
      return element;
    },
    done: function(f) {
      if (typeof f !== 'undefined' && typeof f !== 'function') {
        throw new Error('done expects callback function');
      }
      doneCallback = f;
      // Start connection
      start();
    }
  };

  return element;
};

publishPackage = function(pkgInfo, callback) {
  'use strict';

  var
    result = {
      log: []
    },
    gitClone =
      "git clone -b "+
      pkgInfo.tagName +
      " " +
      pkgInfo.repoCloneUrl +
      " autopublish"
  ;

  machine()
  // Grap version
  .exec('~/.meteor/meteor --version', function(version) {
    if (version) {
      result.version = version;
    } else {
      throw new Error('Could not run remote meteor');
    }
  })
 .exec('~/.meteor/meteor whoami', function(username) {
    if (username && username.length) {
      result.username = username;
    } else {
      throw new Error('Could not login user on remote');
    }
  })
  .exec('pwd && rm -rf autopublish', function(data) {
    result.log.push(data);
    console.log("- Cloning repository...");
  })
  .exec(gitClone, function(data) {
    result.log.push(data);
    console.log(
      '- Running publish ' +
      pkgInfo.pkgName +
      ' on Meteor@' +
      result.version +
      '...(please wait)'
    );
  })
  .exec('cd autopublish && ~/.meteor/meteor publish', function(data) {
    // XXX: Shold prop catch errors?
    result.log.push(data);
  })
  .exec('pwd && rm -rf autopublish', function() {
    console.log("Remote work done!");
  })
  // .progress(function(index, cmd) {
  //   console.log('Progress:', index, cmd);
  // })
  .done(function(err) {
    if (callback) {
      callback(err, result);
    }
  });
};