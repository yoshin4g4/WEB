/*
    This module create by: thanhchatvn@gmail.com
    License: OPL-1
    Please do not modification if i'm not accepted
 */
odoo.define('pos_retail.model', function (require) {
    var models = require('point_of_sale.models');
    var time = require('web.time');
    var utils = require('web.utils');
    var core = require('web.core');
    var round_pr = utils.round_precision;
    var _t = core._t;
    var rpc = require('pos.rpc');
    var big_data = require('pos_retail.big_data');
    var session = require('web.session');
    var time = require('web.time');

    var _super_PosModel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        get_model: function (_name) {
            var _index = this.models.map(function (e) {
                return e.model;
            }).indexOf(_name);
            if (_index > -1) {
                return this.models[_index];
            }
            return false;
        },
        initialize: function (session, attributes) {
            var self = this;
            this.server_version = session.server_version_info[0];

            if (this.server_version == 10) {
                var wait_pricelist = this.get_model('product.pricelist');
                wait_pricelist.ids = [];
                wait_pricelist.fields = [];
                var _wait_super_loaded = wait_pricelist.loaded;
                wait_pricelist.loaded = function (self, pricelists) {
                    _wait_super_loaded(self, pricelists);
                    self.pricelist_by_id = {};
                    self.default_pricelist = _.find(pricelists, {id: self.config.pricelist_id[0]});
                    self.pricelists = pricelists;
                    _.map(pricelists, function (pricelist) {
                        pricelist.items = [];
                        self.pricelist_by_id[pricelist['id']] = pricelist;
                    });
                };
            }
            var wait_journal = this.get_model('account.journal');
            wait_journal.fields.push('pos_method_type');
            var account_tax_model = this.get_model('account.tax');
            account_tax_model.fields.push('type_tax_use');
            var wait_currency = this.get_model('res.currency');
            wait_currency.fields.push(
                'rate'
            );
            var _wait_super_currency_loaded = wait_currency.loaded;
            wait_currency.loaded = function (self, currencies) {
                _wait_super_currency_loaded(self, currencies);
                self.currency_by_id = {};
                self.currencies = currencies;
                var i = 0
                while (i < currencies.length) {
                    self.currency_by_id[currencies[i].id] = currencies[i];
                    i++
                }
                var cashregisters = self.cashregisters;
                for (var i = 0; i < cashregisters.length; i++) {
                    var cashregister = cashregisters[i];
                    var currency = self.currency_by_id[cashregister['currency_id'][0]];
                    if (cashregister['currency_id'] && cashregister['currency_id'][0] && currency && currency['rate']) {
                        cashregister['rate'] = currency['rate']
                    }
                }
            };

            var product_pricelist_item_model = this.get_model('product.pricelist.item');
            var _super_product_pricelist_item_loaded = product_pricelist_item_model.loaded;
            product_pricelist_item_model.loaded = function (self, pricelist_items) {
                // *************************************
                // if pricelist active == false
                // no need loads items
                // *************************************
                var new_items = [];
                var pricelist_by_id = {};
                _.each(self.pricelists, function (pricelist) {
                    pricelist_by_id[pricelist.id] = pricelist;
                });

                _.each(pricelist_items, function (item) {
                    var pricelist = pricelist_by_id[item.pricelist_id[0]];
                    if (pricelist) {
                        new_items.push(item)
                    }
                });
                _super_product_pricelist_item_loaded(self, new_items);
            };

            var pos_category_model = this.get_model('pos.category');
            var _super_pos_category_loaded = pos_category_model.loaded;
            pos_category_model.loaded = function (self, categories) {
                _super_pos_category_loaded(self, categories);
                self.categories = categories;
            };
            var account_fiscal_position_tax_model = this.get_model('account.fiscal.position.tax');
            var _super_account_fiscal_position_tax_model_loaded = account_fiscal_position_tax_model.loaded;
            account_fiscal_position_tax_model.loaded = function (self, fiscal_position_taxes) {
                fiscal_position_taxes = _.filter(fiscal_position_taxes, function (tax) {
                    return tax.tax_dest_id != false;
                })
                if (fiscal_position_taxes.length > 0) {
                    _super_account_fiscal_position_tax_model_loaded(self, fiscal_position_taxes);
                }
            };
            var res_partner_model = this.get_model('res.partner');
            var _super_loaded_res_partner_model = res_partner_model.loaded;
            res_partner_model.loaded = function (self, partners) {
                var suppliers = _.filter(partners, function (partner) {
                    return partner['supplier'] == true;
                });
                _super_loaded_res_partner_model(self, partners);
                self.db.add_suppliers(suppliers);
            };

            var product_model = this.get_model('product.product');
            product_model.fields.push(
                'is_credit',
                'multi_category',
                'multi_uom',
                'multi_variant',
                'supplier_barcode',
                'manufacturing_out_of_stock',
                'manufacturing_state',
                'is_combo',
                'combo_limit',
                'uom_po_id',
                'barcode_ids',
                'pos_categ_ids',
                'qty_available',
                'supplier_taxes_id',
                'volume',
                'weight',
                'description_sale',
                'description_picking',
                'type',
                'cross_selling',
                'suggestion_sale',
                'standard_price'
            );
            this.bus_location = null;
            var partner_model = this.get_model('res.partner');
            partner_model.fields.push(
                'ref',
                'vat',
                'comment',
                'discount_id',
                'customer',
                'supplier',
                'credit',
                'debit',
                'balance',
                'limit_debit',
                'wallet',
                'pos_loyalty_point',
                'pos_loyalty_type',
                'property_product_pricelist',
                'property_payment_term_id',
                'is_company',
            );
            if (this.server_version == 10) {
                partner_model.fields.push('property_product_pricelist')
            }
            _super_PosModel.initialize.apply(this, arguments);
            this.bind('change:selectedOrder', function () {
                var selectedOrder = self.get_order();
                if (self.pos_bus && self.config && self.config.bus_id[0] && selectedOrder) {
                    self.pos_bus.push_message_to_other_sessions({
                        action: 'selected_order',
                        data: {
                            uid: selectedOrder['uid']
                        },
                        bus_id: self.config.bus_id[0],
                        order_uid: selectedOrder['uid'],
                    });
                }
            });
            this.get('orders').bind('change add remove', function (order) {
                self.trigger('update:table-list');
            });

        },
        add_new_order: function () {
            _super_PosModel.add_new_order.apply(this, arguments);
            var order = this.get_order();
            var client = order.get_client();
            if (!client && this.config.customer_default_id) {
                var client_default = this.db.get_partner_by_id(this.config.customer_default_id[0]);
                var order = this.get_order();
                if (client_default && order) {
                    setTimeout(function () {
                        order.set_client(client_default);
                    }, 1000);

                }
            }
        },
        formatDateTime: function (value, field, options) {
            if (value === false) {
                return "";
            }
            if (!options || !('timezone' in options) || options.timezone) {
                value = value.clone().add(session.getTZOffset(value), 'minutes');
            }
            return value.format(time.getLangDatetimeFormat());
        },
        format_date: function (date) { // covert datetime backend to pos
            if (date) {
                return this.formatDateTime(
                    moment(date), {}, {timezone: true});
            } else {
                return ''
            }
        }
        ,
        get_config: function () {
            return this.config;
        }
        ,
        get_location: function () {
            if (!this.location) {
                var location = this.stock_location_by_id[this.config.stock_location_id[0]];
                return location
            } else {
                return this.location;
            }
        },
        set_location: function (location) {
            this.location = location;
        }
        ,
        // get price with tax for v10
        get_price_with_tax: function (product) {
            var price = product['price'];
            var taxes_id = product['taxes_id'];
            var tax_amount = 0;
            var base_amount = this['list_price'];
            if (taxes_id.length > 0) {
                for (var index_number in taxes_id) {
                    var tax = this.taxes_by_id[taxes_id[index_number]];
                    if (tax && tax.price_include) {
                        continue;
                    }
                    if (!tax) {
                        continue
                    } else {
                        if (tax.amount_type === 'fixed') {
                            var sign_base_amount = base_amount >= 0 ? 1 : -1;
                            tax_amount += Math.abs(tax.amount) * sign_base_amount;
                        }
                        if ((tax.amount_type === 'percent' && !tax.price_include) || (tax.amount_type === 'division' && tax.price_include)) {
                            tax_amount += base_amount * tax.amount / 100;
                        }
                        if (tax.amount_type === 'percent' && tax.price_include) {
                            tax_amount += base_amount - (base_amount / (1 + tax.amount / 100));
                        }
                        if (tax.amount_type === 'division' && !tax.price_include) {
                            tax_amount += base_amount / (1 - tax.amount / 100) - base_amount;
                        }
                    }
                }
            }
            if (tax_amount) {
                return price + tax_amount
            } else {
                return price
            }
        }
        ,
        get_bus_location: function () {
            return this.bus_location
        }
        ,
        query_backend_fail: function (type, error) {
            if (type && type.code === 200 && type.message && type.data && type.data.message) {
                return this.gui.show_popup('confirm', {
                    title: type.message,
                    body: type.data.message,
                })
            } else {
                return this.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Odoo offline mode',
                })
            }
        }
        ,
        scan_product: function (parsed_code) {
            var self = this;
            console.log('-> scan barcode: ' + parsed_code.code);
            var product = this.db.get_product_by_barcode(parsed_code.code);
            var lot_by_barcode = this.lot_by_barcode;
            var lots = lot_by_barcode[parsed_code.code];
            var selectedOrder = this.get_order();
            var products_by_supplier_barcode = this.db.product_by_supplier_barcode[parsed_code.code];
            var barcodes = this.barcodes_by_barcode[parsed_code.code];
            var lots = _.filter(lots, function (lot) {
                var product_id = lot.product_id[0];
                var product = self.db.product_by_id[product_id];
                return product != undefined
            });
            var quantity_pack = _.find(this.quantities_pack, function (pack) {
                return pack.barcode == parsed_code.code;
            });
            if (quantity_pack) {
                var product_by_product_tmpl_id = _.find(this.products, function (product) {
                    return product.product_tmpl_id[0] == quantity_pack['product_tmpl_id'][0];
                });
                if (product_by_product_tmpl_id) {
                    var product = self.db.product_by_id[product_by_product_tmpl_id.id];
                    if (product) {
                        selectedOrder.add_product(product, {quantity: quantity_pack.quantity, merge: true});
                        var order_line = selectedOrder.get_selected_orderline();
                        order_line.set_unit_price(quantity_pack['public_price']);
                        return true
                    }
                }
            }
            if (lots && lots.length) { // scan lots
                if (lots.length > 1) {
                    var list = [];
                    for (var i = 0; i < lots.length; i++) {
                        list.push({
                            'label': lots[i]['name'],
                            'item': lots[i]
                        })
                    }
                    this.gui.show_popup('selection', {
                        title: _t('Select Lot'),
                        list: list,
                        confirm: function (lot) {
                            var product = self.db.product_by_id[lot.product_id[0]];
                            if (product) {
                                selectedOrder.add_product(product, {merge: false});
                                self.gui.close_popup();
                                var order_line = selectedOrder.get_selected_orderline();
                                if (order_line) {
                                    if (lot.replace_product_public_price && lot.public_price) {
                                        order_line.set_unit_price(lot['public_price'])
                                    }
                                    $('.packlot-line-input').remove(); // fix on safari
                                    setTimeout(function () {
                                        var pack_models = order_line.pack_lot_lines.models;
                                        if (pack_model) {
                                            for (var i = 0; i < pack_models.length; i++) {
                                                var pack_model = pack_models[i];
                                                pack_model.set_lot_name(lot['name']);
                                                pack_model.set_lot(lot);
                                            }
                                            order_line.trigger('change', order_line);
                                        }
                                    }, 300);
                                }
                                return true
                            } else {
                                return this.gui.show_popup('confirm', {
                                    title: 'Warning',
                                    body: 'Lot name is correct but product of lot not available on POS'
                                });
                            }
                        }
                    });
                    return true; // break out scanning action
                }
                else if (lots.length == 1) {
                    var lot = lots[0];
                    var product = self.db.product_by_id[lot.product_id[0]];
                    if (product) {
                        selectedOrder.add_product(product, {merge: false});
                        self.gui.close_popup();
                        var order_line = selectedOrder.get_selected_orderline();
                        if (order_line) {
                            if (lot.replace_product_public_price && lot.public_price) {
                                order_line.set_unit_price(lot['public_price'])
                            }
                            $('.packlot-line-input').remove(); // fix on safari
                            setTimeout(function () {
                                var pack_models = order_line.pack_lot_lines.models;
                                if (pack_models) {
                                    for (var i = 0; i < pack_models.length; i++) {
                                        var pack_model = pack_models[i];
                                        pack_model.set_lot_name(lot['name']);
                                        pack_model.set_lot(lot);
                                    }
                                    order_line.trigger('change', order_line);
                                }
                            }, 300);
                        }
                        return true
                    } else {
                        return this.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Lot name is correct but product of lot not available on POS'
                        });
                    }
                }
            }
            else if (products_by_supplier_barcode) { // scan code by suppliers code
                var products = []
                for (var i = 0; i < products_by_supplier_barcode.length; i++) {
                    products.push({
                        label: products_by_supplier_barcode[i]['display_name'],
                        item: products_by_supplier_barcode[i]
                    })
                }
                var product = this.db.get_product_by_barcode(parsed_code.code);
                if (product) {
                    products.push({
                        label: product['display_name'],
                        item: product
                    })
                }
                this.gui.show_popup('selection', {
                    title: _t('Select product'),
                    list: products,
                    confirm: function (product) {
                        var selectedOrder = self.get('selectedOrder');
                        if (selectedOrder) {
                            if (parsed_code.type === 'price') {
                                selectedOrder.add_product(product, {
                                    quantity: 1,
                                    price: product['list_price'],
                                    merge: true
                                });
                            } else if (parsed_code.type === 'weight') {
                                selectedOrder.add_product(product, {
                                    quantity: 1,
                                    price: product['list_price'],
                                    merge: false
                                });
                            } else if (parsed_code.type === 'discount') {
                                selectedOrder.add_product(product, {discount: parsed_code.value, merge: false});
                            } else {
                                selectedOrder.add_product(product);
                            }
                        }
                    }
                });
                return true
            }
            else if (product && barcodes) { // multi barcode, if have product and barcodes
                var list = [{
                    'label': product['name'] + '| price: ' + product['list_price'] + ' | qty: 1 ' + '| and Uoms: ' + product['uom_id'][1],
                    'item': product,
                }];
                for (var i = 0; i < barcodes.length; i++) {
                    var barcode = barcodes[i];
                    list.push({
                        'label': barcode['product_id'][1] + '| price: ' + barcode['list_price'] + ' | qty: ' + barcode['quantity'] + '| and Uoms: ' + barcode['uom_id'][1],
                        'item': barcode,
                    });
                }
                this.gui.show_popup('selection', {
                    title: _t('Select product'),
                    list: list,
                    confirm: function (item) {
                        var barcode;
                        var product;
                        if (item['product_id']) {
                            barcode = item;
                            product = self.db.product_by_id[barcode.product_id[0]]
                            selectedOrder.add_product(product, {
                                price: barcode['list_price'],
                                quantity: barcode['quantity'],
                                extras: {
                                    uom_id: barcode['uom_id'][0]
                                }
                            });
                        } else {
                            product = item;
                            selectedOrder.add_product(product, {});
                        }
                    }
                });
                if (list.length > 0) {
                    return true;
                }
            }
            else if (!product && barcodes) { // not have product but have barcodes
                if (barcodes.length == 1) {
                    var barcode = barcodes[0]
                    var product = this.db.product_by_id[barcode['product_id'][0]];
                    if (product) {
                        selectedOrder.add_product(product, {
                            price: barcode['list_price'],
                            quantity: barcode['quantity'],
                            extras: {
                                uom_id: barcode['uom_id'][0]
                            }
                        });
                        return true;
                    }
                } else if (barcodes.length > 1) { // if multi items the same barcode, require cashier select
                    var list = [];
                    for (var i = 0; i < barcodes.length; i++) {
                        var barcode = barcodes[i];
                        list.push({
                            'label': barcode['product_id'][1] + '| price: ' + barcode['list_price'] + ' | qty: ' + barcode['quantity'] + '| and Uoms: ' + barcode['uom_id'][1],
                            'item': barcode,
                        });
                    }
                    this.gui.show_popup('selection', {
                        title: _t('Select product'),
                        list: list,
                        confirm: function (barcode) {
                            var product = self.db.product_by_id[barcode['product_id'][0]];
                            if (product) {
                                selectedOrder.add_product(product, {
                                    price: barcode['list_price'],
                                    quantity: barcode['quantity'],
                                    extras: {
                                        uom_id: barcode['uom_id'][0]
                                    }
                                });
                            }
                        }
                    });
                    if (list.length > 0) {
                        return true;
                    }
                }
            }
            return _super_PosModel.scan_product.apply(this, arguments);
        }
        ,
        set_table: function (table) {
            _super_PosModel.set_table.apply(this, arguments);
            this.trigger('update:table-list');
        }
        ,
        _save_to_server: function (orders, options) {
            for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                if ((order.data.plus_point || order.data.redeem_point) && order.data.partner_id) {
                    var customer = this.db.get_partner_by_id(order.data.partner_id)
                    if (order.data.plus_point != undefined) {
                        customer['pos_loyalty_point'] += order.data.plus_point;
                    }
                    if (order.data.redeem_point != undefined) {
                        customer['pos_loyalty_point'] -= order.data.redeem_point;
                    }
                    this.db.partner_by_id[order.data.partner_id] = customer;
                    this.trigger('update:point-client');
                }
            }
            if (this.hide_pads) {
                $('.show_hide_pads').click();
            }
            return _super_PosModel._save_to_server.call(this, orders, options);
        }
        ,
        push_order: function (order, opts) {
            var self = this;
            var pushed = _super_PosModel.push_order.apply(this, arguments);
            var client = order && order.get_client();
            if (client) {
                for (var i = 0; i < order.paymentlines.models.length; i++) {
                    var line = order.paymentlines.models[i];
                    var amount = line.get_amount();
                    var journal = line.cashregister.journal;
                    if (journal.pos_method_type == 'wallet') {
                        client.wallet = -amount;
                    }
                    if (journal.credit) {
                        client.balance -= line.get_amount(); // update balance when payment viva credit journal
                    }
                }
                this.trigger('reload:screen_partners');
            }
            return pushed;
        },
        get_balance: function (client) {
            var balance = round_pr(client.balance, this.currency.rounding)
            return (Math.round(balance * 100) / 100).toString()
        }
        ,
        get_wallet: function (client) {
            var wallet = round_pr(client.wallet, this.currency.rounding)
            return (Math.round(wallet * 100) / 100).toString()
        }
        ,
        add_return_order: function (order, lines) {
            var partner_id = order['partner_id']
            var return_order_id = order['id']
            var order = new models.Order({}, {pos: this});
            order['is_return'] = true;
            order['return_order_id'] = return_order_id;
            order['pos_reference'] = 'Return/' + order['name'];
            order['name'] = 'Return/' + order['name'];
            this.get('orders').add(order);
            if (partner_id && partner_id[0]) {
                var client = this.db.get_partner_by_id(partner_id[0]);
                if (client) {
                    order.set_client(client);
                }
            }
            this.set('selectedOrder', order);
            for (var i = 0; i < lines.length; i++) {
                var line_return = lines[i];
                var price = line_return['price_unit'];
                var quantity = 0;
                var product = this.db.get_product_by_id(line_return.product_id[0])
                var line = new models.Orderline({}, {pos: this, order: order, product: product});
                line['is_return'] = true;
                if (line_return.plus_point) { // loyalty point back
                    line.plus_point = -line_return.plus_point;
                } else {
                    line_return.plus_point = 0;
                }
                if (line_return.redeem_point) {
                    line.redeem_point = -line_return.redeem_point;
                } else {
                    line_return.redeem_point = 0;
                }
                line.set_unit_price(price);
                if (line_return['new_quantity']) {
                    quantity = -line_return['new_quantity']
                } else {
                    quantity = -line_return['qty']
                }
                if (quantity > 0) {
                    quantity = -quantity
                }
                line.set_quantity(quantity, 'keep price when return');
                order.orderlines.add(line);
            }
            return order;
        }
        ,
        set_start_order: function () { // lock unlock order
            var self = this;
            var res = _super_PosModel.set_start_order.apply(this, arguments);
            var order = this.get_order();
            if (order && order['lock'] && this.config.lock_order_printed_receipt) {
                setTimeout(function () {
                    self.lock_order();
                }, 1000)
            }
            if (this.server_version == 10 && order && order.pricelist) {
                order.set_pricelist_to_order(order.pricelist)
            }
            return res
        }
        ,
        lock_order: function () {
            $('.rightpane').addClass('oe_hidden');
            $('.buttons_pane').addClass('oe_hidden');
            $('.timeline').addClass('oe_hidden');
            $('.find_customer').addClass('oe_hidden');
            $('.leftpane').css({'left': '0px'});
            if (this.config.staff_level == 'marketing' || this.config.staff_level == 'waiter') {
                $('.numpad').addClass('oe_hidden');
                $('.actionpad').addClass('oe_hidden');
                $('.deleteorder-button').addClass('oe_hidden');
            }
            if (this.config.staff_level == 'cashier') {
                $('.numpad').addClass('oe_hidden');
                $('.deleteorder-button').addClass('oe_hidden');
            }

        }
        ,
        unlock_order: function () {
            $('.rightpane').removeClass('oe_hidden');
            $('.buttons_pane').removeClass('oe_hidden');
            $('.timeline').removeClass('oe_hidden');
            $('.find_customer').removeClass('oe_hidden');
            $('.numpad').removeClass('oe_hidden');
            $('.actionpad').removeClass('oe_hidden');
            $('.leftpane').css({'left': '220px'});
            if (this.config.staff_level == 'manager') {
                $('.deleteorder-button').removeClass('oe_hidden');
            }
        }
    })
    ;

    models.load_models([
        {
            model: 'res.users',
            fields: ['display_name', 'name', 'pos_security_pin', 'barcode', 'pos_config_id', 'partner_id'],
            context: {sudo: true},
            loaded: function (self, users) {
                self.user_by_id = {};
                self.user_by_pos_security_pin = {};
                self.user_by_barcode = {};
                for (var i = 0; i < users.length; i++) {
                    if (users[i]['pos_security_pin']) {
                        self.user_by_pos_security_pin[users[i]['pos_security_pin']] = users[i];
                    }
                    if (users[i]['barcode']) {
                        self.user_by_barcode[users[i]['barcode']] = users[i];
                    }
                    self.user_by_id[users[i]['id']] = users[i];
                }
            }
        },
        {
            model: 'pos.bus',
            fields: [],
            domain: [['user_id', '!=', false]],
            loaded: function (self, bus_locations) {
                self.bus_locations = bus_locations;
                self.bus_location_by_id = {};
                for (var i = 0; i < bus_locations.length; i++) {
                    var bus = bus_locations[i];
                    self.bus_location_by_id[bus.id] = bus;
                }
            }
        },
        {
            model: 'pos.promotion',
            condition: function (self) {
                return self.config.promotion && self.config.promotion_ids && self.config.promotion_ids.length != 0;
            },
            fields: ['name', 'start_date', 'end_date', 'type', 'product_id', 'discount_lowest_price'],
            domain: function (self) {
                return [
                    ['id', 'in', self.config.promotion_ids],
                    ['start_date', '<=', time.date_to_str(new Date()) + " " + time.time_to_str(new Date())],
                    ['end_date', '>=', time.date_to_str(new Date()) + " " + time.time_to_str(new Date())],
                ]
            },
            loaded: function (self, promotions) {
                self.promotions = promotions;
                self.promotion_by_id = {};
                self.promotion_ids = [];
                var i = 0;
                while (i < promotions.length) {
                    self.promotion_by_id[promotions[i].id] = promotions[i];
                    self.promotion_ids.push(promotions[i].id);
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.order',
            fields: ['minimum_amount', 'discount', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discounts) {
                self.promotion_discount_order_by_id = {};
                self.promotion_discount_order_by_promotion_id = {};
                var i = 0;
                while (i < discounts.length) {
                    self.promotion_discount_order_by_id[discounts[i].id] = discounts[i];
                    if (!self.promotion_discount_order_by_promotion_id[discounts[i].promotion_id[0]]) {
                        self.promotion_discount_order_by_promotion_id[discounts[i].promotion_id[0]] = [discounts[i]]
                    } else {
                        self.promotion_discount_order_by_promotion_id[discounts[i].promotion_id[0]].push(discounts[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.category',
            fields: ['category_id', 'discount', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discounts_category) {
                self.promotion_by_category_id = {};
                var i = 0;
                while (i < discounts_category.length) {
                    self.promotion_by_category_id[discounts_category[i].category_id[0]] = discounts_category[i];
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.quantity',
            fields: ['product_id', 'quantity', 'discount', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discounts_quantity) {
                self.promotion_quantity_by_product_id = {};
                var i = 0;
                while (i < discounts_quantity.length) {
                    if (!self.promotion_quantity_by_product_id[discounts_quantity[i].product_id[0]]) {
                        self.promotion_quantity_by_product_id[discounts_quantity[i].product_id[0]] = [discounts_quantity[i]]
                    } else {
                        self.promotion_quantity_by_product_id[discounts_quantity[i].product_id[0]].push(discounts_quantity[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.gift.condition',
            fields: ['product_id', 'minimum_quantity', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, gift_conditions) {
                self.promotion_gift_condition_by_promotion_id = {};
                var i = 0;
                while (i < gift_conditions.length) {
                    if (!self.promotion_gift_condition_by_promotion_id[gift_conditions[i].promotion_id[0]]) {
                        self.promotion_gift_condition_by_promotion_id[gift_conditions[i].promotion_id[0]] = [gift_conditions[i]]
                    } else {
                        self.promotion_gift_condition_by_promotion_id[gift_conditions[i].promotion_id[0]].push(gift_conditions[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.gift.free',
            fields: ['product_id', 'quantity_free', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, gifts_free) {
                self.promotion_gift_free_by_promotion_id = {};
                var i = 0;
                while (i < gifts_free.length) {
                    if (!self.promotion_gift_free_by_promotion_id[gifts_free[i].promotion_id[0]]) {
                        self.promotion_gift_free_by_promotion_id[gifts_free[i].promotion_id[0]] = [gifts_free[i]]
                    } else {
                        self.promotion_gift_free_by_promotion_id[gifts_free[i].promotion_id[0]].push(gifts_free[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.condition',
            fields: ['product_id', 'minimum_quantity', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discount_conditions) {
                self.promotion_discount_condition_by_promotion_id = {};
                var i = 0;
                while (i < discount_conditions.length) {
                    if (!self.promotion_discount_condition_by_promotion_id[discount_conditions[i].promotion_id[0]]) {
                        self.promotion_discount_condition_by_promotion_id[discount_conditions[i].promotion_id[0]] = [discount_conditions[i]]
                    } else {
                        self.promotion_discount_condition_by_promotion_id[discount_conditions[i].promotion_id[0]].push(discount_conditions[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.discount.apply',
            fields: ['product_id', 'discount', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, discounts_apply) {
                self.promotion_discount_apply_by_promotion_id = {};
                var i = 0;
                while (i < discounts_apply.length) {
                    if (!self.promotion_discount_apply_by_promotion_id[discounts_apply[i].promotion_id[0]]) {
                        self.promotion_discount_apply_by_promotion_id[discounts_apply[i].promotion_id[0]] = [discounts_apply[i]]
                    } else {
                        self.promotion_discount_apply_by_promotion_id[discounts_apply[i].promotion_id[0]].push(discounts_apply[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.price',
            fields: ['product_id', 'minimum_quantity', 'list_price', 'promotion_id'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, prices) {
                self.promotion_price_by_promotion_id = {};
                var i = 0;
                while (i < prices.length) {
                    if (!self.promotion_price_by_promotion_id[prices[i].promotion_id[0]]) {
                        self.promotion_price_by_promotion_id[prices[i].promotion_id[0]] = [prices[i]]
                    } else {
                        self.promotion_price_by_promotion_id[prices[i].promotion_id[0]].push(prices[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.special.category',
            fields: ['category_id', 'type', 'count', 'discount', 'promotion_id', 'product_id', 'qty_free'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, promotion_lines) {
                self.promotion_special_category_by_promotion_id = {};
                var i = 0;
                while (i < promotion_lines.length) {
                    if (!self.promotion_special_category_by_promotion_id[promotion_lines[i].promotion_id[0]]) {
                        self.promotion_special_category_by_promotion_id[promotion_lines[i].promotion_id[0]] = [promotion_lines[i]]
                    } else {
                        self.promotion_special_category_by_promotion_id[promotion_lines[i].promotion_id[0]].push(promotion_lines[i])
                    }
                    i++;
                }
            }
        }, {
            model: 'pos.promotion.multi.buy',
            fields: ['promotion_id', 'product_id', 'quantity_of_by', 'quantity_promotion', 'price_promotion'],
            condition: function (self) {
                return self.promotion_ids && self.promotion_ids.length > 0;
            },
            domain: function (self) {
                return [['promotion_id', 'in', self.promotion_ids]]
            },
            loaded: function (self, multi_buy) {
                self.multi_buy = multi_buy;
                self.multi_buy_by_product_id = {};
                for (var i = 0; i < multi_buy.length; i++) {
                    var rule = multi_buy[i];
                    if (!self.multi_buy_by_product_id[rule['product_id'][0]]) {
                        self.multi_buy_by_product_id[rule['product_id'][0]] = [multi_buy[i]]
                    } else {
                        self.multi_buy_by_product_id[rule['product_id'][0]].push(multi_buy[i])
                    }
                }
            }
        }, {
            model: 'pos.tag',
            fields: ['name'],
            domain: [],
            loaded: function (self, tags) {
                self.tags = tags;
                self.tag_by_id = {};
                var i = 0;
                while (i < tags.length) {
                    self.tag_by_id[tags[i].id] = tags[i];
                    i++;
                }
            }
        }, {
            model: 'pos.note',
            fields: ['name'],
            loaded: function (self, notes) {
                self.notes = notes;
                self.note_by_id = {};
                var i = 0;
                while (i < notes.length) {
                    self.note_by_id[notes[i].id] = notes[i];
                    i++;
                }
            }
        }, {
            model: 'pos.combo.item',
            fields: ['product_id', 'product_combo_id', 'default', 'quantity', 'uom_id', 'tracking'],
            domain: [],
            loaded: function (self, combo_items) {
                self.combo_items = combo_items;
                self.combo_item_by_id = {}
                for (var i = 0; i < combo_items.length; i++) {
                    self.combo_item_by_id[combo_items[i].id] = combo_items[i];
                }
            }
        },
        {
            model: 'stock.production.lot',
            fields: ['name', 'ref', 'product_id', 'product_uom_id', 'create_date', 'product_qty', 'barcode', 'replace_product_public_price', 'public_price'],
            domain: [],
            loaded: function (self, lots) {
                self.lots = lots;
                self.lot_by_name = {};
                self.lot_by_barcode = {};
                self.lot_by_id = {};
                self.lot_by_product_id = {};
                for (var i = 0; i < lots.length; i++) {
                    var lot = lots[i];
                    self.lot_by_name[lot['name']] = lot;
                    self.lot_by_id[lot['id']] = lot;
                    if (lot['barcode']) {
                        if (self.lot_by_barcode[lot['barcode']]) {
                            self.lot_by_barcode[lot['barcode']].push(lot)
                        } else {
                            self.lot_by_barcode[lot['barcode']] = [lot]
                        }
                    }
                    if (!self.lot_by_product_id[lot.product_id[0]]) {
                        self.lot_by_product_id[lot.product_id[0]] = [lot];
                    } else {
                        self.lot_by_product_id[lot.product_id[0]].push(lot);
                    }
                }
            }
        }, {
            model: 'account.journal',
            fields: [],
            domain: function (self, tmp) {
                return [['id', 'in', tmp.journals]];
            },
            loaded: function (self, journals) {
                self.journal_by_id = {};
                for (var i = 0; i < journals.length; i++) {
                    self.journal_by_id[journals[i]['id']] = journals[i];
                }
            }
        }, {
            model: 'pos.config.image',
            condition: function (self) {
                return self.config.is_customer_screen;
            },
            fields: [],
            domain: function (self) {
                return [['config_id', '=', self.config.id]]
            },
            loaded: function (self, images) {
                self.images = images;
            }
        }, {
            model: 'pos.global.discount',
            fields: ['name', 'amount', 'product_id', 'reason'],
            loaded: function (self, discounts) {
                self.discounts = discounts;
                self.discount_by_id = {};
                var i = 0;
                while (i < discounts.length) {
                    self.discount_by_id[discounts[i].id] = discounts[i];
                    i++;
                }
            }
        }, {
            model: 'stock.picking.type',
            domain: [['code', '=', 'internal']],
            condition: function (self) {
                return self.config.internal_transfer;
            },
            loaded: function (self, stock_picking_types) {
                for (var i = 0; i < stock_picking_types.length; i++) {
                    if (stock_picking_types[i].warehouse_id) {
                        stock_picking_types[i]['name'] = stock_picking_types[i].warehouse_id[1] + ' / ' + stock_picking_types[i]['name']
                    }
                }
                self.stock_picking_types = stock_picking_types;
                self.stock_picking_type_by_id = {};
                for (var i = 0; i < stock_picking_types.length; i++) {
                    self.stock_picking_type_by_id[stock_picking_types[i]['id']] = stock_picking_types[i];
                }
                if (stock_picking_types.length == 0) {
                    self.config.internal_transfer = false
                }
            }
        },
        {
            model: 'stock.location',
            fields: [],
            domain: [['usage', '=', 'internal']],
            loaded: function (self, stock_locations) {
                for (var i = 0; i < stock_locations.length; i++) {
                    if (stock_locations[i].location_id) {
                        stock_locations[i]['name'] = stock_locations[i].location_id[1] + ' / ' + stock_locations[i]['name']
                    }
                }
                self.stock_locations = stock_locations;
                self.stock_location_by_id = {};
                for (var i = 0; i < stock_locations.length; i++) {
                    self.stock_location_by_id[stock_locations[i]['id']] = stock_locations[i];
                }
                if (stock_locations.length == 0) {
                    console.error('Location have usage is internal is null');
                }
            },
        }, {
            model: 'pos.loyalty',
            fields: [],
            domain: function (self) {
                return [
                    ['id', 'in', self.config.loyalty_ids],
                    ['start_date', '<=', time.date_to_str(new Date()) + " " + time.time_to_str(new Date())],
                    ['end_date', '>=', time.date_to_str(new Date()) + " " + time.time_to_str(new Date())],
                    ['active', '=', true],
                    ['state', '=', 'running']
                ]
            },
            loaded: function (self, loyalties) {
                self.loyalties = loyalties;
                self.loyalty_by_id = {};
                self.loyalty_ids = [];
                for (var i = 0; i < loyalties.length; i++) {
                    self.loyalty_by_id[loyalties[i].id] = loyalties[i];
                    self.loyalty_ids.push(loyalties[i].id)
                }
            }
        }
        , {
            model: 'pos.loyalty.rule',
            fields: [],
            condition: function (self) {
                return self.loyalty_ids && self.loyalty_ids.length > 0;
            },
            domain: function (self) {
                return [['loyalty_id', 'in', self.loyalty_ids]];
            },
            loaded: function (self, rules) {
                self.rules = rules;
                self.rule_ids = [];
                self.rule_by_id = {};
                self.rules_by_loyalty_id = {};
                for (var i = 0; i < rules.length; i++) {
                    self.rule_by_id[rules[i].id] = rules[i];
                    self.rule_ids.push(rules[i].id)
                    if (!self.rules_by_loyalty_id[rules[i].loyalty_id[0]]) {
                        self.rules_by_loyalty_id[rules[i].loyalty_id[0]] = [rules[i]];
                    } else {
                        self.rules_by_loyalty_id[rules[i].loyalty_id[0]].push(rules[i]);
                    }
                }
            }
        }, {
            model: 'pos.loyalty.rule.order.amount',
            fields: [],
            condition: function (self) {
                return self.rule_ids && self.rule_ids.length > 0;
            },
            domain: function (self) {
                return [['rule_id', 'in', self.rule_ids]]
            },
            loaded: function (self, rules_order_amount) {
                self.rules_order_amount = rules_order_amount;
                self.order_amount_by_rule_id = {};
                for (var i = 0; i < rules_order_amount.length; i++) {
                    if (!self.order_amount_by_rule_id[rules_order_amount[i].rule_id[0]]) {
                        self.order_amount_by_rule_id[rules_order_amount[i].rule_id[0]] = [rules_order_amount[i]];
                    } else {
                        self.order_amount_by_rule_id[rules_order_amount[i].rule_id[0]].push(rules_order_amount[i]);
                    }
                }
            }
        }, {
            model: 'pos.loyalty.reward',
            fields: [],
            condition: function (self) {
                return self.loyalties && self.loyalties.length > 0;
            },
            domain: function (self) {
                return [['loyalty_id', 'in', self.loyalty_ids]]
            },
            loaded: function (self, rewards) {
                self.rewards = rewards;
                self.reward_by_id = {};
                self.rewards_by_loyalty_id = {};
                for (var i = 0; i < rewards.length; i++) {
                    self.reward_by_id[rewards[i].id] = rewards[i];
                    if (!self.rewards_by_loyalty_id[rewards[i].loyalty_id[0]]) {
                        self.rewards_by_loyalty_id[rewards[i].loyalty_id[0]] = [rewards[i]];
                    } else {
                        self.rewards_by_loyalty_id[rewards[i].loyalty_id[0]].push([rewards[i]]);
                    }
                }
            }
        }, {
            model: 'product.uom.price',
            fields: [],
            domain: [],
            loaded: function (self, uoms_prices) {
                self.uom_price_by_uom_id = {}
                self.uoms_prices_by_product_tmpl_id = {}
                self.uoms_prices = uoms_prices;
                for (var i = 0; i < uoms_prices.length; i++) {
                    var item = uoms_prices[i];
                    if (item.product_tmpl_id) {
                        self.uom_price_by_uom_id[item.uom_id[0]] = item;
                        if (!self.uoms_prices_by_product_tmpl_id[item.product_tmpl_id[0]]) {
                            self.uoms_prices_by_product_tmpl_id[item.product_tmpl_id[0]] = [item]
                        } else {
                            self.uoms_prices_by_product_tmpl_id[item.product_tmpl_id[0]].push(item)
                        }
                    }
                }
            }
        }, {
            model: 'product.barcode',
            fields: ['product_tmpl_id', 'quantity', 'list_price', 'uom_id', 'barcode', 'product_id'],
            domain: [],
            loaded: function (self, barcodes) {
                self.barcodes = barcodes;
                self.barcodes_by_barcode = {};
                for (var i = 0; i < barcodes.length; i++) {
                    if (!barcodes[i]['product_id']) {
                        continue
                    }
                    if (!self.barcodes_by_barcode[barcodes[i]['barcode']]) {
                        self.barcodes_by_barcode[barcodes[i]['barcode']] = [barcodes[i]];
                    } else {
                        self.barcodes_by_barcode[barcodes[i]['barcode']].push(barcodes[i]);
                    }
                }
            }
        }, {
            model: 'product.variant',
            fields: ['product_tmpl_id', 'value_id', 'price_extra', 'product_id', 'quantity', 'uom_id'],
            domain: [],
            loaded: function (self, variants) {
                self.variants = variants;
                self.variant_by_product_tmpl_id = {};
                self.variant_by_id = {};
                for (var i = 0; i < variants.length; i++) {
                    var variant = variants[i];
                    self.variant_by_id[variant.id] = variant;
                    if (!self.variant_by_product_tmpl_id[variant['product_tmpl_id'][0]]) {
                        self.variant_by_product_tmpl_id[variant['product_tmpl_id'][0]] = [variant]
                    } else {
                        self.variant_by_product_tmpl_id[variant['product_tmpl_id'][0]].push(variant)
                    }
                }
            }
        }, {
            model: 'pos.quickly.payment',
            fields: ['name', 'amount'],
            domain: [],
            context: {'pos': true},
            loaded: function (self, quickly_datas) {
                self.quickly_datas = quickly_datas;
                self.quickly_payment_by_id = {};
                for (var i = 0; i < quickly_datas.length; i++) {
                    self.quickly_payment_by_id[quickly_datas[i].id] = quickly_datas[i];
                }
            }
        }, {
            model: 'pos.voucher',
            fields: ['code', 'value', 'apply_type', 'method', 'use_date'],
            domain: [['state', '=', 'active']],
            context: {'pos': true},
            loaded: function (self, vouchers) {
                self.vouchers = vouchers;
                self.voucher_by_id = {};
                for (var x = 0; x < vouchers.length; x++) {
                    self.voucher_by_id[vouchers[x].id] = vouchers[x];
                }
            }
        }, {
            model: 'pos.order',
            condition: function (self) {
                return self.config.pos_orders_management;
            },
            fields: [],
            domain: [['state', '!=', 'cancel'], ['lock_return', '=', false]],
            loaded: function (self, orders) {
                self.order_ids = [];
                for (var i = 0; i < orders.length; i++) {
                    self.order_ids.push(orders[i].id)
                }
                self.db.save_pos_orders(orders);
            }
        }, {
            model: 'pos.order.line',
            fields: [],
            domain: [],
            condition: function (self) {
                return self.config.pos_orders_management;
            },
            loaded: function (self, order_lines) {
                self.db.save_pos_order_line(order_lines);
            }
        }, {
            model: 'account.invoice',
            condition: function (self) {
                return self.config.management_invoice;
            },
            fields: ['partner_id', 'origin', 'number', 'payment_term_id', 'date_invoice', 'state', 'residual', 'amount_tax', 'amount_total', 'type'],
            domain: [],
            context: {'pos': true},
            loaded: function (self, invoices) {
                self.db.save_invoices(invoices);
            }
        },
        {
            model: 'account.invoice.line',
            condition: function (self) {
                return self.config.management_invoice;
            },
            fields: [
                'invoice_id',
                'uom_id',
                'product_id',
                'price_unit',
                'price_subtotal',
                'quantity',
                'discount',
            ],
            domain: [],
            context: {'pos': true},
            loaded: function (self, invoice_lines) {
                self.db.save_invoice_lines(invoice_lines);
            }
        },
        {
            model: 'sale.order',
            fields: [
                'name',
                'origin',
                'client_order_ref',
                'state',
                'date_order',
                'validity_date',
                'confirmation_date',
                'user_id',
                'partner_id',
                'partner_invoice_id',
                'partner_shipping_id',
                'invoice_status',
                'payment_term_id',
                'note',
                'amount_tax',
                'amount_total',
                'picking_ids',
                'delivery_address',
                'delivery_date',
                'delivery_phone',
                'book_order',
                'payment_partial_amount',
                'payment_partial_journal_id',
            ],
            domain: [
                ['book_order', '=', true],
                ['state', '!=', 'cancel'],
                ['state', '!=', 'done']
            ],
            condition: function (self) {
                return self.config.booking_orders;
            },
            context: {'pos': true},
            loaded: function (self, orders) {
                self.db.save_sale_orders(orders);
            }
        }, {
            model: 'sale.order.line',
            fields: [
                'name',
                'product_id',
                'order_id',
                'price_unit',
                'price_subtotal',
                'price_tax',
                'price_total',
                'product_uom_qty',
                'qty_delivered',
                'qty_invoiced',
                'state'],
            domain: [['state', '!=', 'cancel'], ['state', '!=', 'done']],
            condition: function (self) {
                return self.config.booking_orders;
            },
            context: {'pos': true},
            loaded: function (self, order_lines) {
                self.order_lines = order_lines;
                self.db.save_sale_order_lines(order_lines);
            }
        },
        {
            model: 'account.payment.method',
            fields: ['name', 'code', 'payment_type'],
            domain: [],
            context: {'pos': true},
            loaded: function (self, payment_methods) {
                self.payment_methods = payment_methods;
            }
        }, {
            model: 'account.payment.term',
            fields: ['name'],
            domain: [],
            context: {'pos': true},
            loaded: function (self, payments_term) {
                self.payments_term = payments_term;
            }
        }, {
            model: 'product.pricelist.item',
            fields: [],
            domain: [],
            loaded: function (self, pricelist_items) {
                if (self.server_version == 10) {
                    _.each(pricelist_items, function (item) {
                        var pricelist = self.pricelist_by_id[item.pricelist_id[0]];
                        if (pricelist) {
                            pricelist.items.push(item);
                        }
                        item.base_pricelist = self.pricelist_by_id[item.base_pricelist_id[0]];
                    });
                }

            }
        }, {
            model: 'product.cross',
            fields: ['product_id', 'list_price', 'quantity', 'discount_type', 'discount', 'product_tmpl_id'],
            domain: [],
            loaded: function (self, cross_items) {
                self.cross_items = cross_items;
                self.cross_item_by_id = {};
                for (var i = 0; i < cross_items.length; i++) {
                    self.cross_item_by_id[cross_items[i]['id']] = cross_items[i];
                }
            }
        }, {
            model: 'product.suggestion',
            fields: ['product_id', 'list_price', 'quantity', 'product_tmpl_id'],
            domain: [],
            loaded: function (self, suggestion_items) {
                self.suggestion_items = suggestion_items;
                self.suggestion_by_id = {};
                for (var i = 0; i < suggestion_items.length; i++) {
                    self.suggestion_by_id[suggestion_items[i]['id']] = suggestion_items[i];
                }
            }
        }, {
            model: 'account.journal',
            fields: [],
            domain: function (self) {
                return [['id', 'in', self.config.invoice_journal_ids]]
            },
            loaded: function (self, journals) {
                self.journals = journals;
                self.journal_by_id = {};
                for (var i = 0; i < journals.length; i++) {
                    self.journal_by_id[journals[i]['id']] = journals[i];
                }
            },
        }, {
            model: 'medical.insurance',
            condition: function (self) {
                return self.config.medical_insurance;
            },
            fields: ['code', 'subscriber_id', 'patient_name', 'patient_number', 'rate', 'medical_number', 'employee', 'phone', 'product_id', 'insurance_company_id'],
            domain: function (self) {
                return []
            },
            loaded: function (self, insurances) {
                self.db.save_insurances(insurances);
            }
        }, {
            model: 'product.quantity.pack',
            condition: function (self) {
                return true;
            },
            fields: ['barcode', 'quantity', 'product_tmpl_id', 'public_price'],
            domain: function (self) {
                return []
            },
            loaded: function (self, quantities_pack) {
                self.quantities_pack = quantities_pack;
            }
        },
    ]);

    try {
        var _super_Product = models.Product.prototype;
        models.Product = models.Product.extend({
            get_price: function (pricelist, quantity) {
                var price = _super_Product.get_price.apply(this, arguments);
                return price;
            },
            get_price_with_tax: function (pricelist, quantity) {
                var price = this.get_price(pricelist, quantity);
                var taxes_id = this['taxes_id'];
                var tax_amount = 0;
                var base_amount = this['list_price'];
                if (taxes_id.length > 0) {
                    for (var index_number in taxes_id) {
                        var tax = self.posmodel.taxes_by_id[taxes_id[index_number]];
                        if (tax && tax.price_include) {
                            continue;
                        }
                        if (!tax) {
                            continue
                        } else {
                            if (tax.amount_type === 'fixed') {
                                var sign_base_amount = base_amount >= 0 ? 1 : -1;
                                tax_amount += Math.abs(tax.amount) * sign_base_amount;
                            }
                            if ((tax.amount_type === 'percent' && !tax.price_include) || (tax.amount_type === 'division' && tax.price_include)) {
                                tax_amount += base_amount * tax.amount / 100;
                            }
                            if (tax.amount_type === 'percent' && tax.price_include) {
                                tax_amount += base_amount - (base_amount / (1 + tax.amount / 100));
                            }
                            if (tax.amount_type === 'division' && !tax.price_include) {
                                tax_amount += base_amount / (1 - tax.amount / 100) - base_amount;
                            }
                        }
                    }
                }
                return price + tax_amount;
            }
        })
    } catch (e) {
        console.error('->> version now is 10');
    }


});
