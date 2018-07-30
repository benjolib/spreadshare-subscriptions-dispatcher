import R from 'ramda';
import DataSanitizer from './dataSanitizer';

const context = {
  logger: {
    debug: () => {}
  }
};

const stream = {
  name: 'Design Tools',
  link: 'link',
  digest: [
    {
      columns: [
        {
          text: 'column1'
        }
      ],
      votesCount: 0,
      commentsCount: 1,
      imageLink: '/tableImages/2234.png',
      contributor: {
        name: 'PersonName1'
      }
    },
    {
      columns: [
        {
          text: 'column2'
        }
      ],
      votesCount: 10,
      commentsCount: 0,
      imageLink: '',
      contributor: {
        name: 'PersonName2',
        imageLink: 'https://spreadshare.co'
      }
    }
  ]
};

const nameLens = R.lensProp('name');
const linkLens = R.lensProp('link');
const digestLens = R.lensProp('digest');
const firstColumnLens = R.lensPath(['digest', 0, 'columns']);
const secondColumnLens = R.lensPath(['digest', 1, 'columns']);
const firstColumnVotesCountLens = R.lensPath(['digest', 0, 'votesCount']);
const firstColumnCommentsCountLens = R.lensPath(['digest', 0, 'commentsCount']);
const firstColumnImageLens = R.lensPath(['digest', 0, 'imageLink']);
const firstColumnContributorLens = R.lensPath(['digest', 0, 'contributor']);
const firstColumnContributorImageLinkLens = R.lensPath([
  'digest',
  0,
  'contributor',
  'imageLink'
]);

describe('DataSanitizer', () => {
  it('should return null if stream is already null', () => {
    const sanitizer = new DataSanitizer('https://spreadshare.co');
    expect(sanitizer.sanitize(context, null)).toBeNull();
    expect(sanitizer.sanitize(context, undefined)).toBeNull();
  });

  it('should return null if name is missing or empty', () => {
    const sanitizer = new DataSanitizer('https://spreadshare.co');
    expect(sanitizer.sanitize(context, R.set(nameLens, '', stream))).toBeNull();
    expect(
      sanitizer.sanitize(context, R.set(nameLens, null, stream))
    ).toBeNull();
    expect(
      sanitizer.sanitize(context, R.set(nameLens, undefined, stream))
    ).toBeNull();
  });

  it('should sanitize link', () => {
    const sanitizer = new DataSanitizer('https://spreadshare.co');

    let result = sanitizer.sanitize(context, R.set(linkLens, 'link', stream));
    expect(result.link).toEqual('https://spreadshare.co/stream/link');

    result = sanitizer.sanitize(context, R.set(linkLens, '', stream));
    expect(result.link).toEqual('https://spreadshare.co');

    result = sanitizer.sanitize(context, R.set(linkLens, null, stream));
    expect(result.link).toEqual('https://spreadshare.co');

    result = sanitizer.sanitize(context, R.set(linkLens, undefined, stream));
    expect(result.link).toEqual('https://spreadshare.co');
  });

  it('should return null if digest is not an array or empty one', () => {
    const sanitizer = new DataSanitizer('https://spreadshare.co');
    expect(
      sanitizer.sanitize(context, R.set(digestLens, '', stream))
    ).toBeNull();
    expect(
      sanitizer.sanitize(context, R.set(digestLens, null, stream))
    ).toBeNull();
    expect(
      sanitizer.sanitize(context, R.set(digestLens, undefined, stream))
    ).toBeNull();
    expect(
      sanitizer.sanitize(context, R.set(digestLens, [], stream))
    ).toBeNull();
  });

  describe('Columns sanitization', () => {
    it('should remove posts with non array columns', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnLens, 'non array', stream)
      );
      expect(result.digest.length).toEqual(1);
      expect(result.digest[0].columns.length).not.toEqual(0);
    });

    it('should remove posts with null columns', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnLens, null, stream)
      );
      expect(result.digest.length).toEqual(1);
      expect(result.digest[0].columns.length).not.toEqual(0);
    });

    it('should remove posts with empty columns', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnLens, [], stream)
      );

      expect(result.digest.length).toEqual(1);
      expect(result.digest[0].columns.length).not.toEqual(0);
    });
  });

  describe('Counts sanitization', () => {
    it('set votes to 0 if missing', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnVotesCountLens, null, stream)
      );
      expect(result.digest[0].votesCount).toEqual(0);
    });

    it('set commentsCount to 0 if missing', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnCommentsCountLens, null, stream)
      );
      expect(result.digest[0].commentsCount).toEqual(0);
    });
  });

  describe('Post image sanitization', () => {
    it('sanitize post image if partial url is present', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnImageLens, '/tableImages/2234.png', stream)
      );
      expect(result.digest[0].imageLink).toEqual(
        'https://spreadshare.co/tableImages/2234.png'
      );
    });

    it('should keep existing url if valid', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnImageLens, 'https://someurl.co/image.png', stream)
      );
      expect(result.digest[0].imageLink).toEqual(
        'https://someurl.co/image.png'
      );
    });

    it('should return undefined if empty', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnImageLens, '', stream)
      );
      expect(result.digest[0].imageLink).toBeUndefined();
    });

    it('should return undefined if null', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnImageLens, null, stream)
      );
      expect(result.digest[0].imageLink).toBeUndefined();
    });

    it('should return undefined if undefined', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnImageLens, undefined, stream)
      );
      expect(result.digest[0].imageLink).toBeUndefined();
    });
  });

  describe('Filter post with invalid contributor', () => {
    it('should remove posts with missing contributor', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnContributorLens, null, stream)
      );
      expect(result.digest.length).toEqual(1);
      expect(result.digest[0].contributor).not.toBeNull();
    });

    it('should remove posts if contributor name is empty', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnContributorLens, { name: '' }, stream)
      );
      expect(result.digest.length).toEqual(1);
      expect(result.digest[0].contributor.name).toEqual('PersonName2');
    });

    it('should remove posts if contributor name is null', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnContributorLens, { name: null }, stream)
      );
      expect(result.digest.length).toEqual(1);
      expect(result.digest[0].contributor.name).toEqual('PersonName2');
    });

    it('should remove posts if contributor name is undefined', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnContributorLens, { name: undefined }, stream)
      );
      expect(result.digest.length).toEqual(1);
      expect(result.digest[0].contributor.name).toEqual('PersonName2');
    });
  });

  describe('Discard invalid contributor link', () => {
    it('sanitize post image if partial url is present', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(
          firstColumnContributorImageLinkLens,
          '/tableImages/2234.png',
          stream
        )
      );
      expect(result.digest[0].contributor.imageLink).toEqual(
        'https://spreadshare.co/tableImages/2234.png'
      );
    });

    it('should keep existing url if valid', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(
          firstColumnContributorImageLinkLens,
          'https://someurl.co/image.png',
          stream
        )
      );
      expect(result.digest[0].contributor.imageLink).toEqual(
        'https://someurl.co/image.png'
      );
    });

    it('should return undefined if empty', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnContributorImageLinkLens, '', stream)
      );
      expect(result.digest[0].contributor.imageLink).toBeUndefined();
    });

    it('should return undefined if null', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnContributorImageLinkLens, null, stream)
      );
      expect(result.digest[0].contributor.imageLink).toBeUndefined();
    });

    it('should keep undefined if undefined', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const result = sanitizer.sanitize(
        context,
        R.set(firstColumnContributorImageLinkLens, undefined, stream)
      );
      expect(result.digest[0].contributor.imageLink).toBeUndefined();
    });
  });

  describe('Order of filtering', () => {
    it('should return null if posts are filtered owing to conditions', () => {
      const sanitizer = new DataSanitizer('https://spreadshare.co');
      const newStream = R.set(
        secondColumnLens,
        [],
        R.set(firstColumnLens, [], stream)
      );
      const result = sanitizer.sanitize(context, newStream);

      expect(result).toBeNull();
    });
  });

  it('sanitize post image if partial url is present', () => {
    const sanitizer = new DataSanitizer('https://spreadshare.co');
    const result = sanitizer.sanitize(
      context,
      R.set(firstColumnImageLens, '/tableImages/2234.png', stream)
    );
    expect(result.digest[0].imageLink).toEqual(
      'https://spreadshare.co/tableImages/2234.png'
    );
  });
});
