import { createHash } from 'crypto';
import Io from './io';
import { IoOptions } from './types';

const instances: {[key: string]: Io} = {};

const emptyHash = createHash('md5').update('').digest('hex');

function io(options?: IoOptions): Io {
  const hash = createHash('md5').update(JSON.stringify(options || '')).digest('hex');
  if (instances[hash]) {
    return instances[hash];
  }

  instances[hash] = new Io(options);
  if (!instances[emptyHash]) {
    instances[emptyHash] = instances[hash];
  }
  return instances[hash];
}

export = io;
