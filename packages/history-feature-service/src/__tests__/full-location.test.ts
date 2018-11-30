import {Location} from 'history';
import {createFullLocationTransformer} from '../full-location';

describe('#createFullLocationTransformer', () => {
  describe('#createFullLocation', () => {
    describe('without a primary', () => {
      it('joins all consumer locations together as a single encoded query param', () => {
        const locationTransformer = createFullLocationTransformer({
          consumerPathsQueryParamName: '---'
        });

        let fullLocation = locationTransformer.createFullLocation(
          {
            pathname: '/foo',
            search: '',
            hash: '',
            state: {}
          },
          {
            pathname: '/',
            search: '',
            hash: '',
            state: {}
          },
          'test:1'
        );

        fullLocation = locationTransformer.createFullLocation(
          {
            pathname: '/bar',
            search: 'baz=1',
            hash: '',
            state: {}
          },
          fullLocation as Location,
          'test:2'
        );

        expect(fullLocation).toMatchObject({
          pathname: '/',
          search:
            '---=%7B%22test%3A1%22%3A%22%2Ffoo%22%2C%22test%3A2%22%3A%22%2Fbar%3Fbaz%3D1%22%7D'
        });
      });

      it('removes undefined consumer locations from the query parameter', () => {
        const locationTransformer = createFullLocationTransformer({
          consumerPathsQueryParamName: '---'
        });

        let fullLocation = locationTransformer.createFullLocation(
          {
            pathname: '/foo',
            search: '',
            hash: '',
            state: {}
          },
          {
            pathname: '/',
            search: '',
            hash: '',
            state: {}
          },
          'test:1'
        );

        fullLocation = locationTransformer.createFullLocation(
          undefined,
          fullLocation as Location,
          'test:1'
        );

        expect(fullLocation).toMatchObject({
          pathname: '/',
          search: ''
        });
      });
    });

    describe('with only a primary', () => {
      it('puts the location pathname and query params directly to the full location', () => {
        const locationTransformer = createFullLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        const fullLocation = locationTransformer.createFullLocation(
          {
            pathname: '/foo',
            search: 'bar=1&baz=2',
            hash: '',
            state: {}
          },
          {
            pathname: '/',
            search: '',
            hash: '',
            state: {}
          },
          'test:pri'
        );

        expect(fullLocation).toMatchObject({
          pathname: '/foo',
          search: 'bar=1&baz=2'
        });
      });

      it('removes undefined consumer locations from the query parameter', () => {
        const locationTransformer = createFullLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        let fullLocation = locationTransformer.createFullLocation(
          {
            pathname: '/foo',
            search: '',
            hash: '',
            state: {}
          },
          {
            pathname: '/',
            search: '',
            hash: '',
            state: {}
          },
          'test:pri'
        );

        fullLocation = locationTransformer.createFullLocation(
          undefined,
          fullLocation as Location,
          'test:pri'
        );

        expect(fullLocation).toMatchObject({
          pathname: '/',
          search: ''
        });
      });
    });

    describe('with the primary and two other consumers', () => {
      it('takes the pathname and query params of the primary consumer directly, and the pathname and query params of the other consumers encoded as a single query param, into the full location', () => {
        const locationTransformer = createFullLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        let fullLocation = locationTransformer.createFullLocation(
          {
            pathname: '/foo',
            search: 'bar=1',
            hash: '',
            state: {}
          },
          {
            pathname: '/',
            search: '',
            hash: '',
            state: {}
          },
          'test:pri'
        );

        fullLocation = locationTransformer.createFullLocation(
          {
            pathname: '/baz',
            search: 'qux=3',
            hash: '',
            state: {}
          },
          fullLocation as Location,
          'test:1'
        );

        fullLocation = locationTransformer.createFullLocation(
          {
            pathname: '/some',
            search: 'thing=else',
            hash: '',
            state: {}
          },
          fullLocation as Location,
          'test:2'
        );

        fullLocation = locationTransformer.createFullLocation(
          {
            pathname: '/foo',
            search: 'bar=2',
            hash: '',
            state: {}
          },
          fullLocation as Location,
          'test:pri'
        );

        expect(fullLocation).toMatchObject({
          pathname: '/foo',
          search:
            'bar=2&---=%7B%22test%3A1%22%3A%22%2Fbaz%3Fqux%3D3%22%2C%22test%3A2%22%3A%22%2Fsome%3Fthing%3Delse%22%7D'
        });
      });
    });
  });

  describe('#getConsumerPathFromFullLocation', () => {
    describe('with consumers encoded into the query parameter', () => {
      it('returns the consumer-specific locations', () => {
        const locationTransformer = createFullLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        const fullLocation = {
          pathname: '/foo',
          search: 'bar=1&---=%7B%22test%3A1%22%3A%22%2Fbaz%3Fqux%3D3%22%7D',
          hash: '',
          state: {}
        };

        expect(
          locationTransformer.getConsumerPathFromFullLocation(
            fullLocation,
            'test:pri'
          )
        ).toEqual('/foo?bar=1');

        expect(
          locationTransformer.getConsumerPathFromFullLocation(
            fullLocation,
            'test:1'
          )
        ).toEqual('/baz?qux=3');

        expect(
          locationTransformer.getConsumerPathFromFullLocation(
            fullLocation,
            'test:2'
          )
        ).toBeUndefined();
      });
    });

    describe('without consumers encoded into the query parameter', () => {
      it('returns undefined for a non-primary consumer', () => {
        const locationTransformer = createFullLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        const fullLocation = {
          pathname: '/foo',
          search: 'bar=1',
          hash: '',
          state: {}
        };

        expect(
          locationTransformer.getConsumerPathFromFullLocation(
            fullLocation,
            'test:2'
          )
        ).toBeUndefined();
      });
    });
  });
});
