'use strict';

const Code = require('@hapi/code');
const Hapi = require('@hapi/hapi');
const Lab = require('@hapi/lab');
const ElasticSearch = require('elasticsearch');
const ElasticSearchPlugin = require('../lib/index');

const { it, beforeEach, describe } = exports.lab = Lab.script();
const { expect } = Code;

describe('Plugin client Tests', () => {

    it('should expose client instance by the `es` property', async () => {

        const server = new Hapi.Server();
        await server.register({ plugin: ElasticSearchPlugin, options: {} });

        const plugin = server.plugins['hapi-elastic'];
        expect(plugin.es).to.exist();
    });

    it('should default configuration be localhost & port as 9200', async () => {

        const server = new Hapi.Server();
        await server.register({ plugin: ElasticSearchPlugin, options: {} });

        const config = server.plugins['hapi-elastic'].es.transport._config;
        expect(config.localhost).to.exist();
        expect(config.localhost).to.equal(9200);
    });

    it('should pass all `config` options hash to the client', async () => {

        const server = new Hapi.Server();
        await server.register({ plugin: ElasticSearchPlugin, options: {
            config: {
                apiVersion: '1.7'
            }
        } });

        const config = server.plugins['hapi-elastic'].es.transport._config;
        expect(config.apiVersion).to.equal('1.7');
    });
});

describe('Test handling of Elastic Errors', () => {

    let server;
    beforeEach( async () => {

        server = new Hapi.Server();
        await server.register({ plugin: ElasticSearchPlugin, options: {} });

        //add routes

        //success route
        server.route({ method: 'GET', path: '/query',
            handler() {

                return { success: true };
            }
        });

        //create an error route
        const ErrRoute = function (path, Error) {

            this.method = 'GET';
            this.path = path;
            this.handler = () => {

                throw new Error();
            };
        };

        server.route(new ErrRoute('/not-found', ElasticSearch.errors.NotFound));
        server.route(new ErrRoute('/conflict', ElasticSearch.errors.Conflict));
        server.route(new ErrRoute('/generic', ElasticSearch.errors.Generic));
    });

    it('Test success call', async () => {

        const resp = await server.inject('/query');
        expect(resp.statusCode).to.equal(200);
    });

    it('Not Found(404)', async () => {

        const resp =  await server.inject('/not-found');

        expect(resp.statusCode).to.equal(404);
    });

    it('Conflict(409)', async () => {

        const resp =  await server.inject('/conflict');

        expect(resp.statusCode).to.equal(409);
    });
});
