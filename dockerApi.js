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
/*
 * External optimizations
 *
 * - Reuse connections on the client:
 *
 * /etc/ssh_config
 * Host *
 *   ControlMaster auto
 *   ControlPath /tmp/%r@%h:%p
 *   ControlPersist 30m
 *
 * - Don't use dns on the server:
 * /etc/sshd_config
 * UseDNS no
 */

'use strict';

var bunyan = require('bunyan');
var logger = bunyan.createLogger({ name: 'docker-ssh' });
var portscanner = require('portscanner');
var sshCheck = require('nscale-util').sshcheck();

var childProcess = require('child_process');
var filter = require('./filter');
var POLL_INTERVAL = 5000;
var MAX_POLLS = 30;


var parseOutput = function(stdout) {
  var filtered = filter.dropOutside(stdout.toString('utf8'), /^\[\{/, /\]\}/);
  filtered = filtered.replace(/[\r\n]+/gm,'');

  if (filtered.length === 0) {
    filtered = '[]';
  }
  return JSON.parse(filtered);
};



/**
 * preconnect in the case that ssh multiplexing is operative
 */
function preconnect(user, sshKeyPath, ipaddress, cb, pollCount) {
  if (pollCount === undefined) {
    pollCount = 0;
  }

  logger.info({
    user: user,
    identityFile: sshKeyPath,
    ipAddress: ipaddress
  }, 'waiting for connectivity');

  portscanner.checkPortStatus(22, ipaddress, function(err, status) {
    if (status === 'closed') {
      if (pollCount > MAX_POLLS) {
        pollCount = 0;
        cb('timeout exceeded - unable to connect to: ' + ipaddress);
      }
      else {
        pollCount = pollCount + 1;
        setTimeout(function() { preconnect(user, sshKeyPath, ipaddress, cb, pollCount); }, POLL_INTERVAL);
      }
    }
    else if (status === 'open') {
      pollCount = 0;
      sshCheck.check(ipaddress, user, sshKeyPath, null, function(err) {
        cb(err);
      });
    }
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

  logger.debug('images: ' + cmd);
  childProcess.exec(cmd, function(err, stdout, stderr) {
    logger.debug('images err: ' + err);
    logger.debug('images stdout: ' + stdout);
    logger.debug('images stderr: ' + stderr);
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

  logger.debug('containers: ' + cmd);
  childProcess.exec(cmd, function(err, stdout, stderr) {
    logger.debug('containers err: ' + err);
    logger.debug('containers stdout: ' + stdout);
    logger.debug('containers stderr: ' + stderr);
    cb(err, parseOutput(stdout, stderr));
  });
}



function remoteDocker(opts) {
  // TODO remove ubuntu default, raise error I keep it here for backward compatibility
  var user = opts.user || 'ubuntu';
  var identityFile = opts.identityFile;



  function queryImages(ipAddress, cb) {
    if (!ipAddress) { return cb(null, []); }

    preconnect(user, identityFile, ipAddress, function(err) {
      if (err) { return cb(err); }
      images(user, identityFile, ipAddress, function(err, images) {
        cb(err, images);
      });
    });
  }



  function queryContainers(ipAddress, cb) {
    if (!ipAddress) { return cb(null, []); }

    preconnect(user, identityFile, ipAddress, function(err) {
      if (err) { return cb(err); }
      containers(user, identityFile, ipAddress, function(err, containers) {
        cb(err, containers);
      });
    });
  }



  return {
    queryImages: queryImages,
    queryContainers: queryContainers
  };
}

module.exports = remoteDocker;

