// @flow

import knex from 'knex';
import moment from 'moment';
import R from 'ramda';
import logger from '../logger';
import type {
  PublicationDbI,
  PublicationDbOptions,
  Frequency,
  Publication,
  Context
} from '../types';
import type { KnexI } from './types';

const timeUnits: { [Frequency]: string } = {
  daily: 'days',
  weekly: 'weeks',
  monthly: 'months'
};

export default class PublicationDb implements PublicationDbI {
  knex: KnexI;

  constructor(connectionOptions: PublicationDbOptions) {
    this.knex = knex({
      client: 'mysql',
      connection: connectionOptions
    });
  }

  fetchDigest(
    context: Context,
    publicationId: string,
    timeWindow: Frequency
  ): Promise<Publication> {
    const fromTime = pastTime(timeWindow);
    return this.knex
      .select(
        'tableRows.userId',
        'tableRows.content',
        'tableRows.votesCount',
        'tableRows.commentsCount',
        'tableRows.image',
        'tableRows.lineNumber',
        'tables.title as pubTitle',
        'tables.tagline as pubTagline',
        'user.name as userName',
        'user.image as userImage'
      )
      .from('tableRows')
      .innerJoin('tables', 'tableRows.tableId', 'tables.id')
      .innerJoin('user', 'tableRows.userId', 'user.id')
      .where('tableRows.tableId', publicationId)
      .andWhere('tableRows.createdAt', '>=', fromTime)
      .then(parseData(context, publicationId, timeWindow));
  }
}

const parseData = (context, publicationId, timeWindow) => (
  data
): ?Publication => {
  if (R.isNil(data) || R.isEmpty(data) || !Array.isArray(data)) {
    logNoUpdate(context, publicationId, timeWindow);
    return null;
  }

  const { pubTitle, pubTagline } = data[0];
  logUpdate(context, publicationId, pubTitle, timeWindow, data.length);
  return {
    id: publicationId,
    title: pubTitle,
    tagline: pubTagline,
    posts: data.map(d => ({
      content: d.content,
      votesCount: d.votesCount,
      commentsCount: d.commentsCount,
      imageLink: d.image,
      contributorInfo: {
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

const logNoUpdate = (context, id, timeWindow) =>
  logger.debug({
    requestId: context.requestId,
    frequency: timeWindow,
    source: 'publicationDb',
    publicationId: id,
    msg: 'No update found'
  });

const logUpdate = (context, id, pubTitle, timeWindow, length) =>
  logger.debug({
    requestId: context.requestId,
    frequency: timeWindow,
    source: 'publicationDb',
    publicationId: id,
    publicationTitle: pubTitle,
    newPostsCount: length,
    msg: 'Updates found'
  });
