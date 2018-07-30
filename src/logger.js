// @flow
import pino from 'pino';
import pkg from '../package.json';
import type { LoggerI } from './types';

const { version } = pkg;

export default class Logger implements LoggerI {
  frequency: string;

  requestId: string;

  pino: any;

  constructor(frequency: string, requestId: string) {
    this.frequency = frequency;
    this.requestId = requestId;
    this.pino = pino({
      level: process.env.LOG_LEVEL || 'debug'
    });
  }

  debug(obj: any): void {
    this.pino.debug({
      version,
      frequency: this.frequency,
      requestId: this.requestId,
      ...obj
    });
  }

  info(obj: any): void {
    this.pino.info({
      version,
      frequency: this.frequency,
      requestId: this.requestId,
      ...obj
    });
  }

  warn(obj: any): void {
    this.pino.warn({
      version,
      frequency: this.frequency,
      requestId: this.requestId,
      ...obj
    });
  }

  error(obj: any): void {
    this.pino.error({
      version,
      frequency: this.frequency,
      requestId: this.requestId,
      ...obj
    });
  }
}

export const errorTypes = {
  unhandledError: 'UnhandledError',
  contentParseError: 'ContentParseError',
  emailDispatchError: 'EmailDispatchError'
};
