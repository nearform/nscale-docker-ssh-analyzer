/*
 * THIS SOFTWARE IS PROVIDED ``AS IS'' AND ANY EXPRESSED OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY DIRECT,
 * INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
 * STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING
 * IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

'use strict';

var childProcess = require('child_process');
var filter = require('./filter');

var parseOutput = function(stdout/*, stderr*/) {
  var filtered = filter.dropOutside(stdout.toString('utf8'), /^\[\{/, /\]\}/);
  filtered = filtered.replace(/[\r\n]+/gm,'');

  if (filtered.length === 0) {
    filtered = '[]';
  }
  return JSON.parse(filtered);
};

function setUp(user, keyPath, ipAddress, cb) {
  var cmd = [
    'sh',
    __dirname + '/scripts/pipe.sh',
    user,
    keyPath,
    ipAddress
  ].join(' ');

  childProcess.exec(cmd, function(err/*, stdout, stderr*/) {
    cb(err);
  });
}

/**
 * get images, note the script implementing this uses http/1.0 to prevent chunked encoding
 */
function images(user, keyPath, ipAddress, cb) {
  var cmd = [
    'sh',
    __dirname + '/scripts/getImages.sh',
    user,
    keyPath,
    ipAddress
  ].join(' ');

  childProcess.exec(cmd, function(err, stdout, stderr) {
    cb(err, parseOutput(stdout, stderr));
  });
}

/**
 * get containers, note the script implementing this uses http/1.0 to prevent chunked encoding
 */
function containers(user, keyPath, ipAddress, cb) {
  var cmd = [
    'sh',
    __dirname + '/scripts/getContainers.sh',
    user,
    keyPath,
    ipAddress
  ].join(' ');

  childProcess.exec(cmd, function(err, stdout, stderr) {
    cb(err, parseOutput(stdout, stderr));
  });
}

function remoteDocker(opts) {
  // TODO remove ubuntu default, raise error
  // I keep it here for backward compatibility
  var user = opts.user || 'ubuntu';
  var identityFile = opts.identityFile;

  function queryImages(ipAddress, cb) {
    setUp(user, identityFile, ipAddress, function(err) {
      if (err) {
        return cb(err);
      }
    });
    setTimeout(function() {
      images(user, identityFile, ipAddress, cb);
    }, 2000);
  };

  function queryContainers(ipAddress, cb) {
    setUp(user, identityFile, ipAddress, function(err) {
      if (err) {
        return cb(err);
      }
    });
    setTimeout(function() {
      containers(user, identityFile, ipAddress, function(err, containers) {
        cb(err, containers);
      });
    }, 2000);
  };

  return {
    queryImages: queryImages,
    queryContainers: queryContainers
  }
}

module.exports = remoteDocker;