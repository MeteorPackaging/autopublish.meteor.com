'use strict';
/* global
    AutoPublish: false
*/

var cleanCR = function(buffer) {
  var tmp = buffer.replace(/\r.*\r/gm, "\r");
  while (tmp !== buffer) {
    buffer = tmp;
    tmp = buffer.replace(/\r.*\r/gm, "\r");
  }
  return buffer;
};

AutoPublish.find().forEach(function(action){
  var oldLog = action.log;
  if (oldLog) {
    console.dir(
      "Stripping old log about " +
      action.pkgName +
      "completed at " +
      action.completedAt
    );
    var newLog = cleanCR(oldLog);
    AutoPublish.update(action._id, {$set: {log: newLog}});
  }
});
