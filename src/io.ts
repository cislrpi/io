import {Provider} from 'nconf';
import {v1 as uuid} from 'uuid';

import { RabbitMQ } from './rabbitmq';
import { Redis } from './redis';
import { MongoDB } from './mongo';

const pluginFunctions: Function[] = [];

/**
 * Class representing the Io object.
 */
class Io {
  public config: Provider;
  public mongo?: MongoDB;
  public rabbit?: RabbitMQ;
  public mq?: RabbitMQ;
  public redis?: Redis;
  public store?: Redis;

  public plugins: {[key: string]: Plugin} = {};

  /**
   * Create the Io object, and establish connections to the central message broker and store
   * @param  {string|object} [config] - string pointing to a file to use or an object containing settings
   *                  to override the default loaded file
   */
  public constructor() {
    this.config = new Provider();
    this.config.argv().file({ file: 'cog.json' }).env('_');

    if (this.config.get('mongo')) {
      this.mongo = new MongoDB(this);
    }

    if (this.config.get('mq') && !this.config.get('rabbit')) {
      this.config.set('rabbit', this.config.get('mq'));
    }

    if (this.config.get('rabbit')) {
      this.rabbit = new RabbitMQ(this);
      this.mq = this.rabbit;
    }

    if (this.config.get('store') && !this.config.get('redis')) {
      this.config.get('store');
    }

    if (this.config.get('redis')) {
      this.redis = new Redis(this);
      this.store = this.redis;
    }

    for (const pluginFunction of pluginFunctions) {
      pluginFunction(this);
    }
  }

  public registerPlugins(...registerFunctions: Function[]): void {
    for (const registerFunction of registerFunctions) {
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
