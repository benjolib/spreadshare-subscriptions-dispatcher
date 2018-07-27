// @flow
import type { Observable } from 'rxjs';

export type Channel = 'email' | 'rss';
export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface ControllerI {
  dispatchEmails(context: Context, frequency: Frequency): Promise<void>;
}

export interface SubscriptionDbI {
  usersGroupedByPub(
    context: Context,
    channel: Channel,
    frequency: Frequency
  ): Observable<PublicationSubscriptions>;
}

export interface PublicationDbI {
  fetchDigest(
    context: Context,
    publicationId: string,
    timeWindow: Frequency
  ): Promise<?Publication>;
}

export interface LoggerI {
  debug(any): void;
  info(any): void;
  warn(any): void;
  error(any): void;
}

export type Context = {
  requestId: string,
  logger: LoggerI
};

export type PublicationDigestInfo = {
  emails: Array<string>,
  digest: PublicationDigest
};

export type PublicationDigest = {
  frequency: Frequency,
  publication: Publication
};

export type Publication = {
  +title: string,
  +tagline: string,
  +id: string,
  +posts: Array<Post>
};

type Post = {
  content: Array<any>,
  votesCount: number,
  commentsCount: number,
  imageLink: string,
  contributorInfo: ContributorInfo
};

type ContributorInfo = {
  name: string,
  imageLink: string
};

export type Subscription = {
  +userId: string,
  +email: string,
  +publicationId: string,
  +frequency: Frequency
};

type UserInfo = {
  +userId: string,
  +email: string
};

export type PublicationSubscriptions = {
  +publicationId: string,
  +users: Array<UserInfo>
};

export type PublicationDbOptions = {
  host: string,
  user: string,
  password: string,
  database: string
};

type Event = {
  type: Frequency
};

type AwsContext = {
  awsRequestId: string
};

export type Handler = (event: Event, context: AwsContext) => Promise<void>;

type LambdaParams = {
  FunctionName: string,
  InvocationType: 'Event'
};

type LambdaParamsWithPayload = LambdaParams & {
  Payload: string
};

type LambdaRes = {
  Payload: string
};

type LambdaCallback = (?Error, ?LambdaRes) => void;

export interface Lambda {
  params(): LambdaParams;
  invoke(LambdaParamsWithPayload, LambdaCallback): void;
}
