const mongoose = require('mongoose');

class MongoDB {
  constructor(celio) {
    celio.config.defaults({
      'mongo': {
        'host': 'localhost',
        'port': 27017,
        'dbname': 'cais'
      }
    });

    let conn_string = `mongodb://`;
    conn_string += `${celio.config.get('mongo:host')}`;
    conn_string += `:`;
    conn_string += `${celio.config.get('mongo:port')}`;
    conn_string += `/`;
    conn_string += `${celio.config.get('mongo:dbname')}`;

    this.mongoose = mongoose;
    let options = {
      useNewUrlParser: true
    };
    if (celio.config.get('mongo:user')) {
      options.user = celio.config.get('mongo:user');
    }
    if (celio.config.get('mongo:pass')) {
      options.pass = celio.config.get('mongo:pass');
    }

    this.mongoose.connect(conn_string, options);

    this.mongoose.connection.on('error', function(err) {
      console.error('MongoDB connection error.');
      console.error(err);
      process.exit();
    });
  }
}

module.exports = {
  config: 'mongo',
  Class: MongoDB
};
