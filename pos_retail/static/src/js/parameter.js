odoo.define('pos_retail.parameter', function (require) {
    "use strict";

    var core = require('web.core');
    var ParameterDB = core.Class.extend({
        limit: 100,
        init: function (options) {
            this.cache = {};
            if (options.databases && options.database) {
                this.save(options.database, options.databases)
            }
            if (options.uid) {
                this.save('uid', options.uid)
            }
            if (options.database) {
                this.save('uid', options.database)
            }
            if (options.uid) {
                this.save('uid', options.uid)
            }
            if (options.name) {
                this.save('name', options.name)
            }
        },
        save: function (store, data) {
            localStorage[store] = JSON.stringify(data);
            this.cache[store] = data;
        },
        load: function (store) {
            var data = localStorage[store];
            if (data !== undefined && data !== "") {
                data = JSON.parse(data);
                this.cache[store] = data;
                return data;
            } else {
                return null;
            }
        }
    });
    return ParameterDB;
});
