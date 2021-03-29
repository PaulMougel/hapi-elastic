'use strict';

//Load Modules

const Hoek = require('@hapi/hoek');
const Boom = require('@hapi/boom');
const ElasticSearch = require('elasticsearch');

// Declare internals
const internals = {
    defaults: {
        config: {
            localhost: 9200
        }
    }
};
module.exports = {
    register: (plugin, options) => {

        const settings = Hoek.applyToDefaults(internals.defaults, options);
        plugin.log(['hapi-elastic'], 'Hapi Elastic plugin registration started.');
        plugin.expose('es', new ElasticSearch.Client(settings.config));

        plugin.ext('onPreResponse', (req, h) => {

            const response = req.response;
            if (response instanceof ElasticSearch.errors._Abstract) {
                throw new Boom.Boom(response.message, { statusCode: response.status, data: response });
            }
            else {
                return h.continue;
            }
        });

        plugin.log(['hapi-elastic'], 'Hapi Elastic plugin registration ended.');
    },
    pkg: require('../package.json')
};
