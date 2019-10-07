import { v1 as uuid } from 'uuid';

import { readFileSync, existsSync } from 'fs';

import { Rabbit, RabbitOptions } from './rabbitmq';
import { Redis, RedisOptions } from './redis';
import { Mongo, MongoOptions } from './mongo';

const pluginFunctions: Function[] = [];

export interface Config {
  mq: boolean | RabbitOptions;
  rabbit: boolean | RabbitOptions;
  mongo: boolean | MongoOptions;
  redis: boolean | RedisOptions;
  store: boolean | RedisOptions;

  [key: string]: unknown;
}
/**
 * Class representing the Io object.
 */
export class Io {
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
  public constructor() {
    if (!existsSync('cog.json')) {
      console.error('Fatal Error: Could not parse cog.json file');
      process.exit(1);
    }

    this.config = JSON.parse(readFileSync('cog.json', {encoding: 'utf-8'}));

    if (this.config.mongo) {
      this.mongo = new Mongo(this);
    }

    if (this.config.mq && !this.config.rabbit) {
      this.config.rabbit = this.config.mq;
    }

    if (this.config.rabbit) {
      this.rabbit = new Rabbit(this);
      this.mq = this.rabbit;
    }

    if (this.config.store && !this.config.redis) {
      this.config.redis = this.config.store;
    }

    if (this.config.redis) {
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
