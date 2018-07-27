// @flow

import { Observable } from 'rxjs';
import R from 'ramda';
import type {
  DynamoDb,
  SubscriptionDbModel,
  DynamoDbQueryCallback
} from './types';
import type {
  SubscriptionDbI,
  Frequency,
  Channel,
  PublicationSubscriptions,
  Context
} from '../types';

export default class SubscriptionDb implements SubscriptionDbI {
  db: DynamoDb<SubscriptionDbModel>;

  tableName: string;

  constructor(tableName: string, dynamoDb: DynamoDb<SubscriptionDbModel>) {
    this.tableName = tableName;
    this.db = dynamoDb;
  }

  usersGroupedByPub(
    context: Context,
    channel: Channel,
    frequency: Frequency
  ): Observable<PublicationSubscriptions> {
    return Observable.create(observer => {
      const params = queryParams(this.tableName, channel, frequency);
      const callback = callbackFactory(context, this.db, observer, params);
      this.db.query(params, callback);
    });
  }
}

const queryParams = (
  tableName: string,
  channel: Channel,
  frequency: Frequency
) => ({
  TableName: tableName,
  IndexName: 'channel-frequency-publication-index',
  ProjectionExpression: 'userId, email, publicationId',
  KeyConditionExpression: 'channelFrequency = :channelFrequency',
  ExpressionAttributeValues: {
    ':channelFrequency': `${channel}:${frequency}`
  },
  Limit: 100
});

const callbackFactory = (
  context,
  db,
  observer,
  params
): DynamoDbQueryCallback<SubscriptionDbModel> => {
  let currentPub = {
    publicationId: '',
    users: []
  };

  const callback = (err, data) => {
    if (err) {
      observer.error(err);
      return;
    }

    data.Items.map(extractSubMeta).forEach(sub => {
      if (sub.publicationId === currentPub.publicationId) {
        currentPub.users.push(sub.userInfo);
      } else {
        if (!R.isEmpty(currentPub.publicationId)) {
          logPub(context, currentPub);
          observer.next(currentPub);
        }
        currentPub = {
          publicationId: sub.publicationId,
          users: [sub.userInfo]
        };
      }
    });

    if (R.isNil(data.LastEvaluatedKey)) {
      if (!R.isEmpty(currentPub.publicationId)) {
        logPub(context, currentPub);
        observer.next(currentPub);
      }
      logDone(context);
      observer.complete();
      return;
    }

    // Fetch more items
    db.query(
      {
        ...params,
        ExclusiveStartKey: data.LastEvaluatedKey
      },
      callback
    );
  };
  return callback;
};

const extractSubMeta = sub => ({
  publicationId: sub.publicationId,
  userInfo: {
    userId: sub.userId,
    email: sub.email
  }
});

const logPub = (context, pub) =>
  context.logger.debug({
    source: 'subscriptionDb',
    pubId: pub.publicationId,
    subscribedUsersCount: pub.users.length
  });

const logDone = context =>
  context.logger.debug({
    source: 'subscriptionDb',
    msg: 'Finished fetching subscriptions'
  });
