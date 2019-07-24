import {Provider} from 'nconf';
import {v1 as uuid} from 'uuid';

import { RabbitMQ } from './rabbitmq';
import { Redis } from './redis';
import { MongoDB } from './mongo';

let pluginFunctions: Function[] = [];

/**
 * Class representing the Io object.
 */
class Io {
  public config: Provider;
  public mq?: RabbitMQ;
  public store?: Redis;
  public mongo?: MongoDB;

  public plugins: {[key: string]: Plugin} = {};

  /**
   * Create the Io object, and establish connections to the central message broker and store
   * @param  {string|object} [config] - string pointing to a file to use or an object containing settings
   *                  to override the default loaded file
   */
  public constructor() {
    let configFile = 'cog.json';
    this.config = new Provider();
    this.config.argv().file({ file: configFile }).env('_');

    if (this.config.get('mq')) {
      this.mq = new RabbitMQ(this);
    }

    if (this.config.get('mongo')) {
      this.mongo = new MongoDB(this);
    }

    if (this.config.get('store')) {
      this.store = new Redis(this);
    }

    for (let pluginFunction of pluginFunctions) {
      pluginFunction(this);
    }
  }

  public registerPlugins(...registerFunctions: Function[]): void {
    for (let registerFunction of registerFunctions) {
      registerFunction(this);
    }
    pluginFunctions.concat(registerFunctions);
  }

  /**
   * Generate UUIDv1.
   * @returns {string} The unique ID.
   */
  public generateUUID(): string {
    return uuid();
  }
}

export = Io;
