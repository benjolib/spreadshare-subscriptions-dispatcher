// @flow

import AWS from 'aws-sdk';
import Controller from '../controller';
import SubscriptionTable from '../db/subscriptionDb';
import StreamDb from '../db/streamDb';
import DataSanitizer from '../dataSanitizer';

const tableName = process.env.TABLE_NAME || 'spreadshare-subscriptions-dev';
const mySqlHost = process.env.MYSQL_HOST || '127.0.0.1';
const mySqlPort = process.env.MYSQL_PORT || 3307;
const mySqlDb = process.env.MYSQL_DB || 'spreadshare';
const mySqlUsername = process.env.MYSQL_USERNAME || 'spreadshare';
const mySqlPassword = process.env.MYSQL_PASSWORD || 'spreadshare';
const emailDispatcherFunction =
  process.env.EMAIL_DISPATCHER_FUNCTION ||
  'email-dispatcher-dev-subscriptionDigest';
const baseUrl = process.env.BASE_URL || 'https://staging.spreadshare.co';

let dynamoDbOptions = {};
const mySqlOptions = {
  host: mySqlHost,
  port: mySqlPort,
  user: mySqlUsername,
  password: mySqlPassword,
  database: mySqlDb
};

const lambda = new AWS.Lambda();

const lambdaWrapper = {
  params: () => ({
    FunctionName: emailDispatcherFunction,
    InvocationType: 'Event'
  }),
  invoke: (params, callback) => {
    lambda.invoke(params, callback);
  }
};

// connect to local DB and fake lambda if running offline
if (process.env.IS_OFFLINE || process.env.STEP_IS_OFFLINE) {
  dynamoDbOptions = {
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  };

  lambdaWrapper.invoke = (params, callback) => {
    console.log('mailSent with: ');
    console.log(params);
    callback(null, {
      Payload: 'fake payload'
    });
  };
}

const dynamoClient = new AWS.DynamoDB.DocumentClient(dynamoDbOptions);
const dynamoDb = new SubscriptionTable(tableName, dynamoClient);
const sanitizer = new DataSanitizer(baseUrl);

const streamDb = new StreamDb(mySqlOptions);

export default new Controller(dynamoDb, streamDb, sanitizer, lambdaWrapper);
