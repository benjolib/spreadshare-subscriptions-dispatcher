// @flow

import R from 'ramda';
import { bindCallback, from, of } from 'rxjs';
import { mergeMap, filter, map, tap, catchError } from 'rxjs/operators';
import Summarizer from './summarizer';
import { errorTypes } from './logger';
import type {
  ControllerI,
  SubscriptionDbI,
  StreamDbI,
  StreamDigest,
  Frequency,
  Lambda,
  Context,
  DataSanitizerI
} from './types';

export default class Controller implements ControllerI {
  subsDb: SubscriptionDbI;

  streamDb: StreamDbI;

  sanitizer: DataSanitizerI;

  lambda: Lambda;

  constructor(
    subsDb: SubscriptionDbI,
    streamDb: StreamDbI,
    sanitizer: DataSanitizerI,
    lambda: Lambda
  ) {
    this.subsDb = subsDb;
    this.streamDb = streamDb;
    this.sanitizer = sanitizer;
    this.lambda = lambda;
  }

  dispatchEmails(context: Context, frequency: Frequency): Promise<void> {
    const summarizer = new Summarizer();
    const digest$ = fetchDigets$(context, this.streamDb, frequency);
    const dispatcher$ = emailDispatcher$(context, this.lambda);
    return (
      this.subsDb
        .usersGroupedByStream(context, 'email', frequency)
        .pipe(mergeMap(digest$, valueMerger(frequency)))
        .pipe(tap(content => summarizer.collectDigestSummary(content)))
        .pipe(
          map(content => ({
            ...content,
            digest: this.sanitizer.sanitize(context, content.digest)
          }))
        )
        .pipe(filter(content => !R.isNil(content.digest)))
        // $FlowIgnore
        .pipe(tap(content => summarizer.collectValidDigestSummary(content)))
        .pipe(
          mergeMap(dispatcher$, responseMerger),
          catchError(err => {
            logDispatchError(context, err);
            return of();
          })
        )
        .pipe(tap(content => summarizer.collectDispatchSummary(content)))
        .toPromise()
        .then(logFinalSummary(context, summarizer))
    );
  }
}

const fetchDigets$ = (context, db, frequency) => sub =>
  from(db.fetchDigest(context, sub.streamId, frequency));

const valueMerger = frequency => (sub, stream) => ({
  emails: sub.users.map(u => u.email),
  digest: {
    frequency,
    ...stream
  }
});

const emailDispatcher$ = (context, lambda: Lambda) => content => {
  const lambdaObservable = bindCallback(lambda.invoke);
  logDigest(context, content);
  const payload = {
    context: {
      requestId: context.requestId
    },
    body: content
  };
  return lambdaObservable({
    ...lambda.params(),
    Payload: JSON.stringify(payload)
  });
};

const responseMerger = (stream, res) => ({
  stream,
  res
});

const logDigest = (context, content: StreamDigest) =>
  context.logger.info({
    source: 'controller',
    emails: content.emails,
    streamId: content.digest.id,
    streamName: content.digest.name,
    newPostsCount: content.digest.digest.length,
    posts: content.digest.digest,
    msg: 'Dispatching email event'
  });

const logDispatchError = (context, err: Error) => {
  context.logger.warn({
    source: 'controller',
    type: errorTypes.emailDispatchError,
    msg: err.message,
    stack: err.stack
  });
};

const logFinalSummary = (context, summarizer) => () => {
  context.logger.info({
    source: 'controller',
    msg: 'Finished Job',
    summary: summarizer.summary
  });
};
