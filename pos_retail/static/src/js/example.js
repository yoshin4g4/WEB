odoo.define('pos_boost_speed.init', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    models.load_fields('product.product', ['price_extra', 'write_date', 'available_in_pos']);
});
;
odoo.define('pos_boost_speed.pos', function (require) {
    "use strict";
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var rpc = require('web.rpc');
    var ajax = require('web.ajax');
    var time = require('web.time');
    var PosDB = require('pos_boost_speed.DB');
    var _t = core._t;
    var PosModel = models.PosModel;
    var _super = PosModel.prototype;
    models.PosModel = PosModel.extend({
        initialize: function (attributes, options) {
            _super.initialize.apply(this, arguments);
        },
        reload_new_partners: function () {
            var self = this;
            var def = new $.Deferred();
            var fields = _.find(this.models, function (model) {
                return model.model === 'res.partner';
            }).fields;
            var domain = [['customer', '=', true], ['write_date', '>', this.db.get_partner_write_date()]];
            rpc.query({model: 'res.partner', method: 'search_read', args: [domain, fields],}, {
                timeout: 3000,
                shadow: true,
            }).then(function (partners) {
                self.db.add_partners(partners)
                def.resolve();
            }, function (type, err) {
                def.reject();
            });
            return def;
        },
        synch_update_products: function (options) {
            var self = this;
            var product_index = _.findIndex(this.models, function (model) {
                return model.model === "product.product";
            });
            var product_model = this.models[product_index];
            var product_fields = product_model.fields;
            var product_domain = product_model.domain;
            self.chrome.loading_message(_t('Loading') + ' latest updates on product.product', 1);
            var archived_domain = [['write_date', '>', self.db.get_product_write_date()]]
            var records = rpc.query({
                route: '/pos/get_archived_products',
                params: {product_domain: archived_domain,},
            }, options);
            return records.then(function (product_ids) {
                _.each(product_ids, function (product_id) {
                    var product = self.db.product_by_id[product_id];
                    delete self.db.product_by_id[product_id];
                    if (product && product.barcode) {
                        var product_by_barcode = self.db.product_by_barcode[product.barcode];
                        if (product_by_barcode) {
                            product_by_barcode.available_in_pos = false;
                        }
                        delete self.db.product_by_barcode[product.barcode];
                    }
                })
                self.set('synch_product_data', {state: 'connected', pending: 0})
            }).then(function () {
                var records = rpc.query({
                    route: '/pos/get_updated_products',
                    params: {
                        product_fields: product_fields,
                        product_domain: product_domain,
                        write_date: self.db.get_product_write_date()
                    },
                }, options);
                return records.then(function (products) {
                    var unavailable_products = _.filter(products, function (product) {
                        return !product.available_in_pos
                    })
                    _.each(unavailable_products, function (product) {
                        self.db.update_product_write_date(product);
                        delete self.db.product_by_id[product.id];
                        if (product.barcode) {
                            var product_by_barcode = self.db.product_by_barcode[product.barcode];
                            if (product_by_barcode) {
                                product_by_barcode.available_in_pos = false;
                            }
                            delete self.db.product_by_barcode[product.barcode];
                        }
                    })
                    products = _.filter(products, function (product) {
                        return product.available_in_pos
                    })
                    self.db.add_products(_.map(products, function (product) {
                        product.categ = _.findWhere(self.product_categories, {'id': product.categ_id[0]});
                        return new models.Product({}, product);
                    }))
                    var products_screen = self.gui.screen_instances['products'];
                    var product_list_widget = products_screen ? products_screen.product_list_widget : false;
                    var product_cache = product_list_widget ? product_list_widget.product_cache : false;
                    if (product_cache && products) {
                        _.each(products, function (product) {
                            var current_pricelist = product_list_widget._get_active_pricelist();
                            var cache_key = product_list_widget.calculate_cache_key(product, current_pricelist);
                            product_cache.clear_node(cache_key);
                        })
                    }
                })
            });
        },
        load_server_data: function () {
            var self = this;
            var product_index = _.findIndex(this.models, function (model) {
                return model.model === "product.product";
            });
            var partner_index = _.findIndex(this.models, function (model) {
                return model.model === "res.partner";
            });
            var product_model = this.models[product_index];
            var product_fields = product_model.fields;
            var product_domain = product_model.domain;
            var partner_model = this.models[partner_index];
            var partner_fields = partner_model.fields;
            var partner_domain = partner_model.domain;
            if (product_index !== -1) {
                this.models.splice(product_index, 1);
            }
            if (partner_index !== -1) {
                this.models.splice(partner_index, 1);
            }
            return _super.load_server_data.apply(this, arguments).then(function () {
                var records = rpc.query({
                    route: '/pos/get_products_data',
                    params: {product_fields: product_fields, product_domain: product_domain},
                });
                self.chrome.loading_message(_t('Loading') + ' boost speed on product.product', 1);
                return records.then(function (products) {
                    self.db.add_products(_.map(products, function (product) {
                        product.categ = _.findWhere(self.product_categories, {'id': product.categ_id[0]});
                        return new models.Product({}, product);
                    }))
                    self.models.splice(product_index, 1, product_model);
                }).then(function () {
                    return self.synch_update_products();
                }).then(function () {
                    return rpc.query({
                        route: '/pos/get_partners_data',
                        params: {partner_fields: partner_fields, partner_domain: partner_domain},
                    }).then(function (partners) {
                        self.chrome.loading_message(_t('Loading') + ' boost speed on res.partner', 1);
                        self.partners = partners;
                        self.db.add_partners(partners);
                        self.models.splice(partner_index, 1, partner_model);
                        return self.reload_new_partners();
                    })
                })
            });
        },
    });
});
;
odoo.define('pos_boost_speed.data_synch_widget', function (require) {
    "use strict";
    var chrome = require('point_of_sale.chrome');
    var StatusWidget = chrome.StatusWidget;
    var DataSynchNotificationWidget = StatusWidget.extend({
        template: 'DataSynchNotificationWidget', start: function () {
            var self = this;
            this.pos.bind('change:synch_product_data', function (pos, synch) {
                self.set_status(synch.state, synch.pending);
            });
            this.$el.click(function () {
                self.pos.synch_update_products({timeout: 3000, shadow: true,});
            });
        },
    });
    return DataSynchNotificationWidget
});
;
odoo.define('pos_boost_speed.product_list_widget', function (require) {
    "use strict";
    var screens = require('point_of_sale.screens');
    var ProductListWidget = screens.ProductListWidget;
    ProductListWidget.include({
        renderElement: function () {
            this.product_list = _.filter(this.product_list, function (p) {
                return p;
            })
            return this._super()
        },
    });
});
;
odoo.define('pos_boost_speed.DB', function (require) {
    "use strict";
    var PosDB = require('point_of_sale.DB');
    PosDB.include({
        init: function (options) {
            this._super(options);
            this.product_write_date = '';
        }, get_product_write_date() {
            return this.product_write_date || "1970-01-01 00:00:00";
        }, update_product_write_date(product) {
            var local_product_date = (this.product_write_date || '').replace(/^(\d{4}-\d{2}-\d{2}) ((\d{2}:?){3})$/, '$1T$2Z');
            var dist_product_date = (product.write_date || '').replace(/^(\d{4}-\d{2}-\d{2}) ((\d{2}:?){3})$/, '$1T$2Z');
            if (this.product_write_date && this.product_by_id[product.id] && new Date(local_product_date).getTime() + 1000 >= new Date(dist_product_date).getTime()) {
            } else if (this.product_write_date < product.write_date) {
                this.product_write_date = product.write_date;
            }
        }, _product_search_string: function (product) {
            var str = this._super(product);
            var self = this;
            this.update_product_write_date(product);
            return str;
        }, search_product_in_category: function (category_id, query) {
            var results = this._super(category_id, query);
            results = _.filter(results, function (r) {
                return !_.isEmpty(r);
            });
            return results;
        }, get_product_by_barcode: function (barcode) {
            var product = this._super(barcode)
            if ('available_in_pos' in product && !product['available_in_pos']) {
                return undefined;
            }
            return product
        },
    });
    return PosDB;
});
;

odoo.define('pos_boost_speech.chrome', function (require) {
    "use strict";
    var chrome = require('point_of_sale.chrome');
    var DataSynchNotificationWidget = require('pos_boost_speed.data_synch_widget');
    var Chrome = chrome.Chrome;
    chrome.Chrome.include({
        build_widgets: function () {
            this.append_widgets([{
                'name': 'data_synch_widget',
                'widget': DataSynchNotificationWidget,
                'append': '.pos-rightheader',
            }], {'before': 'notification'});
            return this._super()
        }, append_widgets(new_widgets, options) {
            if (!(new_widgets instanceof Array)) {
                new_widgets = [new_widgets];
            }
            var widgets = this.widgets
            var index = this.widgets.length;
            if (options.before) {
                for (var i = 0; i < widgets.length; i++) {
                    if (widgets[i].name === options.before) {
                        index = i;
                        break;
                    }
                }
            } else if (options.after) {
                for (var i = 0; i < widgets.length; i++) {
                    if (widgets[i].name === options.after) {
                        index = i + 1;
                    }
                }
            }
            widgets.splice.apply(widgets, [index, 0].concat(new_widgets));
        }
    });
    return chrome
});
;
odoo.define('pos_boost_speed.order', function (require) {
    "use strict";
    var core = require('web.core');
    var models = require('point_of_sale.models');
    var DB = require('pos_boost_speed.DB');
    var rpc = require('web.rpc');
    var Order = models.Order;
    var utils = require('web.utils');
    var round_di = utils.round_decimals;
    var round_pr = utils.round_precision;
    var _t = core._t;
    var _super = Order.prototype;
    models.Order = Order.extend({
        initialize: function (attributes, options) {
            _super.initialize.apply(this, arguments);
            this.get_synch_data_status();
        }, get_synch_data_status: function () {
            var self = this;
            var def = new $.Deferred();
            var domain = [['write_date', '>', this.pos.db.get_product_write_date()]];
            rpc.query({model: 'product.product', method: 'search_count', args: [domain],}, {
                timeout: 3000,
                shadow: true,
            }).then(function (product_count) {
                console.log(">>> product_count:", product_count);
                self.pos.set('synch_product_data', {
                    state: product_count ? 'disconnected' : 'connected',
                    pending: product_count
                })
                def.resolve();
            }, function (type, err) {
                def.reject();
            });
            return def;
        },
    });
});
;
odoo.define('niq_pos_multi_barcodes.DB', function (require) {
    "use strict";
    var PosDB = require('point_of_sale.DB');
    PosDB.include({
        init: function (options) {
            this._super(options);
            this.multi_barcode_by_id = {}
        }, set_multi_barcode_by_id: function (multi_barcodes) {
            for (var i = 0; i < multi_barcodes.length; i++) {
                var multi_barcode = multi_barcodes[i];
                this.multi_barcode_by_id[multi_barcode.id] = multi_barcode;
            }
        }, get_multi_barcode_by_id: function (multi_barcode_id) {
            return this.multi_barcode_by_id[multi_barcode_id];
        }, get_multi_barcodes: function () {
            return this.multi_barcode_by_id;
        }, add_products: function (products) {
            var self = this;
            this._super(products);
            var multi_barcodes = this.get_multi_barcodes();
            _.each(multi_barcodes, function (multi_barcode, multi_barcode_id) {
                var product_id = multi_barcode.product_id[0];
                var product = self.product_by_id[product_id];
                if (product) {
                    self.product_by_barcode[multi_barcode.name] = product;
                }
            })
        }, _product_search_string: function (product) {
            var str = this._super(product);
            var self = this;
            var multi_barcode_ids = product.barcode_ids;
            if (multi_barcode_ids) {
                str = str.slice(0, str.length - 1);
                _.each(multi_barcode_ids, function (multi_barcode_id, idx) {
                    var multi_barcode = self.get_multi_barcode_by_id(multi_barcode_id);
                    if (multi_barcode) {
                        var name = multi_barcode.name
                        var barcode = name ? name.replace(/:/g, '') : '';
                        str += '|' + barcode;
                    }
                });
                str += '\n';
            }
            return str;
        },
    });
});
;
odoo.define('niq_pos_multi_barcodes.init', function (require) {
    "use strict";
    var models = require('point_of_sale.models');
    models.load_fields('product.product', ['barcode_ids']);
    models.load_models({
        model: 'product.multi.barcode',
        fields: ['product_id', 'name'],
        domain: [['available_in_pos', '=', true]],
        loaded: function (self, multi_barcodes) {
            self.db.set_multi_barcode_by_id(multi_barcodes);
        }
    }, {before: 'product.product'});
});