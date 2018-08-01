// @flow
import type { SummarizerI, StreamDigest } from './types';

type StreamSummary = {
  id?: string,
  name?: string,
  subscribersCount?: number,
  newPostsCount?: number,
  validPostsCount?: number
};

type Summary = {
  frequency?: string,
  totalEmailsSent?: number,
  totalEmailFailures?: number,
  failedFor: Array<string>,
  details: { [id: string]: StreamSummary }
};

export default class Summarizer implements SummarizerI {
  summary: Summary;

  constructor() {
    this.summary = {
      totalEmailFailures: 0,
      totalEmailsSent: 0,
      failedFor: [],
      details: {}
    };
  }

  collectDigestSummary(content: StreamDigest): void {
    const { digest } = content;
    if (digest && digest.digest) {
      this.summary.frequency = content.digest.frequency;
      let currentEntry = this.summary.details[digest.id];
      if (!currentEntry) {
        currentEntry = {
          id: digest.id,
          name: digest.name,
          subscribersCount: content.emails.length,
          newPostsCount: digest.digest.length
        };
        this.summary.details[digest.id] = currentEntry;
      }
    }
  }

  collectValidDigestSummary(content: StreamDigest): void {
    const { digest } = content;
    if (digest) {
      const currentEntry = this.summary.details[digest.id];
      if (currentEntry) {
        this.summary.details[digest.id] = {
          ...currentEntry,
          validPostsCount: digest.digest.length
        };
      }
    }
  }

  collectDispatchSummary({
    res,
    stream
  }: {
    stream: StreamDigest,
    res: Array<mixed>
  }): void {
    const { digest, emails } = stream;
    if (digest) {
      if (!res[0]) {
        this.summary = {
          ...this.summary,
          totalEmailsSent: this.summary.totalEmailsSent + emails.length
        };
      } else {
        this.summary = {
          ...this.summary,
          totalEmailFailures: this.summary.totalEmailFailures + emails.length,
          failedFor: [...this.summary.failedFor, digest.id]
        };
      }
    }
  }
}
