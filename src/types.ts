import { Cog, CogLoaderOptions } from '@cisl/cog-loader';
import { ConsumeMessage } from 'amqplib';

import { RedisOptions } from 'ioredis';
export { RedisOptions } from 'ioredis';

export interface MongoOptions {
  host: string;
  port: number;
  db: string;
  user?: string;
  pass?: string;
}

// eslint-disable-next-line
export interface IoOptions extends CogLoaderOptions {}

export interface IoCog extends Cog {
  mq?: boolean | RabbitOptions;
  rabbit?: boolean | RabbitOptions;
  mongo?: boolean | MongoOptions;
  redis?: boolean | RedisOptions;
  store?: boolean | RedisOptions;

  [key: string]: unknown;
}

export interface RabbitResponse {
  content: Buffer | string | number | object;
  message: ConsumeMessage;
}

export interface RabbitOptions {
  url?: string;
  port?: number;
  hostname?: string;
  username?: string;
  password?: string;
  exchange?: string;
  vhost?: string;
  prefix?: string;
  ssl?: boolean;
  cert?: string;
  key?: string;
  ca?: string;
  passphrase?: string;
}
