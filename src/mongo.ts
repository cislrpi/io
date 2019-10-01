import mongoose, { Model, Document } from 'mongoose';
import Io from './io';

export class MongoDB {
  public mongoose: mongoose.Mongoose;

  public constructor(io: Io) {
    if (io.config.get('mongo') === true) {
      io.config.set('mongo', {});
    }
    io.config.defaults({
      store: {
        mongo: {
          host: 'localhost',
          port: 27017,
          db: 'cais'
        }
      }
    });

    let conn_string = `mongodb://`;
    conn_string += `${io.config.get('mongo:host')}`;
    conn_string += `:`;
    conn_string += `${io.config.get('mongo:port')}`;
    conn_string += `/`;
    conn_string += `${io.config.get('mongo:db')}`;

    this.mongoose = mongoose;
    const options: mongoose.ConnectionOptions = {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      useUnifiedTopology: true
    };
    if (io.config.get('mongo:user')) {
      options.user = io.config.get('mongo:user');
    }
    if (io.config.get('mongo:pass')) {
      options.pass = io.config.get('mongo:pass');
    }

    this.mongoose.connect(conn_string, options);

    this.mongoose.connection.on('error', (err): void => {
      console.error('MongoDB connection error.');
      console.error(err);
      process.exit(1);
    });
  }

  public model<T extends Document>(name: string, schema: mongoose.Schema): Model<T> {
    return this.mongoose.model(name, schema);
  }

  public disconnect(): Promise<void> {
    return this.mongoose.disconnect();
  }
}
