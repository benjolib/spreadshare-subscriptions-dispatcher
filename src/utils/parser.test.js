import { contentParser } from './parser';

describe('contentParser', () => {
  it('should return empty array if content is null', () => {
    const result = contentParser(null);
    expect(result.length).toEqual(0);
  });

  it('should return empty array if content is undefined', () => {
    const result = contentParser(undefined);
    expect(result.length).toEqual(0);
  });

  it('should return empty array if content is empty', () => {
    const result = contentParser('');
    expect(result.length).toEqual(0);
  });

  it('should throw exception if not a valid json', () => {
    expect(() => contentParser('invalid json')).toThrow();
  });

  it('should return empty array if content json is not array', () => {
    const result = contentParser('{}');
    expect(result.length).toEqual(0);
  });

  it('should return empty array if content json is empty array', () => {
    const result = contentParser('[]');
    expect(result.length).toEqual(0);
  });

  it('should return NA for null, undefined and empty content', () => {
    const result = contentParser(
      '[{"content":"Some Text"},{"content":""},{},{"content":null},{"content":"UK"}]'
    );
    expect(result.length).toEqual(5);
    expect(result[0].text).toEqual('Some Text');
    expect(result[1].text).toEqual('NA');
    expect(result[2].text).toEqual('NA');
    expect(result[3].text).toEqual('NA');
    expect(result[4].text).toEqual('UK');
  });

  it('should return parsed hostname and link for valid content urls', () => {
    const result = contentParser(
      '[{"content":"https://dribbble.com/STUDIOJQ"},{"content":"dribbble.com/STUDIOJQ"}]'
    );
    expect(result.length).toEqual(2);
    expect(result[0].text).toEqual('dribbble.com');
    expect(result[0].link).toEqual('https://dribbble.com/STUDIOJQ');
    expect(result[1].text).toEqual('dribbble.com/STUDIOJQ');
    expect(result[1].link).toBeUndefined();
  });

  it('should not parse link if content is a valid link', () => {
    const result = contentParser(
      '[{"content":"https://dribbble.com/STUDIOJQ", "link":"https://google.com"}]'
    );
    expect(result.length).toEqual(1);
    expect(result[0].text).toEqual('dribbble.com');
    expect(result[0].link).toEqual('https://dribbble.com/STUDIOJQ');
  });

  it('should return link if content is a not a valid link but link is', () => {
    const result = contentParser(
      '[{"content":"dribbble.com/STUDIOJQ", "link":"https://google.com"}, {"content":"", "link":"https://google.com"}]'
    );
    expect(result.length).toEqual(2);
    expect(result[0].text).toEqual('dribbble.com/STUDIOJQ');
    expect(result[0].link).toEqual('https://google.com');
    expect(result[1].text).toEqual('google.com');
    expect(result[1].link).toEqual('https://google.com');
  });

  it('should ignore link if its not valid', () => {
    const result = contentParser(
      '[{"content":"dribbble.com/STUDIOJQ", "link":"google.com"}]'
    );
    expect(result.length).toEqual(1);
    expect(result[0].text).toEqual('dribbble.com/STUDIOJQ');
    expect(result[0].link).toBeUndefined();
  });
});
