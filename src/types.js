// @flow
import type { Observable } from 'rxjs';

export type Channel = 'email' | 'rss';
export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface ControllerI {
  dispatchEmails(context: Context, frequency: Frequency): Promise<void>;
}

export interface SubscriptionDbI {
  usersGroupedByStream(
    context: Context,
    channel: Channel,
    frequency: Frequency
  ): Observable<StreamSubscriptions>;
}

export interface StreamDbI {
  fetchDigest(
    context: Context,
    streamId: string,
    timeWindow: Frequency
  ): Promise<?Stream>;
}

export interface DataSanitizerI {
  sanitize(context: Context, stream: Stream): ?Stream;
}

export interface SummarizerI {
  collectDigestSummary(content: StreamDigest): void;
  collectValidDigestSummary(content: StreamDigest): void;
  collectDispatchSummary(content: {
    stream: StreamDigest,
    res: Array<mixed>
  }): void;
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

export type StreamDigest = {
  emails: Array<string>,
  digest: Stream
};

export type Stream = {
  +frequency: Frequency,
  +name: string,
  +link: string,
  +id: string,
  +digest: Array<Post>
};

type Post = {
  columns: Array<Column>,
  votesCount: number,
  commentsCount: number,
  imageLink?: string,
  contributor: Person
};

export type Column = {
  text: string,
  link?: string
};

type Person = {
  name: string,
  imageLink?: string
};

export type Subscription = {
  +userId: string,
  +email: string,
  +streamId: string,
  +frequency: Frequency
};

type UserInfo = {
  +userId: string,
  +email: string
};

export type StreamSubscriptions = {
  +streamId: string,
  +users: Array<UserInfo>
};

export type StreamDbOptions = {
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
