//Load Modules

var Hoek = require('hoek');
var Boom = require('boom');
var ElasticSearch = require('elasticsearch');

// Declare internals
var internals = {
    defaults: {
        config: {
            localhost:9200
        }
    }
};
module.exports = {
    register: function (plugin, options) {
        var settings = Hoek.applyToDefaults(internals.defaults, options);
        plugin.log(['hapi-elastic'], 'Hapi Elastic plugin registration started.');
        plugin.expose('es', new ElasticSearch.Client(settings.config));
    
        plugin.ext('onPostHandler', (request, h) => {
    
            var response = request.response;
            if (response instanceof ElasticSearch.errors._Abstract) {
                throw Boom.create(response.status, response.message, response);
            } else {
                return h.continue;
            }
        });
    
        plugin.log(['hapi-elastic'], 'Hapi Elastic plugin registration ended.');
    },
    pkg: require('../package.json')
}
