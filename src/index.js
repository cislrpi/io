const fs = require('fs');
const path = require('path');
const nconf = require('nconf');
const uuid = require('uuid/v1');

/**
 * Class representing the CelIO object.
 */
class CelIO {
  /**
   * Create the CelIO object, and establish connections to the central message broker and store
   * @param  {string|object} [config] - string pointing to a file to use or an object containing settings
   *                  to override the default loaded file
   */
  constructor(config) {
    let configFile = 'cog.json';
    if (config) {
      if (typeof config === 'object') {
        nconf.override(config);
      }
      else {
        configFile = config;
      }
    }
    nconf.argv().file({ file: configFile }).env('_');
    this.config = nconf;

    let preinstalled = [
      './rabbitmq'
    ];

    if (__dirname.lastIndexOf('node_modules') > -1) {
      let substring = __dirname.substring(0, __dirname.lastIndexOf('node_modules'));
      let package_json = JSON.parse(fs.readFileSync(path.join(substring, 'package.json')));
      let dependencies = Object.keys(package_json['dependencies'] || {}).concat(Object.keys(package_json['devDependencies'] || {}));
      dependencies = dependencies.concat(preinstalled);
      const pattern = /^(@.*\/)?celio-.+/;
      for (let dependency of dependencies) {
        if (pattern.test(dependency) && require.resolve(dependency)) {
          let loaded = require(dependency);
          if (nconf.get(loaded.config)) {
            this[loaded.variable] = new loaded.Class(this.config);
          }
        }
      }
    }
  }

  /**
   * Generate UUID.
   * @returns {string} The unique ID.
   */
  generateUUID() {
    return uuid();
  }
}

module.exports = CelIO;
