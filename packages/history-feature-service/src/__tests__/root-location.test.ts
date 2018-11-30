import {Location} from 'history';
import {createRootLocationTransformer} from '../root-location';

describe('#createRootLocationTransformer', () => {
  describe('#createRootLocation', () => {
    describe('without a primary', () => {
      it('joins all consumer locations together as a single encoded query param', () => {
        const locationTransformer = createRootLocationTransformer({
          consumerPathsQueryParamName: '---'
        });

        let rootLocation = locationTransformer.createRootLocation(
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

        rootLocation = locationTransformer.createRootLocation(
          {
            pathname: '/bar',
            search: 'baz=1',
            hash: '',
            state: {}
          },
          rootLocation as Location,
          'test:2'
        );

        expect(rootLocation).toMatchObject({
          pathname: '/',
          search:
            '---=%7B%22test%3A1%22%3A%22%2Ffoo%22%2C%22test%3A2%22%3A%22%2Fbar%3Fbaz%3D1%22%7D'
        });
      });

      it('removes undefined consumer locations from the query parameter', () => {
        const locationTransformer = createRootLocationTransformer({
          consumerPathsQueryParamName: '---'
        });

        let rootLocation = locationTransformer.createRootLocation(
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

        rootLocation = locationTransformer.createRootLocation(
          undefined,
          rootLocation as Location,
          'test:1'
        );

        expect(rootLocation).toMatchObject({
          pathname: '/',
          search: ''
        });
      });
    });

    describe('with only a primary', () => {
      it('puts the location pathname and query params directly to the root location', () => {
        const locationTransformer = createRootLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        const rootLocation = locationTransformer.createRootLocation(
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

        expect(rootLocation).toMatchObject({
          pathname: '/foo',
          search: 'bar=1&baz=2'
        });
      });

      it('removes undefined consumer locations from the query parameter', () => {
        const locationTransformer = createRootLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        let rootLocation = locationTransformer.createRootLocation(
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

        rootLocation = locationTransformer.createRootLocation(
          undefined,
          rootLocation as Location,
          'test:pri'
        );

        expect(rootLocation).toMatchObject({
          pathname: '/',
          search: ''
        });
      });
    });

    describe('with the primary and two other consumers', () => {
      it('takes the pathname and query params of the primary consumer directly, and the pathname and query params of the other consumers encoded as a single query param, into the root location', () => {
        const locationTransformer = createRootLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        let rootLocation = locationTransformer.createRootLocation(
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

        rootLocation = locationTransformer.createRootLocation(
          {
            pathname: '/baz',
            search: 'qux=3',
            hash: '',
            state: {}
          },
          rootLocation as Location,
          'test:1'
        );

        rootLocation = locationTransformer.createRootLocation(
          {
            pathname: '/some',
            search: 'thing=else',
            hash: '',
            state: {}
          },
          rootLocation as Location,
          'test:2'
        );

        rootLocation = locationTransformer.createRootLocation(
          {
            pathname: '/foo',
            search: 'bar=2',
            hash: '',
            state: {}
          },
          rootLocation as Location,
          'test:pri'
        );

        expect(rootLocation).toMatchObject({
          pathname: '/foo',
          search:
            'bar=2&---=%7B%22test%3A1%22%3A%22%2Fbaz%3Fqux%3D3%22%2C%22test%3A2%22%3A%22%2Fsome%3Fthing%3Delse%22%7D'
        });
      });
    });
  });

  describe('#getConsumerPathFromRootLocation', () => {
    describe('with consumers encoded into the query parameter', () => {
      it('returns the consumer-specific locations', () => {
        const locationTransformer = createRootLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        const rootLocation = {
          pathname: '/foo',
          search: 'bar=1&---=%7B%22test%3A1%22%3A%22%2Fbaz%3Fqux%3D3%22%7D',
          hash: '',
          state: {}
        };

        expect(
          locationTransformer.getConsumerPathFromRootLocation(
            rootLocation,
            'test:pri'
          )
        ).toEqual('/foo?bar=1');

        expect(
          locationTransformer.getConsumerPathFromRootLocation(
            rootLocation,
            'test:1'
          )
        ).toEqual('/baz?qux=3');

        expect(
          locationTransformer.getConsumerPathFromRootLocation(
            rootLocation,
            'test:2'
          )
        ).toBeUndefined();
      });
    });

    describe('without consumers encoded into the query parameter', () => {
      it('returns undefined for a non-primary consumer', () => {
        const locationTransformer = createRootLocationTransformer({
          consumerPathsQueryParamName: '---',
          primaryConsumerId: 'test:pri'
        });

        const rootLocation = {
          pathname: '/foo',
          search: 'bar=1',
          hash: '',
          state: {}
        };

        expect(
          locationTransformer.getConsumerPathFromRootLocation(
            rootLocation,
            'test:2'
          )
        ).toBeUndefined();
      });
    });
  });
});
