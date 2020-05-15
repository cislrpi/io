import { v1 as uuid } from 'uuid';
import loadCogFile from '@cisl/cog-loader';

import { IoCog, IoOptions } from './types';
import Rabbit from './rabbitmq';
import Redis from './redis';
import Mongo from './mongo';
import Config from './config';

const pluginFunctions: Function[] = [];

/**
 * Class representing the Io object.
 */
class Io {
  public config: Config;
  public mongo?: Mongo;
  public rabbit?: Rabbit;
  public mq?: Rabbit;
  public redis?: Redis;
  public store?: Redis;

  public plugins: {[key: string]: Plugin} = {};

  /**
   * Create the Io object, and establish connections to the central message broker and store
   * @param  {string|object} [config] - string pointing to a file to use or an object containing settings
   *                  to override the default loaded file
   */
  public constructor(options?: IoOptions) {
    this.config = new Config((loadCogFile(options) as IoCog));

    if (this.config.has('mongo')) {
      this.mongo = new Mongo(this);
    }

    if (this.config.has('rabbit')) {
      this.rabbit = new Rabbit(this);
      this.mq = this.rabbit;
    }

    if (this.config.has('redis')) {
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
  public generateUuid(): string {
    return uuid();
  }
}

export = Io;
