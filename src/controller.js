// @flow

import R from 'ramda';
import { bindCallback, from } from 'rxjs';
import { flatMap, filter } from 'rxjs/operators';
import logger from './logger';
import type {
  ControllerI,
  SubscriptionDbI,
  PublicationDbI,
  PublicationDigestInfo,
  Frequency,
  Lambda,
  Context
} from './types';

export default class Controller implements ControllerI {
  subsDb: SubscriptionDbI;

  pubsDb: PublicationDbI;

  lambda: Lambda;

  constructor(subsDb: SubscriptionDbI, pubsDb: PublicationDbI, lambda: Lambda) {
    this.subsDb = subsDb;
    this.pubsDb = pubsDb;
    this.lambda = lambda;
  }

  dispatchEmails(context: Context, frequency: Frequency): Promise<void> {
    return this.subsDb
      .usersGroupedByPub(context, 'email', frequency)
      .pipe(
        fetchDigest(context, this.pubsDb, frequency),
        filterNil,
        invokeEmailDispatcher(context, this.lambda)
      )
      .toPromise();
  }
}

const fetchDigest = (context, db: PublicationDbI, frequency: Frequency) =>
  flatMap(fetchDigets$(context, db, frequency), valueMerger(frequency));

const fetchDigets$ = (context, db, frequency) => sub =>
  from(db.fetchDigest(context, sub.publicationId, frequency));

const valueMerger = frequency => (sub, pub) => ({
  emails: sub.users.map(u => u.email),
  digest: {
    frequency,
    publication: pub
  }
});

const filterNil = filter(pub => !R.isNil(pub.digest.publication));

const invokeEmailDispatcher = (context, lambda: Lambda) =>
  flatMap(digest => {
    const lambdaObservable = bindCallback(lambda.invoke);
    logDigest(context, digest);
    return lambdaObservable({
      ...lambda.params(),
      Payload: {
        body: JSON.stringify(digest, null, 2)
      }
    });
  });

const logDigest = (context, digest: PublicationDigestInfo) =>
  logger.info({
    requestId: context.requestId,
    frequency: digest.digest.frequency,
    source: 'controller',
    emails: digest.emails,
    publicationId: digest.digest.publication.id,
    publicationTitle: digest.digest.publication.title,
    newPostsCount: digest.digest.publication.posts.length,
    posts: digest.digest.publication.posts,
    msg: 'Dispatching email event'
  });
