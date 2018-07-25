// @flow

import AWS from 'aws-sdk';
import Controller from '../controller';
import SubscriptionTable from '../db/subscriptionDb';
import PublicationDb from '../db/publicationDb';

let dynamoDbOptions = {};
const mySqlOptions = {
  host: '127.0.0.1',
  port: 3307,
  user: 'spreadshare',
  password: 'spreadshare',
  database: 'spreadshare'
};

const lambda = new AWS.Lambda();

const lambdaWrapper = {
  params: () => ({
    FunctionName: 'email-dispatcher-stage-subscriptionDigest',
    InvocationType: 'Event'
  }),
  invoke: (params, callback) => {
    lambda.invoke(params, callback);
  }
};

// connect to local DB if running offline
if (process.env.IS_OFFLINE) {
  dynamoDbOptions = {
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  };

  lambdaWrapper.invoke = (params, callback) => {
    console.log('mailSent for');
    callback(null, {
      Payload: 'fake payload'
    });
  };
}

const tableName = process.env.TABLE_NAME || 'spreadshare-subscriptions-dev';

const dynamoClient = new AWS.DynamoDB.DocumentClient(dynamoDbOptions);
const dynamoDb = new SubscriptionTable(tableName, dynamoClient);

const publicationDb = new PublicationDb(mySqlOptions);

export default new Controller(dynamoDb, publicationDb, lambdaWrapper);
