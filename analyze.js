#!/usr/bin/env node
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


var fs = require('fs');
var configFile = process.argv[2];
var systemFile = process.argv[2];
var analyze = require('./');
var config;
var system;

if (!configFile || !systemFile) {
  console.log('Missing config or system');
  process.exit(-1);
}

config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
system = JSON.parse(fs.readFileSync(systemFile, 'utf8'));

console.log('Analyzing...');
analyze.analyze(config, system, function(err, status) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  console.log(JSON.stringify(status, null, 2));
  process.exit(0);
});

