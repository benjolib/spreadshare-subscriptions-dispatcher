// @flow

import R from 'ramda';
import url from 'url';
import validUrl from 'valid-url';
import type { Column } from '../types';

type Input = {
  content?: string,
  link?: string
};

const parseColumn = (text: ?string): Column => {
  if (text === null || text === undefined || R.isEmpty(text)) {
    return { text: 'NA' };
  }

  if (validUrl.isUri(text)) {
    const parsedUrl = url.parse(text);
    return {
      text: parsedUrl.hostname || text,
      link: text
    };
  }
  return {
    text
  };
};

export const contentParser = (content: ?string): Array<Column> => {
  if (R.isNil(content) || R.isEmpty(content)) {
    return [];
  }
  const contentArray: Array<Input> = JSON.parse(content);
  if (!Array.isArray(contentArray)) {
    return [];
  }

  return contentArray.map(c => {
    const result = parseColumn(c.content);
    if (result.text === 'NA' && R.isNil(result.link)) {
      return parseColumn(c.link);
    }

    if (result.text !== 'NA' && R.isNil(result.link)) {
      return {
        ...result,
        link: validUrl.isUri(c.link)
      };
    }
    return result;
  });
};
