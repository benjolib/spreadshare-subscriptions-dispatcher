// @flow

import to from 'await-to-js';
import controller from './factory';
import Logger, { errorTypes } from '../logger';
import type { Handler } from '../types';

export const handler: Handler = async (event, awsContext) => {
  const requestId = awsContext.awsRequestId;
  const frequency = event.type;
  const logger = new Logger(frequency, requestId);
  const context = {
    requestId,
    logger
  };

  logEntry(logger);
  const [err, result] = await to(controller.dispatchEmails(context, frequency));
  if (err != null) {
    logError(logger, err);
    return;
  }
  logExit(logger);
};

const logEntry = logger =>
  logger.info({
    source: 'emailDispatcher',
    msg: 'starting subscription digest email dispatcher job'
  });

const logExit = logger =>
  logger.info({
    source: 'emailDispatcher',
    msg: 'finished subscription digest email dispatcher job'
  });

const logError = (logger, err: Error) =>
  logger.error({
    source: 'emailDispatcher',
    type: errorTypes.unhandledError,
    msg: err.message,
    stack: err.stack
  });
