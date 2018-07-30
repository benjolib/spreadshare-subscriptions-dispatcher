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
  StreamSubscriptions,
  Context
} from '../types';

export default class SubscriptionDb implements SubscriptionDbI {
  db: DynamoDb<SubscriptionDbModel>;

  tableName: string;

  constructor(tableName: string, dynamoDb: DynamoDb<SubscriptionDbModel>) {
    this.tableName = tableName;
    this.db = dynamoDb;
  }

  usersGroupedByStream(
    context: Context,
    channel: Channel,
    frequency: Frequency
  ): Observable<StreamSubscriptions> {
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
  IndexName: 'channel-frequency-stream-index',
  ProjectionExpression: 'userId, email, streamId',
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
  let currentStream = {
    streamId: '',
    users: []
  };

  const callback = (err, data) => {
    if (err) {
      observer.error(err);
      return;
    }

    data.Items.map(extractSubMeta).forEach(sub => {
      if (sub.streamId === currentStream.streamId) {
        currentStream.users.push(sub.userInfo);
      } else {
        if (!R.isEmpty(currentStream.streamId)) {
          logStream(context, currentStream);
          observer.next(currentStream);
        }
        currentStream = {
          streamId: sub.streamId,
          users: [sub.userInfo]
        };
      }
    });

    if (R.isNil(data.LastEvaluatedKey)) {
      if (!R.isEmpty(currentStream.streamId)) {
        logStream(context, currentStream);
        observer.next(currentStream);
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
  streamId: sub.streamId,
  userInfo: {
    userId: sub.userId,
    email: sub.email
  }
});

const logStream = (context, stream) =>
  context.logger.debug({
    source: 'subscriptionDb',
    streamId: stream.streamId,
    subscribedUsersCount: stream.users.length
  });

const logDone = context =>
  context.logger.debug({
    source: 'subscriptionDb',
    msg: 'Finished fetching subscriptions'
  });
