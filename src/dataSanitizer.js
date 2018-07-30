// @flow
import R from 'ramda';
import validUrl from 'valid-url';
import type { DataSanitizerI, Stream, Context } from './types';

export default class DataSanitizer implements DataSanitizerI {
  baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  sanitize(context: Context, stream: Stream): ?Stream {
    const sanitizers = [
      mandatoryNameCheck,
      sanitizeStreamLink(this.baseUrl),
      mandatoryDigestCheck,
      filterEmptyPost,
      filterPostWithInvalidContributor,
      sanitizeCounts,
      sanitizePostImage(this.baseUrl),
      sanitizeContributorImageLink(this.baseUrl),
      mandatoryDigestCheck
    ];
    const result = R.reduce((s, sn) => sn(s), stream, sanitizers);
    logTransormation(context, stream, result);
    return result;
  }
}

type Sanitizer = (?Stream) => ?Stream;

const mandatoryNameCheck: Sanitizer = stream => {
  if (stream === null || stream === undefined) {
    return null;
  }
  return nilOrEmpty(stream.name) ? null : stream;
};

const sanitizeStreamLink = (baseUrl: string): Sanitizer => stream => {
  if (stream === null || stream === undefined) {
    return null;
  }
  return {
    ...stream,
    link: stream.link ? `${baseUrl}/stream/${stream.link}` : baseUrl
  };
};

const mandatoryDigestCheck: Sanitizer = stream => {
  if (stream === null || stream === undefined) {
    return null;
  }
  return nonEmptyArray(stream.digest) ? stream : null;
};

const filterEmptyPost: Sanitizer = stream => {
  if (stream === null || stream === undefined) {
    return null;
  }

  const { digest } = stream;
  return {
    ...stream,
    digest: digest.filter(d => nonEmptyArray(d.columns))
  };
};

const sanitizeCounts: Sanitizer = stream => {
  if (stream === null || stream === undefined) {
    return null;
  }

  const { digest } = stream;
  return {
    ...stream,
    digest: digest.map(d => ({
      ...d,
      votesCount: R.defaultTo(0, d.votesCount),
      commentsCount: R.defaultTo(0, d.commentsCount)
    }))
  };
};

const sanitizePostImage = (baseUrl: string): Sanitizer => stream => {
  if (stream === null || stream === undefined) {
    return null;
  }

  const { digest } = stream;
  return {
    ...stream,
    digest: digest.map(d => ({
      ...d,
      imageLink: sanitizeImageLink(baseUrl, d.imageLink)
    }))
  };
};

const filterPostWithInvalidContributor: Sanitizer = stream => {
  if (stream === null || stream === undefined) {
    return null;
  }
  const { digest } = stream;
  return {
    ...stream,
    digest: digest.filter(d => R.path(['contributor', 'name'], d))
  };
};

const sanitizeContributorImageLink = (baseUrl: string): Sanitizer => stream => {
  if (stream === null || stream === undefined) {
    return null;
  }

  const { digest } = stream;
  const lens = R.lensPath(['contributor', 'imageLink']);
  return {
    ...stream,
    digest: digest.map(d =>
      R.set(lens, sanitizeImageLink(baseUrl, d.contributor.imageLink), d)
    )
  };
};

const sanitizeImageLink = (baseUrl: string, link: ?string): ?string => {
  if (validUrl.isUri(link)) {
    return link;
  }

  return link ? `${baseUrl}${link}` : undefined;
};

const nonEmptyArray = (obj: any): boolean =>
  Array.isArray(obj) && obj.length > 0;

const nilOrEmpty = (value: string): boolean =>
  R.isNil(value) || R.isEmpty(value);

const logTransormation = (context, input, output) => {
  context.logger.debug({
    source: 'dataSanitizer',
    streamName: input ? input.name : null,
    input,
    output
  });
};
