odoo.define('pos_retail.synchronization', function (require) {
    var models = require('point_of_sale.models');
    var rpc = require('pos.rpc');
    var exports = {}
    var Backbone = window.Backbone;
    var bus = require('bus.bus');
    var core = require('web.core');
    var _t = core._t;
    var session = require('web.session');

    exports.pos_bus = Backbone.Model.extend({
        initialize: function (pos) {
            var self = this;
            this.pos = pos;
            this.stop = false;
            setInterval(function () {
                self.repush_to_another_sessions();
            }, 15000);
        },
        push_message_to_other_sessions: function (value) {
            if (this.pos.the_first_load || this.pos.the_first_load == undefined || !this.pos.config.bus_id) { // when cashier come back pos screen (reload browse) no need sync data
                return;
            }
            var self = this;
            if (!value['order_uid']) {
                return;
            }
            var message = {
                user_send_id: this.pos.user.id,
                value: value,
            };
            var params = {
                bus_id: self.pos.config.bus_id[0],
                messages: [message],
            };
            var sending = function () {
                return session.rpc("/pos/sync", params);
            };
            return sending().fail(function (error, e) {
                console.error(error.message);
                if (error.message == "XmlHttpRequestError ") {
                    self.pos.db.add_datas_false(message);
                }
            }).done(function () {
                self.pos.trigger('reload:kitchen_screen');
            })
        },
        get_message_from_other_sessions: function (messages) {
            for (var i = 0; i < messages.length; i++) {
                var message = messages[i];
                if (!message || message.length < 2) {
                    continue;
                }
                var channel = message[0][1];
                if (message[0] && channel && channel == 'pos.bus') {
                    var message = JSON.parse(message[1]);
                    this.pos.syncing_sessions(message['value']);
                }
            }
        },
        start: function () {
            this.bus = bus.bus;
            this.bus.last = this.pos.db.load('bus_last', 0);
            this.bus.on("notification", this, this.get_message_from_other_sessions);
            this.bus.start_polling();
        },
        repush_to_another_sessions: function () {
            var self = this;
            if (!self.pos.config.bus_id) {
                return;
            }
            var datas_false = this.pos.db.get_datas_false();
            if (datas_false && datas_false.length) {
                var sending = function () {
                    return session.rpc("/pos/sync", {
                        bus_id: self.pos.config.bus_id[0],
                        messages: datas_false
                    });
                };
                sending().fail(function () {
                    console.error('No internet');
                    self.pos.gui.show_popup('notify_popup', {
                        title: 'Warning',
                        from: 'top',
                        align: 'center',
                        body: 'Your internet have problem or Odoo Server offline mode. Please contact cashier admin if have any order, update lines',
                        color: 'danger',
                        timer: 1000
                    });
                }).done(function () {
                    for (var i = 0; i < datas_false.length; i++) {
                        self.pos.db.remove_data_false(datas_false[i]['sequence']);
                    }
                    self.pos.gui.show_popup('notify_popup', {
                        title: 'ALERT',
                        from: 'top',
                        align: 'center',
                        body: 'Odoo online mode, you can do anything. Thanks for wait',
                        color: 'success',
                        timer: 1000
                    });
                })
            }
        }
    });
    var _super_PosModel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        isEmpty: function (obj) {
            return Object.keys(obj).length === 0;
        },
        load_orders: function () {
            this.the_first_load = true;
            try {
                _super_PosModel.load_orders.apply(this, arguments);
            } catch (ex) {
                console.error(ex);
            }
            if (this.config.bus_id && this.bus_logs && this.bus_logs.length) {
                for (var i = 0; i < this.bus_logs.length; i++) {
                    var log = this.bus_logs[i];
                    this.syncing_sessions(log['value']);
                }
            }
            this.the_first_load = false;
        },
        on_removed_order: function (removed_order, index, reason) { // no need change screen when syncing remove order
            if (removed_order.syncing == true) {
                return;
            } else {
                var res = _super_PosModel.on_removed_order.apply(this, arguments);
            }
        },
        get_order_by_uid: function (uid) {
            var orders = this.get('orders').models;
            var order = orders.find(function (order) {
                return order.uid == uid;
            });
            return order;
        },
        get_line_by_uid: function (uid) {
            var line_by_uid = [];
            var orders = this.get('orders').models;
            for (var i = 0; i < orders.length; i++) {
                var order = orders[i];
                for (var j = 0; j < order.orderlines.models.length; j++) {
                    line_by_uid[order.orderlines.models[j]['uid']] = order.orderlines.models[j];
                }
            }
            return line_by_uid[uid];
        },
        syncing_sessions: function (message) {
            var action = message['action'];
            if (action == 'selected_order') {
                this.sync_selected_order(message['data']);
            }
            if (action == 'new_order') {
                this.sync_order_adding(message['data']);
            }
            if (action == 'unlink_order' || action == 'paid_order') {
                this.sync_order_removing(message['data']);
            }
            if (action == 'line_removing') {
                this.sync_line_removing(message['data']);
            }
            if (action == 'set_client') {
                this.sync_set_client(message['data']);
            }
            if (action == 'trigger_update_line') {
                this.sync_trigger_update_line(message['data']);
            }
            if (action == 'change_pricelist') {
                this.sync_change_pricelist(message['data']);
            }
            if (action == 'sync_sequence_number') {
                this.pos_session.sequence_number = message['data']['sequence_number'];
            }
            if (action == 'set_line_note') {
                this.sync_set_line_note(message['data']);
            }
            if (action == 'lock_order') {
                this.sync_lock_order(message['data']);
            }
            if (action == 'unlock_order') {
                this.sync_unlock_order(message['data']);
            }
        },
        sync_lock_order: function (uid) {
            var orders = this.get('orders', []);
            var order = _.find(orders.models, function (order) {
                return order['uid'] === uid;
            });
            if (order) {
                order.lock = true;
                var current_order = this.get_order();
                // manager no lock
                if (this.config.lock_order_printed_receipt && current_order && current_order['uid'] == order['uid']) {
                    this.lock_order()
                }
                // clients will lock
                order.trigger('change', order);
                return true
            }
        },
        sync_unlock_order: function (uid) {
            var orders = this.get('orders', []);
            var order = _.find(orders.models, function (order) {
                return order['uid'] === uid;
            });
            if (order) {
                order.lock = false;
                var current_order = this.get_order();
                if (current_order && current_order['uid'] == order['uid']) {
                    this.unlock_order()
                }
                return true
            }
        },
        sync_set_line_note: function (vals) {
            var line = this.get_line_by_uid(vals['uid']);
            if (line) {
                line.syncing = true;
                line.set_line_note(vals['note']);
                line.syncing = false;
                return true
            }
        },
        check_order_have_exist: function (val) {
            var orders = this.get('orders', []);
            var orders_exist = _.filter(orders.models, function (order) {
                return order['uid'] === val['uid'];
            });
            if (orders_exist.length == 0) {
                return false
            } else {
                return true
            }
        },
        sync_selected_order: function (vals) {
            if (!this.config.is_customer_screen) {
                return true;
            }
            var order_exist = this.check_order_have_exist(vals);
            if (!order_exist) {
                return false;
            } else {
                var order = this.get_order_by_uid(vals['uid']);
                if (order) {
                    this.set('selectedOrder', order);
                    var order = this.get_order();
                    $('.pos .leftpane').css('left', '0px');
                    $('.pos .rightpane').css('left', '440px');
                    if (order && order.orderlines.length) {
                        var $orderwidget = $('.order-scroller');
                        $orderwidget.scrollTop(1000000);
                        $('.btn').remove();
                        $('.bus-info').remove();
                        $('.oe_link_icon').remove();
                    }
                }
                return true;
            }
        },
        sync_order_adding: function (vals) {
            var orders = this.get('orders', []);
            var order_exist = this.check_order_have_exist(vals);
            if (order_exist) {
                return false;
            }
            if (vals.floor_id && vals.table_id) {
                // if data notification have floor_id and table_id
                // and current session have floor_id and table_id data the same
                // else continue
                if (this.floors_by_id && this.floors_by_id[vals.floor_id] && this.tables_by_id && this.tables_by_id[vals.table_id]) {
                    var table = this.tables_by_id[vals.table_id];
                    var floor = this.floors_by_id[vals.floor_id];
                    var orders = this.get('orders');
                    if (table && floor) {
                        var order = new models.Order({}, {pos: this, json: vals});
                        this.order_sequence += 1;
                        order.syncing = true;
                        orders.add(order);
                        order.trigger('change', order);
                        order.syncing = false;
                    }
                }
            } else {
                // neu data nhận vào không có floor ID và table ID
                // nhưng bản thân session này có floor và table thì cũng ko cho sync
                if (this.floors != undefined) {
                    if (this.floors.length > 0) {
                        return null;
                    }
                }
                var order = new models.Order({}, {pos: this, json: vals});
                order.syncing = true;
                orders.add(order);
                order.trigger('change', order);
                order.syncing = false;
                if (orders.length == 1) {
                    this.set('selectedOrder', order);
                }
            }
        },
        is_restaurant_screen: function () {
            var classes = this.gui.screen_classes;
            var floor = _.find(classes, function (class_screen) {
                return class_screen['name'] && class_screen['name'] == 'floors';
            });
            return floor;
        },
        sync_order_removing: function (uid) {
            var self = this;
            var order = this.get_order_by_uid(uid);
            if (order) {
                var floor = this.is_restaurant_screen();
                var selected_order = this.get_order();
                order.syncing = true;
                if (selected_order && selected_order['uid'] == order['uid']) {
                    if (floor && this.floor_ids && this.floor_ids.length > 0) { // pos config have add floors and tables
                        this.gui.show_screen('floors')
                    } else {     // pos config have not add floor and tables
                        var orders = self.get('orders', []);
                        if (orders.models.length > 0) {
                            this.set('selectedOrder', orders.models[0]);
                        } else {
                            this.add_new_order();
                        }
                    }
                }
                this.db.remove_order(order.id);
                order.destroy({'reason': 'abandon'});
                self.trigger('reset:count_item');

            }
        },
        sync_line_removing: function (vals) {
            var line = this.get_line_by_uid(vals['uid']);
            if (line) {
                line.syncing = true;
                line.order.orderlines.remove(line);
                line.order.trigger('change', line.order)
                line.syncing = false;
            }
        },
        sync_set_client: function (vals) {
            var partner_id = vals['partner_id'];
            var uid = vals['uid'];
            var client = this.db.get_partner_by_id(partner_id);
            var order = this.get_order_by_uid(uid)
            if (!order || order.finalized == true) { // if not order or order final submitted backend, return
                return false;
            }
            if (!partner_id) {
                order.syncing = true;
                order.set_client(null);
                order.syncing = false;
                return order.trigger('change', order)
            }
            if (!client) {
                var self = this;
                var fields = _.find(this.models, function (model) {
                    return model.model === 'res.partner';
                }).fields;
                return rpc.query({
                    model: 'res.partner',
                    method: 'search_read',
                    args: [[['id', '=', partner_id]]],
                }).then(function (partners) {
                    if (partners.length == 1) {
                        self.db.add_partners(partners)
                        order.syncing = true;
                        order.set_client(partners[0])
                        order.trigger('change', order)
                        order.syncing = false;
                    } else {
                        console.errorg('Loading new partner fail networking')
                    }
                }).fail(function (type, error) {
                    return self.pos.query_backend_fail(type, error);
                });
            } else {
                order.syncing = true;
                order.set_client(client)
                order.trigger('change', order)
                order.syncing = false;
            }
        },
        sync_trigger_update_line: function (vals) {
            var line = this.get_line_by_uid(vals['uid']);
            var product = this.db.get_product_by_id(vals['line']['product_id'])
            var order = this.get_order_by_uid(vals['line']['order_uid']);
            var json = vals['line'];
            if (line) { // step 1: remove old line
                line.syncing = true;
                if (line.order.selected_orderline && line.order.selected_orderline.uid == line.uid) {
                    line.order.selected_orderline = undefined;
                }
                line.order.orderlines.remove(line);
                line.order.trigger('change', line.order)
                line.syncing = false;
            }
            if (order && product) { // step 2: create new line
                order.syncing = true;
                var new_line = new models.Orderline({}, {
                    pos: this,
                    order: order,
                    product: product,
                    json: json
                });
                if (json['is_return']) {
                    new_line.set_quantity(-new_line.quantity, 'keep price change when sync session.')
                } else {
                    new_line.set_quantity(new_line.quantity, 'keep price change when sync session.')
                }
                if (json['redeem_point']) {
                    new_line['redeem_point'] = json['redeem_point'];
                }
                new_line.set_unit_price(json['price_unit']); // keep price from other sessions
                order.orderlines.add(new_line);
                order.trigger('change', order);
                order.syncing = false;
            }
        },
        sync_change_pricelist: function (vals) {
            var order = this.get_order_by_uid(vals['uid'])
            var pricelist = _.findWhere(this.pricelists, {id: vals['pricelist_id']});
            if (!order || !pricelist) {
                console.error('sync pricelist but have difference pricelist between 2 sessions')
                return null
            }
            if (order && pricelist) {
                order.pricelist = pricelist;
                order.trigger('change', order)
            }
        },
        load_server_data: function () { // active sync between pos sessions
            var self = this;
            return _super_PosModel.load_server_data.apply(this, arguments).then(function () {
                if (self.config.bus_id) {
                    self.chrome.loading_message(_t('Active sync between sessions'), 1);
                    self.pos_bus = new exports.pos_bus(self);
                    self.pos_bus.start(); // start syncing between sessions
                }
            })
        },
        session_info: function () {
            var user;
            if (this.get('cashier')) {
                user = this.get('cashier');
            } else {
                user = this.user;
            }
            return {
                'bus_id': this.config.bus_id[0],
                'user': {
                    'id': user.id,
                    'name': user.name
                },
                'pos': {
                    'id': this.config.id,
                    'name': this.config.name
                },
                'date': new Date().toLocaleTimeString()
            }
        },
        get_session_info: function () {
            var order = this.get_order();
            if (order) {
                return order.get_session_info();
            }
            return null;
        }
    });
    var _super_order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function (attributes, options) {
            var self = this;
            var res = _super_order.initialize.apply(this, arguments);
            if (!this.created_time) {
                this.created_time = new Date().toLocaleTimeString();
            }
            if (this.pos.pos_bus) {
                this.bind('add', function (order) { // syncing New order
                    if ((self.pos.the_first_load == false || !self.pos.the_first_load) && (order.syncing != true || !order.syncing) && (order.temporary == false || !order.temporary) && self.pos.config.bus_id && self.pos.config.bus_id[0]) {
                        self.pos.pos_bus.push_message_to_other_sessions({
                            data: order.export_as_JSON(),
                            action: 'new_order',
                            bus_id: self.pos.config.bus_id[0],
                            order_uid: order['uid']
                        });
                        self.pos.pos_bus.push_message_to_other_sessions({
                            data: {
                                sequence_number: self.pos.pos_session.sequence_number
                            },
                            action: 'sync_sequence_number',
                            bus_id: self.pos.config.bus_id[0],
                            order_uid: order['uid']
                        });
                    }

                });
                this.bind('remove', function (order) { // syncing remove order
                    if ((order.syncing != true || !order.syncing) && self.pos.config.bus_id && self.pos.config.bus_id[0]) {
                        self.pos.pos_bus.push_message_to_other_sessions({
                            data: order.uid,
                            action: 'unlink_order',
                            bus_id: self.pos.config.bus_id[0],
                            order_uid: order['uid']
                        });
                        self.pos.trigger('update:count_item');
                    }
                });
                this.orderlines.bind('add', function (line) {
                    if (line.order.temporary == false && (!line.order.syncing || line.order.syncing == false) && self.pos.config.bus_id[0]) {
                        line.trigger_update_line();
                    }
                })
            }
            if (!this.session_info) {
                this.session_info = this.pos.session_info();
            }
            return res;
        },
        finalize: function () {
            var self = this;
            if (this.pos.pos_bus && (this.syncing != true || !this.syncing) && this.pos.config.bus_id && this.pos.config.bus_id[0]) {
                var order_json = this.export_as_JSON();
                setTimeout(function () {
                    self.pos.pos_bus.push_message_to_other_sessions({
                        data: order_json.uid,
                        action: 'paid_order',
                        bus_id: self.pos.config.bus_id[0],
                        order_uid: order_json['uid']
                    });
                }, 3000);

            }
            return _super_order.finalize.apply(this, arguments);

        },
        get_session_info: function () {
            return this.session_info;
        },
        set_client: function (client) {
            var self = this;
            var res = _super_order.set_client.apply(this, arguments);
            var order = this.pos.get_order();
            if (order && client) {
                var medical_insurance = this.pos.db.insurance_by_partner_id[client.id];
                if (medical_insurance) {
                    order.medical_insurance = medical_insurance;
                    order.trigger('change', order)
                    self.pos.trigger('change:medical_insurance');
                }
            }
            if (client && client['property_product_pricelist']) {
                var pricelist_id = client['property_product_pricelist'][0];
                var pricelist = _.find(this.pos.pricelists, function (pricelist) {
                    return pricelist['id'] == pricelist_id;
                })
                if (this.pos.server_version == 11 && pricelist && !this.is_return) { // we're don't want set price list for order return
                    this.set_pricelist(pricelist)
                }
                if (this.pos.server_version == 10 && pricelist && !this.is_return) { // we're don't want set price list for order return
                    this.set_pricelist_to_order(pricelist)
                }
            }
            if (client && client['property_account_position_id']) { // if client have fiscal position auto change tax amount
                var property_account_position_id = client['property_account_position_id'][0];
                var fiscal_potion = _.find(this.pos.fiscal_positions, function (fiscal) {
                    return fiscal.id == property_account_position_id;
                });
                if (fiscal_potion && order) {
                    order.fiscal_position = fiscal_potion;
                    _.each(order.orderlines.models, function (line) {
                        line.set_quantity(line.quantity);
                    });
                    order.trigger('change');
                }
            }
            if (client && !client['property_account_position_id']) { // if client have not fiscal position, auto reset to default fiscal postion config on pos config
                if (!this.pos.config.fiscal_position_auto_detect) {
                    var default_fiscal_position_id = this.pos.config.default_fiscal_position_id[0];
                    var fiscal_potion = _.find(this.pos.fiscal_positions, function (fiscal) {
                        return fiscal.id == default_fiscal_position_id;
                    });
                    if (fiscal_potion && order) {
                        order.fiscal_position = fiscal_potion;
                        _.each(order.orderlines.models, function (line) {
                            line.set_quantity(line.quantity);
                        });
                        order.trigger('change');
                    }
                } else {
                    rpc.query({
                        model: 'account.fiscal.position',
                        method: 'get_fiscal_position',
                        args: [client['id'], client['id']],
                        context: {}
                    }).then(function (fiscal_potion_id) {
                        var order = self.pos.get_order();
                        var fiscal_potion = _.find(self.pos.fiscal_positions, function (fiscal) {
                            return fiscal.id == fiscal_potion_id;
                        });
                        if (fiscal_potion) {
                            order.fiscal_position = fiscal_potion;
                            _.each(order.orderlines.models, function (line) {
                                line.set_quantity(line.quantity);
                            });
                            order.trigger('change');
                        }
                    })
                }
            }
            if ((!this.syncing || this.syncing == false) && this.pos.pos_bus && this.pos.the_first_load == false) {
                var order = this.export_as_JSON()
                if (client) {
                    this.pos.pos_bus.push_message_to_other_sessions({
                        data: {
                            uid: order['uid'],
                            partner_id: client.id
                        },
                        action: 'set_client',
                        bus_id: this.pos.config.bus_id[0],
                        order_uid: order['uid']
                    });
                }
                if (!client) {
                    this.pos.pos_bus.push_message_to_other_sessions({
                        data: {
                            uid: order['uid'],
                            partner_id: null
                        },
                        action: 'set_client',
                        bus_id: this.pos.config.bus_id[0],
                        order_uid: order['uid']
                    });
                }
            }
            return res;
        },
        set_pricelist: function (pricelist) { // only v11 have
            if (!this.is_return) { // if order return, block change pricelist
                _super_order.set_pricelist.apply(this, arguments);
            }
            if (this.pos.pos_bus && (this.syncing != true || !this.syncing) && this.pos.pos_bus && this.pos.config.bus_id && this.pos.config.bus_id[0] && this.pos.the_first_load == false) {
                var order = this.export_as_JSON();
                if (!order['uid']) {
                    return;
                }
                this.pos.pos_bus.push_message_to_other_sessions({
                    data: {
                        uid: order['uid'],
                        pricelist_id: pricelist['id']
                    },
                    action: 'change_pricelist',
                    bus_id: this.pos.config.bus_id[0],
                    order_uid: order['uid']
                });
            }
        },
        init_from_JSON: function (json) {
            _super_order.init_from_JSON.apply(this, arguments);
            this.uid = json.uid;
            this.session_info = json.session_info;
            this.created_time = json.created_time;
            if (!this.session_info) {
                this.session_info = this.pos.session_info();
            }
        },
        export_as_JSON: function () {
            var json = _super_order.export_as_JSON.apply(this, arguments);
            json.session_info = this.session_info;
            json.uid = this.uid;
            json.temporary = this.temporary;
            json.created_time = this.created_time;
            return json;
        }
    });
    // Model: Orderline
    var _super_order_line = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function (attr, options) {
            var res = _super_order_line.initialize.apply(this, arguments);
            if (!this.session_info) {
                this.session_info = this.pos.session_info();
            }
            if (!this.uid) {
                var uid = this.order.uid + '-' + this.id;
                this.uid = uid;
            }
            this.order_uid = this.order.uid;
            var self = this;
            this.bind('update:OrderLine', function () {
                self.trigger_update_line();
            });
            if (this.pos.pos_bus) {
                this.bind('remove', function () {
                    if ((this.syncing == false || !this.syncing) && self.pos.config.bus_id[0]) {
                        var order = self.order.export_as_JSON();
                        self.pos.pos_bus.push_message_to_other_sessions({
                            action: 'line_removing',
                            data: {
                                uid: self.uid,
                            },
                            bus_id: this.pos.config.bus_id[0],
                            order_uid: order['uid']
                        });
                    }
                })
            }
            return res;
        },
        init_from_JSON: function (json) {
            if (json['pack_lot_ids']) {
                json.pack_lot_ids = [];
            }
            var res = _super_order_line.init_from_JSON.apply(this, arguments);
            this.uid = json.uid;
            this.session_info = json.session_info;
            return res;
        },
        export_as_JSON: function () {
            var json = _super_order_line.export_as_JSON.apply(this, arguments);
            json.uid = this.uid;
            json.session_info = this.session_info;
            json.order_uid = this.order.uid;
            return json;
        },
        set_quantity: function (quantity, keep_price) {
            var res = _super_order_line.set_quantity.apply(this, arguments);
            if ((!this.syncing || this.syncing == false) && (this.order.syncing == false || !this.order.syncing) && (this.uid && this.order.temporary == false)) {
                if (quantity != "remove") {
                    this.trigger_update_line();
                }
            }
            return res
        },
        set_discount: function (discount) {
            var res = _super_order_line.set_discount.apply(this, arguments);
            if ((!this.syncing || this.syncing == false) && (this.order.syncing == false || !this.order.syncing) && (this.uid && this.order.temporary == false)) {
                this.trigger_update_line();
            }
            return res
        },
        set_unit_price: function (price) {
            var res = _super_order_line.set_unit_price.apply(this, arguments);
            if ((!this.syncing || this.syncing == false) && (this.order.syncing == false || !this.order.syncing) && (this.uid && this.order.temporary == false)) {
                this.trigger_update_line();
            }
            return res
        },
        trigger_update_line: function () {
            var line = this.export_as_JSON();
            if (this.pos.pos_bus && (!this.syncing || this.syncing == false) && (this.order.syncing == false || !this.order.syncing) && (this.uid && this.order.temporary == false) && this.pos.config.bus_id[0]) {
                var order = this.order.export_as_JSON();
                this.pos.pos_bus.push_message_to_other_sessions({
                    action: 'trigger_update_line',
                    data: {
                        uid: line.uid,
                        line: line
                    },
                    bus_id: this.pos.config.bus_id[0],
                    order_uid: order['uid'],
                });
            }
        }
    });
    return exports;
});
