// @flow

export interface KnexI {}

type DynamoDbParams = {
  TableName: string,
  IndexName: string,
  ProjectionExpression: string,
  KeyConditionExpression: string,
  ExpressionAttributeValues: any,
  Limit: number
};

type DynamoDbDoc<T> = {
  Items: Array<T>,
  LastEvaluatedKey?: any
};

export type DynamoDbQueryCallback<T> = (Error, DynamoDbDoc<T>) => void;

export type Channel = 'email' | 'rss';
export type Frequency = 'daily' | 'weekly' | 'monthly';

export type SubscriptionDbModel = {
  +userId: string,
  +email: string,
  +publicationId: string,
  +frequency: Frequency,
  +channel: Channel,
  +createdAt?: number,
  +updatedAt?: number,
  +channelId: string
};

export interface DynamoDb<T> {
  query(DynamoDbParams, DynamoDbQueryCallback<T>): DynamoDbQueryCallback<T>;
}
