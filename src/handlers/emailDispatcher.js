// @flow

import uuidv4 from 'uuid/v4';
import to from 'await-to-js';
import controller from './factory';
import logger from '../logger';
import type { Handler } from '../types';

export const handler: Handler = async event => {
  const frequency = event.type;
  const context = {
    requestId: uuidv4()
  };
  logEntry(context, frequency);
  const [err, result] = await to(controller.dispatchEmails(context, frequency));
  if (err != null) {
    logError(context, frequency, err);
    return;
  }
  logExit(context, frequency);
};

const logEntry = (context, frequency) =>
  logger.info({
    requestId: context.requestId,
    frequency,
    source: 'emailDispatcher',
    msg: 'starting subscription digest email dispatcher job'
  });

const logExit = (context, frequency) =>
  logger.info({
    requestId: context.requestId,
    frequency,
    source: 'emailDispatcher',
    msg: 'finished subscription digest email dispatcher job'
  });

const logError = (context, frequency, err) =>
  logger.error({
    requestId: context.requestId,
    frequency,
    source: 'emailDispatcher',
    type: 'error',
    msg: err.message,
    stack: err.stack
  });
