/**
 * @copyright Copyright 2014 <a href="http://www.extpoint.com">ExtPoint</a>
 * @author <a href="http://koryagin.com">Pavel Koryagin</a>
 * @license MIT
 */

var when = require('when');
var fs = require('fs');
var path = require('path');

/**
 * @class NeatComet.NeatCometServer
 * @extends Joints.Object
 */
var self = Joints.defineClass('NeatComet.NeatCometServer', Joints.Object, {

    /** @type {Object.<string, Object.<string, NeatComet.bindings.BindingServer>>} */
    profileBindings: null,

    /** @type {NeatComet.api.ICometServer} */
    comet: null,

    /** @type {?function} */
    externalDataLoader: null,

    /** @type {NeatComet.router.RouteServer} */
    routeServer: null,

    /**
     * @param {Object} options
     */
    setup: function(options) {

        this.externalDataLoader = options.externalDataLoader || null;

        this._setupBindings(options.configFileName);

        this._setupComet(options.comet);
    },

    _setupComet: function(comet) {

        this.comet = comet;

        // May be absent in case of "Business logic source only"
        if (NeatComet.router) {
            this.routeServer = new NeatComet.router.RouteServer();
            this.routeServer.server = this;
            comet.bindServerEvents(this.routeServer);
        }
    },

    _setupBindings: function(configFileName) {

        // Apply settings
        this.profileBindings = {};

        _.each(NeatComet.configReader.ConfigReader.read(configFileName), function(bindingDefinitions, profile) {

            _.each(bindingDefinitions, function(definition, id) {

                var binding = new NeatComet.bindings.BindingServer(this, profile, id, definition);

                if (!this.profileBindings[profile]) {
                    this.profileBindings[profile] = {};
                }
                this.profileBindings[profile][id] = binding;

            }, this);

        }, this);


        // Init relations
        _.each(this.profileBindings, function(profileBindings) {
            _.each(profileBindings, function(binding) {
                binding.initRelations(profileBindings);
            }, this);
        }, this);

    }

}, {
    // Utils

    /**
     *
     * @param {Object} object
     * @param {Object} filter
     */
    intersectKeys: function(object, filter) {

        var result = {};
        for (var key in filter) {
            if (_.has(filter, key) && _.has(object, key)) {
                result[key] = object[key];
            }
        }

        return result;
    },

    /**
     * Like Underscore pick(), but safe against extended Object's prototype
     * @param {Object} object
     * @param {string[]} filter
     */
    pick: function(object, filter) {

        var result = {};
        for (var key, i = 0; i < filter.length; i++) {
            key = filter[i];
            if (_.has(object, key)) {
                result[key] = object[key];
            }
        }

        return result;
    },

    /**
     * @param {*} x
     * @returns {*}
     */
    cloneRecursive: function(x) {

        var result;

        // Detect type
        if (_.isArray(x)) {
            result = [];
        }
        else if (_.isObject(x)) {
            result = {};
        }
        else {
            return x;
        }

        // Copy
        _.each(x, function(value, key) {
            result[key] = this.cloneRecursive(value);
        }, this);

        return result;
    }
});