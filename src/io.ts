import { v1 as uuid } from 'uuid';
import loadCogFile from '@cisl/cog-loader';

import { IoCog, IoOptions } from './types';
import Rabbit from './rabbit';
import Redis from './redis';
import Mongo from './mongo';
import Config from './config';

const pluginFunctions: ((io: Io) => void)[] = [];

/**
 * Class representing the Io object.
 *
 * Note, we must export this as a regular class to allow for module
 * augmentation in plugins.
 */
export class Io {
  public config: Config;
  public mongo?: Mongo;
  public rabbit?: Rabbit;
  public redis?: Redis;

  public plugins: {[key: string]: Plugin} = {};

  /**
   * Create the Io object, and establish connections to the central message broker and store
   * @param  {string|object} [config] - string pointing to a file to use or an object containing settings
   *                  to override the default loaded file
   */
  public constructor(options?: IoOptions) {
    this.config = new Config((loadCogFile(options) as IoCog));

    if (this.config.hasValue('mongo')) {
      this.mongo = new Mongo(this);
    }

    if (this.config.hasValue('rabbit')) {
      this.rabbit = new Rabbit(this);
    }

    if (this.config.hasValue('redis')) {
      this.redis = new Redis(this);
    }

    for (const pluginFunction of pluginFunctions) {
      pluginFunction(this);
    }
  }

  /**
   * Generate UUIDv1.
   * @returns {string} The unique ID.
   */
  public generateUuid(): string {
    return uuid();
  }
}

export function registerPlugins(...registerFunctions: ((io: Io) => void)[]): void {
  pluginFunctions.push(...registerFunctions);
}

export default Io;
