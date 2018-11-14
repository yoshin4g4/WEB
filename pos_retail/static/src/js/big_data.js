odoo.define('pos_retail.big_data', function (require) {
    var models = require('point_of_sale.models');
    var core = require('web.core');
    var _t = core._t;
    var rpc = require('pos.rpc');
    var ParameterDB = require('pos_retail.parameter');
    var ParameterDB = require('pos_retail.parameter');
    var session = require('web.session');
    var change = require('pos_retail.pos_chanel');

    var _super_PosModel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        initialize: function (session, attributes) {
            this.init_db(session);
            this.write_date = '';
            this.database = {};
            this.next_load = 2000;
            this.model_lock = [];
            this.model_unlock = [];
            this.model_ids = session['model_ids'];
            for (var i = 0; i < this.models.length; i++) {
                var current_model = this.models[i];
                if (current_model.model && this.model_ids[current_model.model]) {
                    current_model['max_id'] = this.model_ids[current_model.model]['max_id'];
                    current_model['min_id'] = this.model_ids[current_model.model]['min_id'];
                    this.model_lock = _.filter(this.model_lock, function (model_check) {
                        return model_check['model'] != current_model.model;
                    });
                    this.model_lock.push(current_model);

                } else {
                    this.model_unlock.push(current_model)
                }
            }
            this.models = this.model_unlock;
            this.stock_datas = session.stock_datas;
            this.ParameterDB = new ParameterDB({});
            var config_id = this.ParameterDB.load(session.db + '_config_id');
            if (config_id) {
                var config_model = _.find(this.models, function (model) {
                    return model.model && model.model == "pos.config"
                })
                config_model.domain = [['id', '=', config_id]];
                this.config_id = config_id;
            }
            this.bus_logs = session.bus_logs;
            this.session = session;
            if (this.server_version == 10) {
                var currency_model = _.find(this.models, function (model) {
                    return model.model && model.model == "res.currency"
                });
                currency_model.ids = function (self) {
                    return [session.currency_id]
                }
            }
            this.first_indexdb = false;
            return _super_PosModel.initialize.apply(this, arguments);
        },
        init_db: function (session) {
            var def = new $.Deferred();
            var self = this;
            if (!window.indexedDB) {
                window.alert("Your browser doesn't support a stable version of IndexedDB. Or you open browse with mode Incognito")
            }
            window.indexedDB = window.indexedDB || window.mozIndexedDB ||
                window.webkitIndexedDB || window.msIndexedDB;
            window.IDBTransaction = window.IDBTransaction ||
                window.webkitIDBTransaction || window.msIDBTransaction;
            window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange ||
                window.msIDBKeyRange
            var request = window.indexedDB.open(session.db, 1);
            request.onerror = function (event) {
                console.log("error: ");
                def.reject();
            };
            request.onsuccess = function (event) {
                var indexedDB = request.result;
                self.indexedDB = indexedDB;
                self.read();
                def.resolve();
            };
            request.onupgradeneeded = function (event) {
                var indexedDB = event.target.result;
                self.indexedDB = indexedDB;
                self.first_indexdb = true;
                for (var i = 0; i < self.model_lock.length; i++) {
                    var model = self.model_lock[i];
                    try {
                        indexedDB.createObjectStore(model.model, {
                            autoIncrement: true,
                            keyPath: model.model,
                        })
                    } catch (e) {
                        cosole.log(e);
                    }

                }
                def.resolve();
            };
            return def;
        },
        read: function () {
            var self = this;
            for (var i = 0; i < this.model_lock.length; i++) {
                var model = this.model_lock[i];
                if (model.model) {
                    var objectStore = this.indexedDB.transaction(model.model).objectStore(model.model);
                    objectStore.openCursor().onsuccess = function (event) {
                        var cursor = event.target.result;
                        if (cursor) {
                            var value = cursor.value;
                            var model = event.target.source.name;
                            self.database[model] = value;
                            cursor.continue();
                        }
                    }
                }
            }
        },
        save_parameter_models_load: function () {
            var models = {};
            for (var number in this.model_lock) {
                var model = this.model_lock[number];
                models[model['model']] = {
                    fields: model['fields'] || [],
                    domain: model['domain'] || [],
                    context: model['context'] || [],
                };
                if (model['model'] == 'res.partner' || model['model'] == 'product.pricelist.item' || model['model'] == 'product.pricelist') {
                    models[model['model']]['domain'] = []
                }
                if (model['model'] == 'product.pricelist.item') {
                    models[model['model']]['domain'] = []
                }
            }
            rpc.query({
                model: 'pos.cache.database',
                method: 'save_parameter_models_load',
                args:
                    [models]
            })
        },
        auto_refresh_caches: function () {
            for (var n = 0; n < this.model_lock.length; n++) {
                var model_name = this.model_lock[n].model;
                var self = this;
                try {
                    var transaction = this.indexedDB.transaction([model_name], "readwrite");
                    transaction.objectStore(model_name).openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                            var model = cursor.source.name;
                            var new_caches = self.database[model];
                            if (model == 'product.product' && self.version.server_version_info[0] == 10) {
                                for (var i=0; i < new_caches.length; i++) {
                                    if (typeof new_caches[i]['product_tmpl_id'] === "number") {
                                        new_caches[i]['product_tmpl_id'] = [new_caches[i]['product_tmpl_id'], new_caches[i]['display_name']]
                                    }
                                }
                            }
                            if (new_caches) {
                                var transaction = self.indexedDB.transaction([model], 'readwrite');
                                var request = transaction.objectStore(model);
                                cursor.delete();
                                request.add(new_caches);
                                cursor.continue();
                            }
                        }
                    };
                } catch (e) {
                    console.log(e);
                }
            }
        },
        update_caches_from_backend: function () { // need check changes of backend when pos sessions offline mode
            var self = this;
            console.log('last updated date: ' + this.write_date);
            return rpc.query({
                model: 'pos.cache.database',
                method: 'get_datas_updated',
                args: [this.write_date],
            }).then(function (datas) {
                if (datas.length) {
                    console.log('total need update : ' + datas.length)
                    for (var i = 0; i < datas.length; i++) {
                        self.sync_backend.sync_with_backend(datas[i]);
                    }
                    self.trigger('reload:screen_partners');
                    self.trigger('reload:screen_products');
                }
            }).fail(function (type, error) {
                console.log(error);
            });
        },
        first_install: function (model_name) {
            var loaded = new $.Deferred();
            var model = _.find(this.model_lock, function (model) {
                return model.model == model_name;
            });
            if (!model) {
                return loaded.resolve();
            }
            var self = this;
            var tmp = {};
            var fields = model.fields;

            function load_data(min_id, max_id) {
                var domain = [['id', '>=', min_id], ['id', '<', max_id]];
                var context = {}
                context['retail'] = true;
                if (model['model'] == 'product.product') {
                    domain.push(['available_in_pos', '=', true]);
                    var price_id = null;
                    if (self.pricelist) {
                        price_id = self.pricelist.id;
                    }
                    var stock_location_id = null;
                    if (self.config.stock_location_id) {
                        stock_location_id = self.config.stock_location_id[0]
                    }
                    context['location'] = stock_location_id;
                    context['pricelist'] = price_id;
                    context['display_default_code'] = false;
                }
                var params = {
                    model: model.model,
                    domain: domain,
                    fields: fields,
                    context: context,
                };
                return session.rpc('/web/dataset/search_read', params, {}).then(function (results) {
                    var results = results['records'] || [];
                    if (!self.database) {
                        self.database = {};
                    }
                    if (!self.database[model['model']]) {
                        self.database[model['model']] = [];
                    }
                    self.database[model['model']] = self.database[model['model']].concat(results);
                    min_id += self.next_load;
                    max_id += self.next_load;
                    if (results.length > 0) {
                        var process = min_id / model['max_id'];
                        if (process > 1) {
                            process = 1
                        }
                        self.chrome.loading_message(_t('Only one time installing: ') + model['model'] + ': ' + (process * 100).toFixed(2) + ' %', process);
                        if (!self.database[model.model]) {
                            self.database[model.model] = results;
                        } else {
                            self.database[model.model] = self.database[model.model].concat(results);
                        }
                        load_data(min_id, max_id);
                        return $.when(model.loaded(self, results, tmp)).then(function () {
                        }, function (err) {
                            loaded.reject(err);
                        })
                    } else {
                        if (max_id < model['max_id']) {
                            load_data(min_id, max_id);
                        } else {
                            loaded.resolve();
                        }
                    }
                }).fail(function (type, error) {
                    self.chrome.loading_message(_t('Install fail, please try-again'));
                });
            }

            load_data(model['min_id'], model['min_id'] + this.next_load);
            return loaded;
        },
        load_datas: function (database) {
            this.chrome.loading_message(_t('Please waiting, restore datas'));
            this.database = database;
            var pricelist_model = _.find(this.model_lock, function (model) {
                return model.model == 'product.pricelist';
            });
            if (pricelist_model) {
                var results = database[pricelist_model.model];
                pricelist_model.loaded(this, results, {});
            }
            for (var model_name in database) {
                var transaction = this.indexedDB.transaction([model_name], 'readwrite');
                var request = transaction.objectStore(model_name);
                var values = database[model_name];
                request.add(values);
                var model_loaded = _.find(this.model_lock, function (model) {
                    return model.model == model_name;
                });
                if (model_loaded) {
                    var results = database[model_name];
                    if (model_loaded.model == 'product.product') {
                        for (var i = 0; i < results.length; i++) {
                            var product = results[i];
                            if (this.stock_datas[product['id']]) {
                                product['qty_available'] = this.stock_datas[product['id']]
                            }
                        }
                        this.products = results;
                    }
                    if (model_loaded.model != 'product.pricelist') {
                        model_loaded.loaded(this, results, {});
                    }
                }
                for (var i = 0; i < values.length; i++) {
                    var line = values[i];
                    var local_date = (line.write_date || '').replace(/^(\d{4}-\d{2}-\d{2}) ((\d{2}:?){3})$/, '$1T$2Z');
                    var dist_date = (this.write_date || '').replace(/^(\d{4}-\d{2}-\d{2}) ((\d{2}:?){3})$/, '$1T$2Z');
                    if (this.write_date && new Date(local_date).getTime() + 1000 >= new Date(dist_date).getTime()) {
                        this.write_date = line.write_date;
                    } else if (this.write_date < line.write_date) {
                        this.write_date = line.write_date;
                    }
                }
            }
        },
        load_server_data: function () {
            var self = this;
            return _super_PosModel.load_server_data.apply(this, arguments).then(function () {
                var condition = {};
                for (var index_number in self.model_lock) {
                    self.models.push(self.model_lock[index_number]);
                    condition[self.model_lock[index_number]['model']] = true;
                }
                if (self.database && self.database['product.product'] && self.database['product.product'].length && self.database['res.partner'] && self.database['res.partner'].length) {
                    self.load_datas(self.database);
                } else {
                    return rpc.query({
                        model: 'pos.cache.database',
                        method: 'load_master_data',
                        args: [condition],
                    }).then(function (database) {
                        if (database) {
                            self.load_datas(database);
                        } else {
                            return $.when(self.first_install('product.pricelist')).then(function () {
                                return $.when(self.first_install('product.pricelist.item')).then(function () {
                                    return $.when(self.first_install('product.product')).then(function () {
                                        return $.when(self.first_install('res.partner')).then(function () {
                                            return $.when(self.first_install('account.invoice')).then(function () {
                                                return $.when(self.first_install('account.invoice.line')).then(function () {
                                                    return $.when(self.first_install('pos.order')).then(function () {
                                                        return $.when(self.first_install('pos.order.line')).then(function () {
                                                            return $.when(self.first_install('sale.order')).then(function () {
                                                                return $.when(self.first_install('sale.order.line')).then(function () {
                                                                    return true;
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            })
                                        })
                                    })
                                })
                            })
                        }
                    }).fail(function (type, error) {
                        return self.pos.query_backend_fail(type, error);
                    });
                }
            }).then(function () {
                self.save_parameter_models_load();
                setInterval(function () {
                    self.auto_refresh_caches();
                }, 5000);
                setTimeout(function () {
                    self.update_caches_from_backend();
                }, 30000);
                rpc.query({
                    model: 'pos.config',
                    method: 'search_read',
                    domain: [['user_id', '!=', null]],
                    fields: [],
                }).then(function (configs) {
                    self.config_by_id = {};
                    self.configs = configs;
                    for (var i = 0; i < configs.length; i++) {
                        var config = configs[i];
                        self.config_by_id[config['id']] = config;
                    }
                    if (self.config_id) {
                        var config = _.find(configs, function (config) {
                            return config['id'] == self.config_id
                        });
                        if (config) {
                            var user = self.user_by_id[config.user_id[0]]
                            if (user) {
                                self.set_cashier(user);
                            }
                        }
                    }
                });
                return rpc.query({
                    model: 'res.currency',
                    method: 'search_read',
                    domain: [['active', '=', true]],
                    fields: ['name','symbol','position','rounding', 'rate'],
                }).then(function (currencies) {
                    self.multi_currency = currencies;
                });
            })
        }
    });
});
