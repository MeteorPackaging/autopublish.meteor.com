/* global publishPackage: true */

// General meteor integration

var sshConnect = Meteor.npmRequire('ssh2-connect');

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
      var
        result = '',
        stderr = ''
      ;

      if (err) {
        callback(err);
      } else {
        stream.on('data', function(data) {
          //console.log('STDOUT: ' + data);
          result += data.toString();
        });

        stream.stderr.on('data', function(data) {
          //console.log('STDERR: ' + data);
          stderr += data.toString();
        });

        stream.on('error', function(err) {
          //console.log('error: ' + err);
          callback(err, result, stderr);
        });

        stream.on('end', function() {
          // Removes the trailing newline...
          result = result.replace(/\n$/, '');
          stderr = stderr.replace(/\n$/, '');
          callback(null, result, stderr);
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
            runCommand(ssh, command, function(err, result, stderr) {
              if (err) {
                // Run error callbacks
                errorCallback(err);
              } else {
                try {
                  // Run command callback
                  command.f(result, stderr);
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
      log: [],
      errors: [],
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
      result.meteorVersion = version;
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
    if (data.length) {
      result.log.push(data);
    }
    console.log("- Cloning repository...");
  })
  .exec(gitClone, function(data) {
    if (data.length) {
      result.log.push(data);
    }
    console.log(
      '- Running publish ' +
      pkgInfo.pkgName +
      ' on Meteor@' +
      result.meteorVersion +
      '...(please wait)'
    );
  })
  .exec('cd autopublish && ~/.meteor/meteor publish', function(data, stderr) {
    // XXX: Shold prop catch errors?
    // data = 'Published packaging:autopublish-test@0.0.9.' after success
    // stderr = '=> Errors while publishing:\n\nWhile creating package version:\nerror: Version already exists'
    // after unsuccessful publish


    /*
    => Errors while publishing:

    While publishing the package:
    error: There is no package named packaging:autopublish-fake-test. If you are
    creating a new package, use the --create flag.
    */


    if (/Published/.test(data)) {
      // Successfully published!
      var ver = data.split('@');
      result.success = true;
      result.version = ver[1].replace(/.$/, '');
    } else if (/Version already exists/.test(stderr)) {
      // Not published, version already existed!
      result.success = false;
      result.errors.push("Version already exists");
    } else if (/There is no package named/.test(stderr)) {
      // Not published, first time publishing!
      // XXX: should trigger a `meteor publish --create` command
    } else if (!data && stderr) {
      // Not published, some other error!
      result.success = false;
      result.errors.push(stderr);
    }

    console.log("After Meteor Publish:");
    console.log("data:");
    console.log(data);
    console.log("stderr:");
    console.log(stderr);

    if (data.length) {
      result.log.push(data);
    }
  })
  .exec('pwd && rm -rf autopublish', function() {
    console.log("Remote work done!");
  })
  // .progress(function(index, cmd) {
  //   console.log('Progress:', index, cmd);
  // })
  .done(function(err) {
    if (!result.log.length){
      delete result.log;
    }
    if (!result.errors.length){
      delete result.errors;
    }
    callback(err, result);
  });
};
