odoo.define('pos_retail.pos_chanel', function (require) {
    var models = require('point_of_sale.models');
    var exports = {};
    var Backbone = window.Backbone;
    var bus = require('bus.bus');

    exports.sync_backend = Backbone.Model.extend({ // chanel 2: pos sync backend
        initialize: function (pos) {
            this.pos = pos;
        },
        start: function () {
            this.bus = bus.bus;
            this.bus.last = this.pos.db.load('bus_last', 0);
            this.bus.on("notification", this, this.on_notification);
            this.bus.start_polling();
        },
        on_notification: function (notifications) {
            if (notifications && notifications[0] && notifications[0][1]) {
                for (var i = 0; i < notifications.length; i++) {
                    var channel = notifications[i][0][1];
                    if (channel == 'pos.sync.data') {
                        this.sync_with_backend(notifications[i][1]);
                    }
                }
            }
        },
        sync_with_backend: function (data) {
            var model = data['model'];
            if (model == 'product.product') {
                this.pos.syncing_product(data);
            }
            if (model == 'res.partner') {
                this.pos.syncing_partner(data);
            }
            if (model == 'product.pricelist' && this.pos.config.sync_pricelist == true) {
                this.pos.syncing_pricelist(data)
            }
            if (model == 'product.pricelist.item' && this.pos.config.sync_pricelist == true) {
                this.pos.syncing_pricelist_item(data)
            }
            if (model == 'account.invoice' && this.pos.config.management_invoice) {
                this.pos.db.save_data_sync_invoice(data);
                this.pos.trigger('update:invoice');
            }
            if (model == 'account.invoice.line' && this.pos.config.management_invoice) {
                this.pos.db.save_data_sync_invoice_line(data);
                this.pos.trigger('update:invoice');
            }
            if (model == 'pos.order' && this.pos.config.management_invoice) {
                this.pos.db.save_data_sync_order(data);
                this.pos.trigger('update:order');
            }
            if (model == 'pos.order.line' && this.pos.config.management_invoice) {
                this.pos.db.save_data_sync_order_line(data);
            }
            if (model == 'sale.order' && this.pos.config.sync_sale_order == true) {
                this.pos.db.sync_sale_order(data);
                this.pos.trigger('sync:sale_orders', data['id']);
            }
            if (model == 'sale.order.line' && this.pos.config.sync_sale_order == true) {
                this.pos.db.sync_sale_order_lines(data);
                this.pos.trigger('sync:sale_orders', data['id']);
            }
            if (model == 'res.partner') {
                this.pos.trigger('reload:screen_partners');
            }
            if (model == 'product.product') {
                this.pos.trigger('reload:screen_products');
            }
            var old_caches = this.pos.database[model];
            var new_caches = _.filter(old_caches, function (cache) {
                return cache['id'] != data['id'];
            });
            new_caches.push(data);
            this.pos.database[model] = new_caches;
        }
    });

    var _super_posmodel = models.PosModel.prototype;
    models.PosModel = models.PosModel.extend({
        load_server_data: function () {
            var self = this;
            return _super_posmodel.load_server_data.apply(this, arguments).then(function () {
                self.sync_backend = new exports.sync_backend(self);
                self.sync_backend.start();
            })
        },
        syncing_product: function (product_data) {
            this.trigger('sync:product', product_data);
        },
        syncing_partner: function (customer_data) {
            this.trigger('sync:partner', customer_data);
        },
        syncing_pricelist: function (pricelist_data) {
            if (this.default_pricelist && this.default_pricelist['id'] == pricelist_data['id']) {
                pricelist_data['items'] = this.default_pricelist['items']
                this.default_pricelist = pricelist_data;
            }
            if (this.pricelists) {
                for (var i = 0; i < this.pricelists.length; i++) {
                    if (this.pricelists[i]['id'] == pricelist_data['id']) {
                        pricelist_data['items'] = this.pricelists[i]['items']
                        this.pricelists[i] = pricelist_data;
                    }
                }
            }
        },
        syncing_pricelist_item: function (pricelist_item) {
            var pricelist_by_id = {};
            _.each(this.pricelists, function (pricelist) {
                pricelist_by_id[pricelist.id] = pricelist;
            });
            var pricelist = pricelist_by_id[pricelist_item.pricelist_id[0]];
            if (pricelist) {
                var append_items = false;
                for (var i = 0; i < pricelist.items.length; i++) {
                    if (pricelist.items[i]['id'] == pricelist_item['id']) {
                        pricelist.items[i] = pricelist_item;
                        append_items = true
                    }
                }
                if (append_items == false) {
                    pricelist.items.push(pricelist_item);
                }
            }
        },
    });

    var db = require('point_of_sale.DB');
    db.include({
        save_data_sync_order: function (new_order) { // sync pos order between backend and pos
            var old_orders = _.filter(this.orders_store, function (old_order) {
                return old_order['id'] != new_order['id']
            });
            old_orders.push(new_order);
            this.orders_store = old_orders;
            if (new_order.partner_id) {
                var partner = this.get_partner_by_id(new_order.partner_id[0]);
                new_order.partner = partner;
            }
            this.order_by_id[new_order['id']] = new_order;
            this.order_by_ean13[new_order.ean13] = new_order;

            this.pos_orders_autocomplete = _.filter(this.pos_orders_autocomplete, function (data) {
                return data['value'] != new_order['id'];
            });
            var label = new_order['name']; // auto complete
            if (new_order['ean13']) {
                label += ', ' + new_order['ean13']
            }
            if (new_order['pos_reference']) {
                label += ', ' + new_order['pos_reference']
            }
            if (new_order.partner_id) {
                var partner = this.get_partner_by_id(new_order.partner_id[0]);
                if (partner) {
                    label += ', ' + partner['name'];
                    if (partner['email']) {
                        label += ', ' + partner['email']
                    }
                    if (partner['phone']) {
                        label += ', ' + partner['phone']
                    }
                    if (partner['mobile']) {
                        label += ', ' + partner['mobile']
                    }
                }
            }
            this.pos_orders_autocomplete.push({
                value: new_order['id'],
                label: label
            })
            this.order_search_string = "";
            for (var i = 0; i < this.orders_store.length; i++) {
                var order = this.orders_store[i]
                this.order_search_string += this._order_search_string(order);
            }
        },
        save_data_sync_order_line: function (new_order_line) {
            var old_line = this.order_line_by_id[new_order_line['id']];
            if (!old_line) {
                this.order_line_by_id[new_order_line['id']] = new_order_line;
                if (!this.lines_by_order_id[new_order_line.order_id[0]]) {
                    this.lines_by_order_id[new_order_line.order_id[0]] = [new_order_line]
                } else {
                    this.lines_by_order_id[new_order_line.order_id[0]].push(new_order_line)
                }
            } else {
                this.order_line_by_id[new_order_line['id']] = new_order_line;
                this.pos_order_lines = _.filter(this.pos_order_lines, function (line) {
                    return line['id'] != new_order_line['id'];
                })
            }
            this.pos_order_lines.push(new_order_line)

        },
        save_data_sync_invoice: function (invoice) {
            var old_invoice = this.invoice_by_id[invoice['id']];
            if (!old_invoice) {
                this.invoices.push(invoice);
                this.invoice_by_id[invoice.id] = invoice;
                if (!this.invoice_by_partner_id[invoice.partner_id[0]]) {
                    this.invoice_by_partner_id[invoice.partner_id[0]] = [invoice]
                } else {
                    this.invoice_by_partner_id[invoice.partner_id[0]].push(invoice);
                }
                this.invoice_search_string += this._invoice_search_string(invoice);
            } else {
                this.invoices = _.filter(this.invoices, function (old_invoice) {
                    return old_invoice['id'] != invoice['id'];

                });
                this.invoices.push(invoice);
                this.invoice_by_id[invoice.id] = invoice;
                if (!this.invoice_by_partner_id[invoice.partner_id[0]]) {
                    this.invoice_by_partner_id[invoice.partner_id[0]] = [invoice]
                } else {
                    this.invoice_by_partner_id[invoice.partner_id[0]].push(invoice);
                }
                this.invoice_search_string = "";
                for (var i = 0; i < this.invoices.length; i++) {
                    var invoice = this.invoices[i]
                    this.invoice_search_string += this._invoice_search_string(invoice);
                }
            }

        },
        sync_sale_order: function (new_sale_order) { // sync sale order between backend and pos
            var old_sale_order = _.find(this.sale_orders, function (old_order) {
                return old_order['id'] == new_sale_order['id']
            });
            var old_sale_orders = _.filter(this.sale_orders, function (old_order) {
                return old_order['id'] != new_sale_order['id']
            });
            old_sale_orders.push(new_sale_order);
            this.sale_orders = old_sale_orders;
            if (new_sale_order.partner_id) {
                var partner = this.get_partner_by_id(new_sale_order.partner_id[0]);
                if (partner) {
                    new_sale_order.partner = partner;
                }
            }
            this.sale_order_by_id[new_sale_order['id']] = new_sale_order;
            this.sale_order_by_name[new_sale_order['name']] = new_sale_order;
            this.sale_orders_autocomplete = _.filter(this.sale_orders_autocomplete, function (data) {
                return data['value'] != new_sale_order['id'];
            })
            var label = new_sale_order['name']; // auto complete
            if (new_sale_order['origin']) {
                label += ',' + new_sale_order['origin'];
            }
            if (new_sale_order.partner_id) {
                var partner = this.get_partner_by_id(new_sale_order.partner_id[0]);
                if (partner) {
                    label += ', ' + partner['name'];
                    if (partner['email']) {
                        label += ', ' + partner['email']
                    }
                    if (partner['phone']) {
                        label += ', ' + partner['phone']
                    }
                    if (partner['mobile']) {
                        label += ', ' + partner['mobile']
                    }
                }
            }
            this.sale_orders_autocomplete.push({
                value: new_sale_order['id'],
                label: label
            })
            this.sale_search_string = "";
            for (var i = 0; i < this.sale_orders.length; i++) {
                var sale = this.sale_orders[i]
                this.sale_search_string += this._sale_order_search_string(sale);
            }
            if (!old_sale_order && self.posmodel.config.booking_orders_alert == true && self.posmodel.the_first_load != undefined) {
                self.posmodel.gui.show_popup('confirm', {
                    title: 'Have new order',
                    body: new_sale_order['name'] + ' created, are you want review ?',
                    confirm: function () {
                        this.pos.sale_selected = new_sale_order;
                        this.pos.gui.show_screen('sale_orders');
                        return this.pos.gui.close_popup();
                    },
                    cancel: function () {
                        return this.pos.gui.close_popup();
                    }
                });
            }
        },
        sync_sale_order_lines: function (line) {
            var order_id = line.order_id[0];
            var order_lines = this.sale_lines_by_sale_id[order_id];
            if (!order_lines) {
                this.sale_lines_by_sale_id[order_id] = [line];
            } else {
                var exist = false;
                for (var i = 0; i < order_lines.length; i++) {
                    var old_line = order_lines[i];
                    if (old_line.id == line.id) {
                        old_line = line;
                        exist = true
                    }
                }
                if (exist == false) {
                    this.sale_lines_by_sale_id[order_id].push(line);
                }
            }
        },
    });

    return exports;
});
