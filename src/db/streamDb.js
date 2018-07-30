// @flow

import knex from 'knex';
import moment from 'moment';
import R from 'ramda';
import { contentParser } from '../utils/parser';

import type {
  StreamDbI,
  StreamDbOptions,
  Frequency,
  Stream,
  Context,
  Column
} from '../types';
import { errorTypes } from '../logger';
import type { KnexI } from './types';

const timeUnits: { [Frequency]: string } = {
  daily: 'days',
  weekly: 'weeks',
  monthly: 'months'
};

export default class StreamDb implements StreamDbI {
  knex: KnexI;

  constructor(connectionOptions: StreamDbOptions) {
    this.knex = knex({
      client: 'mysql',
      connection: connectionOptions
    });
  }

  fetchDigest(
    context: Context,
    streamId: string,
    timeWindow: Frequency
  ): Promise<?Stream> {
    const fromTime = pastTime(timeWindow);
    return (
      this.knex
        .select(
          'tableRows.userId',
          'tableRows.content',
          'tableRows.votesCount',
          'tableRows.commentsCount',
          'tableRows.image',
          'tables.title as streamName',
          'tables.slug as streamSlug',
          'user.name as userName',
          'user.image as userImage'
        )
        .from('tableRows')
        .innerJoin('tables', 'tableRows.tableId', 'tables.id')
        .leftJoin('user', 'tableRows.userId', 'user.id')
        .where('tableRows.tableId', streamId)
        .andWhere('tableRows.createdAt', '>=', fromTime)
        // .andWhere('tableRows.createdAt', '=', 1512414995)
        .then(parseData(context, streamId, timeWindow))
    );
  }
}

const parseData = (context, streamId, timeWindow) => (data): ?Stream => {
  if (R.isNil(data) || R.isEmpty(data) || !Array.isArray(data)) {
    logNoUpdate(context, streamId);
    return null;
  }

  const { streamName, streamSlug } = data[0];
  logUpdate(context, streamId, streamName, data.length);
  return {
    frequency: timeWindow,
    id: streamId,
    name: streamName,
    link: streamSlug,
    digest: data.map(d => ({
      columns: parseContent(context, streamId, streamName, d.content),
      votesCount: d.votesCount,
      commentsCount: d.commentsCount,
      imageLink: d.image,
      contributor: {
        name: d.userName,
        imageLink: d.userImage
      }
    }))
  };
};

const pastTime = (timeWindow: Frequency): number =>
  moment()
    .subtract(1, timeUnits[timeWindow])
    .unix();

const parseContent = (
  context,
  streamId,
  streamName,
  content: string
): Array<Column> => {
  try {
    return contentParser(content);
  } catch (ex) {
    logContentParseError(context, streamId, streamName, ex);
    return [];
  }
};

const logNoUpdate = (context, id) =>
  context.logger.debug({
    source: 'streamDb',
    streamId: id,
    msg: 'No update found'
  });

const logUpdate = (context, id, streamName, length) =>
  context.logger.debug({
    source: 'streamDb',
    streamId: id,
    streamName,
    newPostsCount: length,
    msg: 'Updates found'
  });

const logContentParseError = (context, streamId, streamName, error) => {
  context.logger.error({
    source: 'streamDb',
    streamId,
    streamName,
    type: errorTypes.contentParseError,
    msg: error.message,
    stack: error.stack
  });
};
