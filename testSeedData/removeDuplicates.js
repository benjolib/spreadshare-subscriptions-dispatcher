'use strict';

const fs = require('fs');
const R = require('ramda');

const rawdata = fs.readFileSync('./testSeedData/subscriptions.json');
const subscriptions = JSON.parse(rawdata);

const uniq = R.uniqWith(
  (sub1, sub2) =>
    sub1.userId === sub2.userId && sub1.channelId === sub2.channelId
);

console.log();
const uniqValues = uniq(subscriptions);
fs.writeFileSync(
  './testSeedData/subscriptions.json',
  JSON.stringify(uniqValues, null, 2)
);
