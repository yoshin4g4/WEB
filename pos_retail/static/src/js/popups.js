odoo.define('pos_retail.popups', function (require) {

    var core = require('web.core');
    var _t = core._t;
    var gui = require('point_of_sale.gui');
    var PopupWidget = require('point_of_sale.popups');
    var rpc = require('pos.rpc');
    var qweb = core.qweb;

    // print vouchers
    var popup_print_vouchers = PopupWidget.extend({
        template: 'popup_print_vouchers',
        show: function (options) {
            var self = this;
            this._super(options);
            $('.print-voucher').click(function () {
                self.click_confirm();
            });
            $('.cancel').click(function () {
                self.click_cancel();
            });
        }
    });
    gui.define_popup({
        name: 'popup_print_vouchers',
        widget: popup_print_vouchers
    });

    var popup_selection_combos = PopupWidget.extend({ // select combo
        template: 'popup_selection_combos',
        show: function (options) {
            // options.combo_items: combo if product selected
            // options.selected_orderline: line selected
            var self = this;
            var combo_items = options.combo_items;
            var selected_orderline = options.selected_orderline;
            var combo_items_selected = selected_orderline['combo_items'];
            for (var i=0; i < combo_items.length; i++) {
                var combo_line = combo_items[i];
                var combo_line_selected = _.find(combo_items_selected, function (line) {
                    return line.id == combo_line.id;
                })
                if (combo_line_selected) {
                    combo_line['selected'] = true;
                } else {
                    combo_line['selected'] = false;
                }
            }
            this._super(options);
            this.combo_item_of_line = selected_orderline['combo_items'];
            var image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=';
            this.$el.find('div.body').html(qweb.render('combo_items', {
                combo_items: combo_items,
                image_url: image_url,
                widget: self
            }));
            this.$('.combo-item').click(function () {
                var combo_item_id = parseInt($(this).data('id'));
                var combo_item = self.pos.combo_item_by_id[combo_item_id];
                if (combo_item) {
                    if ($(this).closest('.product').hasClass("item-selected") == true) {
                        $(this).closest('.product').toggleClass("item-selected");
                        for (var i = 0; i < self.combo_item_of_line.length; ++i) {
                            if (self.combo_item_of_line[i].id == combo_item.id) {
                                self.combo_item_of_line.splice(i, 1);
                                selected_orderline.trigger('change', selected_orderline);
                                selected_orderline.trigger('update:OrderLine');
                            }
                        }
                    } else {
                        if (self.pos.get_order().selected_orderline['combo_items'].length >= self.pos.get_order().selected_orderline.product.combo_limit) {
                            return self.gui.show_popup('confirm', {
                                title: 'Warning',
                                body: 'You can not add bigger than ' + selected_orderline.product.combo_limit + ' items'
                            });
                        } else {
                            $(this).closest('.product').toggleClass("item-selected");
                            self.combo_item_of_line.push(combo_item);
                            selected_orderline.trigger('change', selected_orderline);
                            selected_orderline.trigger('update:OrderLine');
                        }
                    }

                }
                var order = self.pos.get('selectedOrder');
                order.trigger('change', order)
            });
            $('.cancel').click(function () {
                self.gui.close_popup();
            });
        }
    });
    gui.define_popup({name: 'popup_selection_combos', widget: popup_selection_combos});

    // add lot to combo items
    var popup_add_lot_to_combo_items = PopupWidget.extend({
        template: 'popup_add_lot_to_combo_items',
        events: _.extend({}, PopupWidget.prototype.events, {
            'click .remove-lot': 'remove_lot',
            'blur .packlot-line-input': 'lose_input_focus'
        }),

        show: function (options) {
            this.orderline = options.orderline;
            this.combo_items = options.combo_items;
            this._super(options);
            this.focus();
        },
        lose_input_focus: function (ev) {
            var $input = $(ev.target),
                id = $input.attr('id');
            var combo_item = this.pos.combo_item_by_id[id];
            var lot = this.pos.lot_by_name[$input.val()];
            if (lot) {
                combo_item['use_date'] = lot['use_date']
            } else {
                combo_item['lot_number'] = 'Wrong lot, input again.';
            }
            for (var i = 0; i < this.orderline.combo_items.length; i++) {
                if (this.orderline.combo_items[i]['id'] == id) {
                    this.orderline.combo_items[i] = combo_item;
                }
            }
            this.orderline.trigger('change', this.orderline);
        },
        remove_lot: function (ev) {
            $input = $(ev.target).prev(),
                id = $input.attr('id');
            var combo_item = this.pos.combo_item_by_id[id];
            combo_item['lot_number'] = '';
            combo_item['use_date'] = '';
            for (var i = 0; i < this.orderline.combo_items.length; i++) {
                if (this.orderline.combo_items[i]['id'] == id) {
                    this.orderline.combo_items[i] = combo_item;
                }
            }
            this.orderline.trigger('change', this.orderline);
            this.renderElement();
        },

        focus: function () {
            this.$("input[autofocus]").focus();
            this.focus_model = false;   // after focus clear focus_model on widget
        }
    });
    gui.define_popup({name: 'popup_add_lot_to_combo_items', widget: popup_add_lot_to_combo_items});

    var popup_internal_transfer = PopupWidget.extend({ // internal transfer
        template: 'popup_internal_transfer',

        show: function (options) {
            var self = this;
            this._super(options);
            this.$('.datetimepicker').datetimepicker({
                format: 'YYYY-MM-DD H:mm:00',
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                }
            });
            this.$('.confirm').click(function () {
                self.click_confirm();
            });
            this.$('.cancel').click(function () {
                self.pos.gui.close_popup();
            });
        },

        click_confirm: function () {
            var self = this;
            var fields = {};
            this.$('.internal_transfer_field').each(function (idx, el) {
                fields[el.id] = el.value || false;
            });
            if (!fields['scheduled_date']) {
                return this.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Please input scheduled date'
                });
            }
            var order = this.pos.get_order();
            var length = order.orderlines.length;
            var picking_vals = {
                origin: order['name'],
                picking_type_id: parseInt(fields['picking_type_id']),
                location_id: parseInt(fields['location_id']),
                location_dest_id: parseInt(fields['location_dest_id']),
                move_type: fields['move_type'],
                note: fields['note'],
                move_lines: [],
                scheduled_date: fields['scheduled_date'],
            };
            for (var i = 0; i < length; i++) {
                var line = order.orderlines.models[i];
                var product = this.pos.db.get_product_by_id(line.product.id);
                if (product['uom_po_id'] == undefined || !product['uom_po_id']) {
                    return this.pos.gui.show_popup('confirm', {
                        title: 'Error',
                        body: product['display_name'] + ' not set purchase unit, could not create PO',
                    });
                }
                if (product['type'] == 'service') {
                    return this.pos.gui.show_popup('confirm', {
                        title: 'Error',
                        body: product['display_name'] + ' type is service, please remove line',
                        confirmButtonText: 'Yes',
                    });
                }
                if (product['type'] != 'service' && product['uom_po_id'] != undefined) {
                    picking_vals['move_lines'].push([0, 0, {
                        name: order.name,
                        product_uom: product['uom_po_id'][0],
                        picking_type_id: parseInt(fields['picking_type_id']),
                        product_id: line.product.id,
                        product_uom_qty: line.quantity,
                        location_id: parseInt(fields['location_id']),
                        location_dest_id: parseInt(fields['location_dest_id']),
                    }])
                }
            }
            if (picking_vals['move_lines'].length > 0) {
                return rpc.query({
                    model: 'stock.picking',
                    method: 'pos_made_internal_transfer',
                    args: [picking_vals],
                    context: {}
                }).then(function (picking_id) {
                    self.pos.get_order().destroy();
                    self.link = window.location.origin + "/web#id=" + picking_id + "&view_type=form&model=stock.picking";
                    return self.gui.show_popup('confirm', {
                        title: 'Done',
                        body: 'Are you want review internal transfer just created ?',
                        confirm: function () {
                            window.open(self.link, '_blank');
                        }
                    });
                }).fail(function (type, error) {
                    return self.pos.query_backend_fail(type, error);
                });
            }
        },
    });

    gui.define_popup({name: 'popup_internal_transfer', widget: popup_internal_transfer});

    var popup_account_invoice_refund = PopupWidget.extend({
        template: 'popup_account_invoice_refund',
        show: function (options) {
            var self = this;
            options = options || {};
            if (!options.invoice) {
                this._super(options);
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Please choice other invoice'
                })
            }
            options.title = options.invoice.number;
            options.invoice = options.invoice;
            this.options = options;
            this._super(options);
            $('.datetimepicker').datetimepicker({
                format: 'YYYY-MM-DD H:mm:00',
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                }

            });
            $('.datepicker').datetimepicker({
                format: 'YYYY-MM-DD',
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                }
            });

            $('.timepicker').datetimepicker({
                //          format: 'H:mm',    // use this format if you want the 24hours timepicker
                format: 'H:mm:00', //use this format if you want the 12hours timpiecker with AM/PM toggle
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                }
            });
            $('.confirm').click(function () {
                self.click_confirm();
            });
            $('.cancel').click(function () {
                self.pos.gui.close_popup();
            });
        },
        click_confirm: function () {
            var self = this;
            var filter_refund = this.$('#filter_refund').val();
            var description = this.$('#description').val();
            var date_invoice = this.$('#date_invoice').val();
            var date = this.$('#date').val();
            if (!filter_refund || !description || !date_invoice) {
                return this.gui.show_popup('confirm', {
                    title: 'Error',
                });
            } else {
                var params = {
                    filter_refund: filter_refund,
                    description: description,
                    date_invoice: date_invoice,
                    date: date
                };
                var refund = rpc.query({
                    model: 'account.invoice.refund',
                    method: 'create',
                    args: [params],
                    context: {
                        active_ids: [self.options.invoice['id']]
                    }
                });
                this.pos.gui.close_popup();
                return refund.then(function (refund_id) {
                    rpc.query({
                        model: 'account.invoice.refund',
                        method: 'compute_refund',
                        args: [refund_id, filter_refund],
                        context: {
                            active_ids: [self.options.invoice['id']],
                            // move_name: self.options.invoice['number'],
                        }
                    }).then(function (result) {
                        var refund_invoice = rpc.query({
                            model: 'account.invoice',
                            method: 'search_read',
                            args: [[['refund_invoice_id', '=', self.options.invoice['id']]]],
                        });
                        refund_invoice.then(function (refund_invoices) {
                            if (refund_invoices.length) {
                                for (var i = 0; i < refund_invoices.length; i++) {
                                    var refund_invoice = refund_invoices[i];
                                    var value_update = {
                                        // 'number': self.options.invoice['number'] + '(credit note)',
                                    }
                                    if (self.pos.config.add_credit) {
                                        value_update['add_credit'] = true
                                    }
                                    self.refund_invoice = refund_invoice
                                    rpc.query({ // update invoice
                                        model: 'account.invoice',
                                        method: 'write',
                                        args: [[self.refund_invoice['id']], value_update],
                                    }).then(function () {
                                        var open_inv = rpc.query({ // open invoice
                                            model: 'account.invoice',
                                            method: 'action_invoice_open',
                                            args: [self.refund_invoice['id']],
                                        });
                                        open_inv.then(function () {
                                            self.link = window.location.origin + "/web#id=" + self.refund_invoice['id'] + "&view_type=form&model=account.invoice";
                                            self.pos.gui.show_popup('confirm', {
                                                title: 'Done',
                                                body: 'Are you want open invoice review ?',
                                                confirm: function () {
                                                    window.open(self.link, '_blank');
                                                }
                                            })
                                        }).fail(function (type, error) {
                                            return self.pos.query_backend_fail(type, error);
                                        });
                                    });

                                }
                            } else {
                                self.pos.gui.show_popup('confirm', {
                                    title: 'Error',
                                    body: 'Refund fail, could not find any invoice'
                                })
                            }
                        })
                    }).fail(function (type, error) {
                        return self.pos.query_backend_fail(type, error);
                    });
                }).fail(function (type, error) {
                    return self.pos.query_backend_fail(type, error);
                });
            }
        }
    });
    gui.define_popup({name: 'popup_account_invoice_refund', widget: popup_account_invoice_refund});

    var popup_create_booking_order = PopupWidget.extend({ // create booking order
        template: 'popup_create_booking_order',
        init: function (parent, options) {
            this._super(parent, options);
            this.order_selected = null;
        },
        show: function (options) {
            var self = this;
            this.order_selected = options.order;
            this._super(options);
            this.$('.datetimepicker').datetimepicker({
                format: 'YYYY-MM-DD H:mm:00',
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                }
            });
            this.$(".pos_signature").jSignature();
            this.signed = false;
            this.$(".pos_signature").bind('change', function (e) {
                self.signed = true;
            });
            this.$(".cancel").click(function (e) {
                self.pos.gui.close_popup();
            });
        },
        renderElement: function () {
            var self = this;
            this._super();
            this.$('.cancel').click(function () {
                self.gui.close_popup();
            });
            this.$('.confirm').click(function () {
                var fields = {};
                self.$('.booking_field').each(function (idx, el) {
                    fields[el.name] = el.value || false;
                });
                var $pricelist_id = $('#pricelist_id').val();
                var pricelist_id = parseInt($pricelist_id);
                if (typeof pricelist_id != 'number' || isNaN(pricelist_id)) {
                    return self.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Please select price list',
                    });
                }
                var order = self.pos.get_order();
                if (self.signed == false && self.pos.config.booking_orders_required_cashier_signature == true) {
                    return self.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Please signature on popup',
                    });
                }
                var payment_partial_amount = parseFloat(fields['payment_partial_amount'])
                var $payment_partial_journal_id = $('#payment_partial_journal_id').val();
                var payment_partial_journal_id = parseInt($payment_partial_journal_id);
                if (payment_partial_amount > 0 && (typeof payment_partial_journal_id != 'number' || isNaN(payment_partial_journal_id))) {
                    return self.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Please select payment journal',
                    });
                }
                if (payment_partial_amount < 0) {
                    return self.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Partial payment amount could not smaller than 0',
                    });
                }
                if (isNaN(payment_partial_amount)) {
                    payment_partial_amount = 0
                    payment_partial_journal_id = null
                }
                var $payment_method_id = $('#payment_method_id').val();
                var payment_method_id = parseInt($payment_method_id);
                if (payment_partial_amount > 0 && !payment_method_id) {
                    return self.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Please select payment method',
                    });
                }
                var so_val = order.export_as_JSON();
                var value = {
                    delivery_address: fields['delivery_address'],
                    delivery_phone: fields['delivery_phone'],
                    delivery_date: fields['delivery_date'],
                    note: fields['note'],
                    creation_date: so_val['creation_date'],
                    payment_partial_amount: payment_partial_amount,
                    payment_partial_journal_id: payment_partial_journal_id,
                    origin: 'POS/' + so_val.name,
                    partner_id: so_val.partner_id,
                    pricelist_id: pricelist_id,
                    order_line: [],
                    signature: null,
                    book_order: true
                };
                var sign_datas = self.$(".pos_signature").jSignature("getData", "image");
                if (sign_datas && sign_datas[1]) {
                    value['signature'] = sign_datas[1]
                }
                for (var i = 0; i < so_val.lines.length; i++) {
                    var line = so_val.lines[i][2];
                    var product = self.pos.db.get_product_by_id(line.product_id)
                    value.order_line.push([0, 0, {
                        product_id: line.product_id,
                        price_unit: line.price_unit,
                        product_uom_qty: line.qty,
                        discount: line.discount,
                        product_uom: product.uom_id[0],
                    }])
                }
                if (payment_partial_amount > 0 && payment_partial_journal_id) {
                    var payment = {
                        partner_type: 'customer',
                        payment_type: 'inbound',
                        partner_id: so_val.partner_id,
                        amount: payment_partial_amount,
                        currency_id: self.pos.currency['id'],
                        payment_date: new Date(),
                        journal_id: payment_partial_journal_id,
                        payment_method_id: payment_method_id,
                    };
                    rpc.query({
                        model: 'account.payment',
                        method: 'create',
                        args:
                            [payment]
                    }).then(function (payment_id) {
                        return rpc.query({
                            model: 'account.payment',
                            method: 'post',
                            args: [payment_id],
                            context: {
                                payment_id: payment_id,
                            }
                        }).then(function (result) {

                        }).fail(function (type, error) {
                            return self.pos.query_backend_fail(type, error);
                        });
                    }).fail(function (type, error) {
                        return self.pos.query_backend_fail(type, error);
                    });
                }
                return rpc.query({
                    model: 'sale.order',
                    method: 'booking_order',
                    args: [value]
                }).then(function (result) {
                    self.pos.get_order().destroy();
                    self.link = window.location.origin + "/web#id=" + result.id + "&view_type=form&model=sale.order";
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Done',
                        body: 'Are you want review sale order just created ?',
                        confirm: function () {
                            return window.open(self.link, '_blank');
                        }
                    })
                }).fail(function (type, error) {
                    return self.pos.query_backend_fail(type, error);
                });

            })
        }
    });
    gui.define_popup({
        name: 'popup_create_booking_order',
        widget: popup_create_booking_order
    });

    var popup_create_sale_order = PopupWidget.extend({ // popup create sale order
        template: 'popup_create_sale_order',
        init: function (parent, options) {
            this._super(parent, options);
        },
        show: function (options) {
            var self = this;
            this.order_selected = options.order;
            this.client = options.client;
            if (this.client['property_payment_term_id'] == undefined) {
                return self.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'POS retail version is old version, please go to Application of your browse, delete your database and reload POS',
                });
            }
            this._super(options);
            this.$(".pos_signature").jSignature();
            this.signed = false;
            this.$(".pos_signature").bind('change', function (e) {
                self.signed = true;
            });
            this.$(".cancel").click(function (e) {
                self.pos.gui.close_popup();
            });
        },
        renderElement: function () {
            var self = this;
            this._super();
            this.$('.confirm').click(function () {
                self.pos.gui.close_popup();
                var fields = {};
                self.$('.sale_order_field').each(function (idx, el) {
                    fields[el.name] = el.value || false;
                });
                var pricelist_id;
                var order = self.order_selected;
                if (!order) {
                    return
                }
                if (!order.get_client()) {
                    return
                }
                var order = self.pos.get_order();
                if (self.signed == false && self.pos.config.booking_orders_required_cashier_signature == true) {
                    return self.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Please signature',
                    });
                }
                var pricelist = order['pricelist'];
                if (!pricelist) {
                    pricelist_id = this.pos.default_pricelist.id;
                } else {
                    pricelist_id = pricelist.id;
                }
                var so_val = order.export_as_JSON();
                var value = {
                    note: self.$('.note').val(),
                    origin: 'POS/' + so_val.name,
                    partner_id: order.get_client().id,
                    pricelist_id: pricelist_id,
                    order_line: [],
                    signature: null,
                    book_order: true,
                    payment_term_id: parseInt(self.$('.payment_term_id').val()),
                };
                var sign_datas = self.$(".pos_signature").jSignature("getData", "image");
                if (sign_datas && sign_datas[1]) {
                    value['signature'] = sign_datas[1]
                }
                for (var i = 0; i < so_val.lines.length; i++) {
                    var line = so_val.lines[i][2];
                    var product = self.pos.db.get_product_by_id(line.product_id)
                    var line_value = {
                        product_id: line.product_id,
                        price_unit: line.price_unit,
                        product_uom_qty: line.qty,
                        discount: line.discount,
                        product_uom: product.uom_id[0],
                        pack_lot_ids: []
                    }
                    if (line.pack_lot_ids) {
                        for (var x = 0; x < line.pack_lot_ids.length; x++) {
                            var lot = line.pack_lot_ids[x][2]
                            line_value.pack_lot_ids.push(lot['lot_name'])
                        }
                    }
                    if (product.tracking != 'none' && line.pack_lot_ids.length == 0) {
                        return self.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Please add lot number for ' + product['display_name'],
                        });
                    }
                    value.order_line.push([0, 0, line_value])
                }
                var fiscal_position_id = null;
                if (order.fiscal_position) {
                    fiscal_position_id = order.fiscal_position['id']
                    value['fiscal_position_id'] = fiscal_position_id;
                }
                var sale_order_auto_confirm = self.pos.config.sale_order_auto_confirm;
                var sale_order_auto_invoice = self.pos.config.sale_order_auto_invoice;
                var sale_order_auto_delivery = self.pos.config.sale_order_auto_delivery;
                self.pos.gui.show_popup('confirm', {
                    title: 'Waiting',
                    body: 'Order need few seconds create',
                });
                return rpc.query({
                    model: 'sale.order',
                    method: 'pos_create_sale_order',
                    args: [value, sale_order_auto_confirm, sale_order_auto_invoice, sale_order_auto_delivery]
                }).then(function (result) {
                    self.pos.get_order().destroy();
                    var link = window.location.origin + "/web#id=" + result.id + "&view_type=form&model=sale.order";
                    self.link = link;
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Are you want open sale order ?',
                        body: result.name + ' just created',
                        confirm: function () {
                            var sale_selected = self.pos.db.sale_order_by_id[result.id];
                            self.pos.sale_selected = sale_selected;
                            window.open(self.link, '_blank');
                        },
                    })

                }).fail(function (type, error) {
                    return self.pos.query_backend_fail(type, error);
                });

            })
        }
    });
    gui.define_popup({
        name: 'popup_create_sale_order',
        widget: popup_create_sale_order
    });

    // create purchase order (PO)
    var popup_create_purchase_order = PopupWidget.extend({ // create purchase order
        template: 'popup_create_purchase_order',
        init: function (parent, options) {
            this._super(parent, options);
        },
        show: function (options) {
            options = options || {};
            if (options.cashregisters) {
                this.cashregisters = options.cashregisters;
            }
            this._super(options);
            this.$('.datetimepicker').datetimepicker({
                format: 'YYYY-MM-DD H:mm:00',
                icons: {
                    time: "fa fa-clock-o",
                    date: "fa fa-calendar",
                    up: "fa fa-chevron-up",
                    down: "fa fa-chevron-down",
                    previous: 'fa fa-chevron-left',
                    next: 'fa fa-chevron-right',
                    today: 'fa fa-screenshot',
                    clear: 'fa fa-trash',
                    close: 'fa fa-remove'
                }
            });
            var order = this.pos.get_order();
            var lines = order.get_orderlines();
            var self = this
            if (lines.length == 0) {
                return this.gui.show_popup('confirm', {
                    title: 'ERROR',
                    body: 'Current order have empty lines, please add products before create the purchase order',
                });
            }
            if (!order.get_client()) {
                return self.pos.gui.show_screen('clientlist');
            }
            this.$(".pos_signature").jSignature();
        },
        renderElement: function () {
            var self = this;
            this._super();
            this.$('.create-purchase-order').click(function () {
                self.pos.gui.close_popup();
                self.create_po();
            });
            this.$('.cancel').click(function () {
                self.pos.gui.close_popup();
            });
        },
        create_po: function () { // check v10
            var date_planned = this.$('#date_planned').val();
            var po_currency_id = this.$('#po_currency_id').val();
            var journal_id = this.$('#journal_id').val();
            if (!date_planned || !po_currency_id) {
                return this.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Please input scheduled date and currency',
                });
            }
            var self = this
            var order = this.pos.get_order();
            var lines = order.get_orderlines();
            var client = this.pos.get_client();
            var values = {
                journal_id: journal_id,
                origin: order.name,
                partner_id: this.pos.get_client().id,
                order_line: [],
                payment_term_id: client['property_payment_term_id'] && client['property_payment_term_id'][0],
                date_planned: date_planned,
                note: this.$('#purchase_order_note').val(),
                currency_id: parseInt(po_currency_id)
            };
            var sign_datas = self.$(".pos_signature").jSignature("getData", "image");
            if (sign_datas && sign_datas[1]) {
                values['signature'] = sign_datas[1]
            }
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var uom_id;
                if (line['uom_id']) {
                    uom_id = line['uom_id']
                } else {
                    uom_id = line.product.uom_id[0]
                }
                var taxes_id = [[6, false, line.product['supplier_taxes_id'] || []]];
                values['order_line'].push([0, 0, {
                    product_id: line.product['id'],
                    name: line.product['display_name'],
                    product_qty: line['quantity'],
                    product_uom: uom_id,
                    price_unit: line.price,
                    date_planned: new Date(),
                    taxes_id: taxes_id
                }])
            }
            return rpc.query({
                model: 'purchase.order',
                method: 'create_po',
                args:
                    [values, this.pos.config.purchase_order_state]
            }).then(function (result) {
                self.pos.get_order().destroy();
                var link = window.location.origin + "/web#id=" + result['id'] + "&view_type=form&model=purchase.order";
                self.link = link;
                return self.gui.show_popup('confirm', {
                    title: 'Done',
                    body: 'Are you want review purchase order ' + result['name'] + ' just created',
                    confirm: function () {
                        window.open(self.link, '_blank');
                    },
                });
            }).fail(function (type, error) {
                return self.pos.query_backend_fail(type, error);
            });
        }
    });
    gui.define_popup({
        name: 'popup_create_purchase_order',
        widget: popup_create_purchase_order
    });

    var popup_return_pos_order_lines = PopupWidget.extend({
        template: 'popup_return_pos_order_lines',
        show: function (options) {
            var self = this;
            this.line_selected = options.order_lines;
            this.order = options.order;
            this._super(options);
            var image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=';
            if (self.line_selected) {
                self.$el.find('tbody').html(qweb.render('return_pos_order_line', {
                    order_lines: self.line_selected,
                    image_url: image_url,
                    widget: self
                }));
                this.$('.line-select').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.order_line_by_id[line_id];
                    var checked = this.checked;
                    if (checked == false) {
                        for (var i = 0; i < self.line_selected.length; ++i) {
                            if (self.line_selected[i].id == line.id) {
                                self.line_selected.splice(i, 1);
                            }
                        }
                    } else {
                        self.line_selected.push(line);
                    }
                });
                this.$('.confirm-return-order').click(function () {
                    if (self.line_selected == [] || !self.order) {
                        self.pos.gui.show_popup('confirm', {
                            title: _t('Error'),
                            body: 'Please select lines need return from request of customer',
                        });
                    } else {
                        return self.pos.add_return_order(self.order, self.line_selected);
                    }
                });
                this.$('.create_voucher').click(function () { // create voucher when return order
                    var value = 0;
                    if (!self.line_selected) {
                        self.pos.gui.show_popup('confirm', {
                            title: _t('Error'),
                            body: 'Please select lines need return from request of customer',
                        });
                    } else {
                        for (var i = 0; i < self.line_selected.length; i++) {
                            value += self.line_selected[i]['price_subtotal_incl'];
                        }
                    }
                    if (value) {
                        var voucher_data = {
                            apply_type: 'fixed_amount',
                            value: value,
                            method: 'general',
                            period_days: self.pos.config.expired_days_voucher || 30,
                            total_available: 1,
                            customer_id: self.order['partner_id']
                        };
                        return rpc.query({
                            model: 'pos.voucher',
                            method: 'create_voucher',
                            args: [voucher_data]
                        }).then(function (vouchers) {
                            self.pos.vouchers = vouchers;
                            return self.pos.gui.show_screen('vouchers_screen');
                        }).fail(function (type, error) {
                            return self.pos.query_backend_fail(type, error);
                        });
                    }

                });
                this.$('.cancel').click(function () {
                    self.pos.gui.close_popup();
                });
                this.$('.fa-minus-square-o').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.order_line_by_id[line_id];
                    var quantity = parseFloat($(this).parent().parent().find('.qty').text())
                    if (quantity > 1) {
                        var new_quantity = quantity - 1;
                        $(this).parent().parent().find('.qty').text(new_quantity)
                        line['new_quantity'] = new_quantity;
                    }
                });
                this.$('.fa-plus-square-o').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.order_line_by_id[line_id];
                    var quantity = parseFloat($(this).parent().parent().find('.qty').text())
                    if (line['qty'] >= (quantity + 1)) {
                        var new_quantity = quantity + 1;
                        $(this).parent().parent().find('.qty').text(new_quantity)
                        line['new_quantity'] = new_quantity;
                    }
                })
            }
        }
    });
    gui.define_popup({
        name: 'popup_return_pos_order_lines',
        widget: popup_return_pos_order_lines
    });

    // return products from sale order
    var popup_stock_return_picking = PopupWidget.extend({
        template: 'popup_stock_return_picking',
        show: function (options) {
            var self = this;
            this.sale = options.sale;
            this.order_lines_selected = this.pos.db.sale_lines_by_sale_id[this.sale.id];
            this._super(options);
            var image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=';
            this.$('.cancel').click(function () {
                self.pos.gui.close_popup();
            });
            if (this.order_lines_selected) {
                self.$el.find('tbody').html(qweb.render('stock_move_line', {
                    order_lines_selected: self.order_lines_selected,
                    image_url: image_url,
                    widget: self
                }));
                this.$('.line-select').click(function () {
                    var line_id = parseInt($(this).data('id'));
                    var line = self.pos.db.sale_line_by_id[line_id];
                    var checked = this.checked;
                    if (checked == false) {
                        for (var i = 0; i < self.order_lines_selected.length; ++i) {
                            if (self.order_lines_selected[i].id == line.id) {
                                self.order_lines_selected.splice(i, 1);
                            }
                        }
                    } else {
                        self.order_lines_selected.push(line);
                    }
                });
                this.$('.confirm').click(function () {
                    self.pos.gui.close_popup();
                    if (self.order_lines_selected.length == 0) {
                        return self.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Please select line for return'
                        })
                    }
                    if (self.sale.picking_ids.length == 0) {
                        return self.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Sale order have not delivery order, could not made return'
                        })
                    }
                    if (self.sale.picking_ids.length > 1) {
                        return self.pos.gui.show_popup('confirm', {
                            title: 'Warning',
                            body: 'Sale order have delivery orders bigger than 2, could not made return'
                        })
                    }
                    if (self.sale.picking_ids.length == 1) {
                        return rpc.query({
                            model: 'stock.return.picking',
                            method: 'default_get',
                            args: [['product_return_moves', 'move_dest_exists', 'parent_location_id', 'original_location_id', 'location_id']],
                            context: {
                                active_ids: [self.sale.picking_ids[0]],
                                active_id: self.sale.picking_ids[0]
                            }
                        }).then(function (default_vals) {
                            var product_return_moves = default_vals['product_return_moves'];
                            var product_return_ids = [];
                            for (var i = 0; i < self.order_lines_selected.length; i++) {
                                product_return_ids.push(self.order_lines_selected[i]['product_id'][0])
                            }
                            if (product_return_moves) {
                                product_return_moves = _.filter(product_return_moves, function (move_return) {
                                    var product_index = _.findIndex(product_return_ids, function (id) {
                                        return id == move_return[2]['product_id'];
                                    });
                                    if (product_index != -1) {
                                        return true
                                    }
                                });
                                default_vals['product_return_moves'] = product_return_moves;
                                return rpc.query({
                                    model: 'stock.return.picking',
                                    method: 'create',
                                    args: [default_vals],
                                }).then(function (return_picking_id) {
                                    self.return_picking_id = return_picking_id;
                                    return rpc.query({
                                        model: 'stock.return.picking',
                                        method: 'create_returns',
                                        args: [[return_picking_id]],
                                    }).then(function (result) {
                                        return rpc.query({
                                            model: 'sale.order',
                                            method: 'action_validate_picking',
                                            args:
                                                [[self.sale['id']]],
                                            context: {
                                                pos: true
                                            }
                                        }).then(function (picking_name) {
                                            if (picking_name) {
                                                return self.pos.gui.show_popup('confirm', {
                                                    title: 'Succeed',
                                                    body: 'Return Delivery Order ' + picking_name + ' processed to Done',
                                                });
                                            } else {
                                                return self.pos.gui.show_popup('confirm', {
                                                    title: 'Warning',
                                                    body: 'Have not any delivery order of this sale order',
                                                });
                                            }
                                        }).fail(function (type, error) {
                                            return self.pos.query_backend_fail(type, error);
                                        })
                                    }).fail(function (type, error) {
                                        return self.pos.query_backend_fail(type, error);
                                    })
                                }).fail(function (type, error) {
                                    return self.pos.query_backend_fail(type, error);
                                })
                            }
                            return self.pos.gui.close_popup();
                        }).fail(function (type, error) {
                            return self.pos.query_backend_fail(type, error);
                        })
                    }
                });
                this.$('.fa-minus-square-o').click(function () {
                    // var line_id = parseInt($(this).data('id'));
                    // var line = self.pos.db.order_line_by_id[line_id];
                    // var quantity = parseFloat($(this).parent().parent().find('.qty').text())
                    // if (quantity > 1) {
                    //     var new_quantity = quantity - 1;
                    //     $(this).parent().parent().find('.qty').text(new_quantity)
                    //     line['new_quantity'] = new_quantity;
                    // }
                });
                this.$('.fa-plus-square-o').click(function () {
                    // var line_id = parseInt($(this).data('id'));
                    // var line = self.pos.db.order_line_by_id[line_id];
                    // var quantity = parseFloat($(this).parent().parent().find('.qty').text())
                    // if (line['qty'] >= (quantity + 1)) {
                    //     var new_quantity = quantity + 1;
                    //     $(this).parent().parent().find('.qty').text(new_quantity)
                    //     line['new_quantity'] = new_quantity;
                    // }
                })
            }
        }
    });
    gui.define_popup({
        name: 'popup_stock_return_picking',
        widget: popup_stock_return_picking
    });

    var popup_selection_tags = PopupWidget.extend({ // add tags
        template: 'popup_selection_tags',
        show: function (options) {
            var self = this;
            this._super(options);
            var tags = this.pos.tags;
            this.tags_selected = {};
            var selected_orderline = options.selected_orderline;
            var tag_selected = selected_orderline['tags'];
            for (var i = 0; i < tags.length; i++) {
                var tag = _.findWhere(tag_selected, {id: tags[i].id});
                if (tag) {
                    self.tags_selected[tag.id] = tags[i];
                    tags[i]['selected'] = true
                } else {
                    tags[i]['selected'] = false
                }
            }
            self.$el.find('.body').html(qweb.render('tags_list', {
                tags: tags,
                widget: self
            }));

            $('.tag').click(function () {
                var tag_id = parseInt($(this).data('id'));
                var tag = self.pos.tag_by_id[tag_id];
                if (tag) {
                    if ($(this).closest('.tag').hasClass("item-selected") == true) {
                        $(this).closest('.tag').toggleClass("item-selected");
                        delete self.tags_selected[tag.id];
                        self.remove_tag_out_of_line(selected_orderline, tag)
                    } else {
                        $(this).closest('.tag').toggleClass("item-selected");
                        self.tags_selected[tag.id] = tag;
                        self.add_tag_to_line(selected_orderline, tag)
                    }
                }
            });
            $('.close').click(function () {
                self.pos.gui.close_popup();
            });
        },
        add_tag_to_line: function (line, tag_new) {
            line.tags.push(tag_new);
            line.trigger('change', line);
            line.trigger_update_line();
        },
        remove_tag_out_of_line: function (line, tag_new) {
            var tag_exist = _.filter(line.tags, function (tag) {
                return tag['id'] !== tag_new['id'];
            });
            line.tags = tag_exist;
            line.trigger('change', line);
            line.trigger_update_line();
        }
    });
    gui.define_popup({name: 'popup_selection_tags', widget: popup_selection_tags});

    var popup_selection_variants = PopupWidget.extend({
        template: 'popup_selection_variants',
        show: function (options) {
            var self = this;
            this._super(options);
            this.variants_selected = {};
            var variants = options.variants;
            var selected_orderline = options.selected_orderline;
            var variants_selected = selected_orderline['variants'];
            if (variants_selected.length != 0) {
                for (var i = 0; i < variants.length; i++) {
                    var variant = _.findWhere(variants_selected, {id: variants[i].id});
                    if (variant) {
                        self.variants_selected[variant.id] = variant;
                        variants[i]['selected'] = true
                    } else {
                        variants[i]['selected'] = false
                    }
                }
            }

            var image_url = window.location.origin + '/web/image?model=product.template&field=image_medium&id=';
            self.$el.find('div.body').html(qweb.render('variant_items', {
                variants: variants,
                image_url: image_url,
                widget: self
            }));
            $('.variant').click(function () {
                var variant_id = parseInt($(this).data('id'));
                var variant = self.pos.variant_by_id[variant_id];
                if (variant) {
                    if ($(this).closest('.product').hasClass("item-selected") == true) {
                        $(this).closest('.product').toggleClass("item-selected");
                        delete self.variants_selected[variant.id];
                    } else {
                        $(this).closest('.product').toggleClass("item-selected");
                        self.variants_selected[variant.id] = variant;

                    }
                }
            });
            $('.confirm-variant').click(function () {
                var variants_selected = self.variants_selected;
                var variants = _.map(variants_selected, function (variant) {
                    return variant;
                });
                selected_orderline['variants'] = variants;
                if (variants.length == 0) {
                    return selected_orderline.set_unit_price(selected_orderline.product.list_price);
                } else {
                    var price_extra_total = selected_orderline.product.list_price;
                    for (var i = 0; i < variants.length; i++) {
                        price_extra_total += variants[i].price_extra;
                    }
                    selected_orderline.set_unit_price(price_extra_total);
                    selected_orderline.trigger_update_line();
                    self.pos.get_order().trigger('change');
                }
                self.gui.close_popup();
            });
            $('.cancel').click(function () {
                self.gui.close_popup();
            });
        }
    });
    gui.define_popup({name: 'popup_selection_variants', widget: popup_selection_variants});

    var popup_print_receipt = PopupWidget.extend({
        template: 'popup_print_receipt',
        show: function (options) {
            options = options || {};
            this.options = options;
            this._super(options);
            var contents = this.$el[0].querySelector('.xml');
            var tbody = document.createElement('tbody');
            tbody.innerHTML = options.xml;
            tbody = tbody.childNodes[1];
            contents.appendChild(tbody);
            var self = this;
            setTimeout(function () {
                self.pos.gui.close_popup();
            }, 5000);
        }
    });
    gui.define_popup({name: 'popup_print_receipt', widget: popup_print_receipt});

    var popup_add_order_line_note = PopupWidget.extend({
        template: 'popup_add_order_line_note',
        show: function (options) {
            var self = this;
            options = options || {};
            options.notes = this.pos.notes;
            this._super(options);
            this.renderElement();
            this.notes_selected = {};
            this.$('input,textarea').focus();
            $('.note').click(function () {
                var note_id = parseInt($(this).data('id'));
                var note = self.pos.note_by_id[note_id];
                self.pos.get_order().get_selected_orderline().set_line_note(note['name']);
                self.pos.gui.close_popup();
            });
            $('.confirm').click(function () {
                self.click_confirm();
            });
            $('.cancel').click(function () {
                self.gui.close_popup();
            });
        },
        click_confirm: function () {
            var value = this.$('input,textarea').val();
            this.gui.close_popup();
            if (this.options.confirm) {
                this.options.confirm.call(this, value);
            }
        }
    });
    gui.define_popup({name: 'popup_add_order_line_note', widget: popup_add_order_line_note});

    var popup_cross_selling = PopupWidget.extend({ // popup cross selling
        template: 'popup_cross_selling',
        show: function (options) {
            var self = this;
            this._super(options);
            var cross_items = options.cross_items;
            this.cross_items_selected = [];
            var image_url = window.location.origin + '/web/image?model=product.product&field=image_medium&id=';
            self.$el.find('div.body').html(qweb.render('cross_item', {
                cross_items: cross_items,
                image_url: image_url,
                widget: this
            }));
            $('.combo-item').click(function () {
                var cross_item_id = parseInt($(this).data('id'));
                var cross_item = self.pos.cross_item_by_id[cross_item_id];
                if (cross_item) {
                    if ($(this).closest('.product').hasClass("item-selected") == true) {
                        $(this).closest('.product').toggleClass("item-selected");
                        self.cross_items_selected = _.filter(self.cross_items_selected, function (cross_item_selected) {
                            return cross_item_selected['id'] != cross_item['id']
                        })
                    } else {
                        $(this).closest('.product').toggleClass("item-selected");
                        self.cross_items_selected.push(cross_item)
                    }

                }
            });
            $('.cancel').click(function () {
                self.gui.close_popup();
            });
            $('.add_cross_selling').click(function () {
                var order = self.pos.get_order();
                if (self.cross_items_selected.length == 0) {
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Please click and choice product item'
                    });
                }
                if (order) {
                    for (var i = 0; i < self.cross_items_selected.length; i++) {
                        var cross_item = self.cross_items_selected[i];
                        var product = self.pos.db.get_product_by_id(cross_item['product_id'][0]);
                        if (product) {
                            if (!product) {
                                continue
                            }
                            var price = cross_item['list_price'];
                            if (cross_item['discount_type'] == 'percent') {
                                price = price - price / 100 * cross_item['discount']
                            }
                            order.add_product(product, {
                                quantity: cross_item['quantity'],
                                price: price,
                                merge: false,
                            });
                        }
                    }
                    return self.pos.gui.show_popup('confirm', {
                        title: 'Done',
                        body: 'Cross items added.'
                    });
                }
            });
        }
    });
    gui.define_popup({name: 'popup_cross_selling', widget: popup_cross_selling});

    var popup_invoice_register_payment = PopupWidget.extend({
        template: 'popup_invoice_register_payment',
        show: function (options) {
            var self = this;
            options = options || {};
            options.cashregisters = this.pos.cashregisters;
            options.payment_methods = this.pos.payment_methods;
            options.title = options.invoice.number;
            options.invoice = options.invoice;
            this.options = options;
            this._super(options);
            $('.confirm').click(function () {
                self.click_confirm();
            });
            $('.cancel').click(function () {
                self.pos.gui.close_popup();
            });

        },
        click_confirm: function () {
            this.pos.gui.close_popup();
            this.pos.gui.show_popup('confirm', {
                title: 'Waiting',
                body: 'You request register amount invoice sending to odoo backend, please wait',
            });
            var self = this;
            var pay_amount = parseFloat(this.$('#residual').val());
            self.pay_amount = pay_amount;
            var invoice = this.options.invoice;
            if (typeof pay_amount != 'number' || isNaN(pay_amount)) {
                return self.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Register amount required is float or integer',
                });
            }
            return rpc.query({
                model: 'account.invoice',
                method: 'pos_register_amount',
                args:
                    [invoice.id, pay_amount]
            }).then(function (status) {
                if (status == false) {
                    return self.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: invoice.number + ' is paid, could not register more ',
                    });
                } else {
                    return self.gui.show_popup('confirm', {
                        title: 'Success',
                        body: invoice.number + ' registered amount ' + self.pay_amount + ' success',
                    });
                }

            }).fail(function (type, error) {
                return self.pos.query_backend_fail(type, error);
            });
        }
    });
    gui.define_popup({name: 'popup_invoice_register_payment', widget: popup_invoice_register_payment});

    // register payment pos orders
    var popup_register_payment = PopupWidget.extend({
        template: 'popup_register_payment',
        show: function (options) {
            var self = this;
            options = options || {};
            options.cashregisters = this.pos.cashregisters;
            options.amount_debit = options.pos_order.amount_total - options.pos_order.amount_paid;
            options.order = options.pos_order;
            this.options = options;
            if (options.amount_debit <= 0) {
                return this.gui.show_popup('confirm', {
                    title: _t('Warning'),
                    body: 'Order have paid full',
                });
            } else {
                this._super(options);
                this.renderElement();
                $('.payment-full').click(function () {
                    self.pos.gui.close_popup();
                    self.payment_full();
                });
                $('.confirm').click(function () {
                    self.pos.gui.close_popup();
                    self.click_confirm();
                });
                $('.cancel').click(function () {
                    self.pos.gui.close_popup();
                });
            }
        },
        click_confirm: function () {
            var self = this;
            var amount = this.$('#amount').val();
            self.amount = amount;
            var journal_id = this.$('#journal_id').val();
            var payment_reference = this.$('#payment_reference').val();
            var params = {
                session_id: self.pos.pos_session.id,
                journal_id: parseInt(journal_id),
                amount: parseFloat(amount),
                payment_name: payment_reference,
                payment_date: new Date()
            };
            var balance = this.options.pos_order['amount_total'] - this.options.pos_order['amount_paid'];
            if (parseFloat(amount) > balance) {
                return self.gui.show_popup('confirm', {
                    title: self.options.pos_order['name'],
                    body: 'You can not register amount bigger than ' + this.format_currency(balance),
                    confirm: function () {
                        return this.gui.close_popup();
                    }
                });
            }
            return rpc.query({
                model: 'pos.make.payment',
                method: 'create',
                args:
                    [params],
                context: {
                    active_id: this.options.pos_order['id']
                }
            }).then(function (payment_id) {
                return rpc.query({
                    model: 'pos.make.payment',
                    method: 'check',
                    args: [payment_id],
                    context: {
                        active_id: self.options.pos_order['id']
                    }
                }).then(function () {
                    var contents = $('.pos_detail');
                    contents.empty();
                    return self.gui.show_popup('confirm', {
                        title: self.options.pos_order['name'],
                        body: 'Registered amount ' + self.format_currency(parseFloat(self.amount)),
                    });
                })
            }).fail(function (type, error) {
                return self.pos.query_backend_fail(type, error);
            });
        },
        payment_full: function () {
            this.gui.close_popup();
            var self = this;
            var amount = this.$('#amount').val();
            self.amount = amount;
            var journal_id = this.$('#journal_id').val();
            var payment_reference = this.$('#payment_reference').val();
            var params = {
                session_id: self.pos.pos_session.id,
                journal_id: parseInt(journal_id),
                amount: this.options.pos_order.amount_total - this.options.pos_order.amount_paid,
                payment_name: payment_reference,
                payment_date: new Date()
            };
            return rpc.query({
                model: 'pos.make.payment',
                method: 'create',
                args:
                    [params],
                context: {
                    active_id: this.options.pos_order['id']
                }
            }).then(function (payment_id) {
                return rpc.query({
                    model: 'pos.make.payment',
                    method: 'check',
                    args: [payment_id],
                    context: {
                        active_id: self.options.pos_order['id']
                    }
                }).then(function () {
                    var contents = $('.pos_detail');
                    contents.empty();
                    return self.gui.show_popup('confirm', {
                        title: self.options.pos_order['name'],
                        body: 'Registered amount paid full',
                    });
                })
            }).fail(function (type, error) {
                return self.pos.query_backend_fail(type, error);
            });
        }
    });
    gui.define_popup({name: 'popup_register_payment', widget: popup_register_payment});

    var popup_order_signature = PopupWidget.extend({
        template: 'popup_order_signature',
        init: function (parent, options) {
            this._super(parent, options);
        },
        show: function (options) {
            var self = this;
            this._super(options);
            this.$(".pos_signature").jSignature();
            this.$('.confirm').click(function () {
                var order = self.pos.get_order();
                var sign_datas = self.$(".pos_signature").jSignature("getData", "image");
                if (sign_datas.length > 1) {
                    order.set_signature(sign_datas[1])
                }
                self.click_confirm();
            })
            this.$('.cancel').click(function () {
                self.click_cancel();
            })
        }
    });
    gui.define_popup({
        name: 'popup_order_signature',
        widget: popup_order_signature
    });

    var notify_popup = PopupWidget.extend({
        template: 'notify_popup',
        show: function (options) {
            if (this.pos.config.notify_alert == true) {
                this.show_notification(options.from, options.align, options.title, options.body, options.timer, options.color)
            }
        },
        show_notification: function (from, align, title, body, timer, color) {
            if (!color) {
                var type = ['info', 'success', 'warning', 'danger', 'rose', 'primary'];
                var random = Math.floor((Math.random() * 6) + 1);
                color = type[random];
            }
            if (!timer) {
                timer = 3000;
            }
            $.notify({
                icon: "notifications",
                message: "<b>" + title + "</b> - " + body

            }, {
                type: color,
                timer: timer,
                placement: {
                    from: from,
                    align: align
                }
            });
        }
    });
    gui.define_popup({name: 'notify_popup', widget: notify_popup});


    var alert_input = PopupWidget.extend({
        template: 'alert_input',
        show: function (options) {
            options = options || {};
            this._super(options);
            this.renderElement();
            this.$('input').focus();
        },
        click_confirm: function () {
            var value = this.$('input').val();
            this.gui.close_popup();
            if (this.options.confirm) {
                this.options.confirm.call(this, value);
            }
        },
    });
    gui.define_popup({name: 'alert_input', widget: alert_input});

    var popup_create_customer = PopupWidget.extend({
        template: 'popup_create_customer',
        show: function (options) {
            var self = this;
            this.uploaded_picture = null;
            this._super(options);
            var contents = this.$('.create_partner');
            contents.scrollTop(0);
            $('.confirm').click(function () {
                self.click_confirm();
            });
            $('.cancel').click(function () {
                self.click_cancel();
            });
            contents.find('.image-uploader').on('change', function (event) {
                self.load_image_file(event.target.files[0], function (res) {
                    if (res) {
                        contents.find('.client-picture img, .client-picture .fa').remove();
                        contents.find('.client-picture').append("<img src='" + res + "'>");
                        contents.find('.detail.picture').remove();
                        self.uploaded_picture = res;
                    }
                });
            });
        },
        load_image_file: function (file, callback) {
            var self = this;
            if (!file) {
                return;
            }
            if (file.type && !file.type.match(/image.*/)) {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Unsupported File Format, Only web-compatible Image formats such as .png or .jpeg are supported',
                });
            }

            var reader = new FileReader();
            reader.onload = function (event) {
                var dataurl = event.target.result;
                var img = new Image();
                img.src = dataurl;
                self.resize_image_to_dataurl(img, 600, 400, callback);
            };
            reader.onerror = function () {
                return self.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Could Not Read Image, The provided file could not be read due to an unknown error',
                });
            };
            reader.readAsDataURL(file);
        },
        resize_image_to_dataurl: function (img, maxwidth, maxheight, callback) {
            img.onload = function () {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var ratio = 1;

                if (img.width > maxwidth) {
                    ratio = maxwidth / img.width;
                }
                if (img.height * ratio > maxheight) {
                    ratio = maxheight / img.height;
                }
                var width = Math.floor(img.width * ratio);
                var height = Math.floor(img.height * ratio);

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                var dataurl = canvas.toDataURL();
                callback(dataurl);
            };
        }
    });
    gui.define_popup({name: 'popup_create_customer', widget: popup_create_customer});

    var popup_create_product = PopupWidget.extend({
        template: 'popup_create_product',
        show: function (options) {
            var self = this;
            this.uploaded_picture = null;
            this._super(options);
            var contents = this.$('.create_product');
            contents.scrollTop(0);
            $('.confirm').click(function () {
                self.click_confirm();
            });
            $('.cancel').click(function () {
                self.click_cancel();
            });
            contents.find('.image-uploader').on('change', function (event) {
                self.load_image_file(event.target.files[0], function (res) {
                    if (res) {
                        contents.find('.client-picture img, .client-picture .fa').remove();
                        contents.find('.client-picture').append("<img src='" + res + "'>");
                        contents.find('.detail.picture').remove();
                        self.uploaded_picture = res;
                    }
                });
            });
        },
        load_image_file: function (file, callback) {
            var self = this;
            if (!file) {
                return;
            }
            if (file.type && !file.type.match(/image.*/)) {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Unsupported File Format, Only web-compatible Image formats such as .png or .jpeg are supported',
                });
            }

            var reader = new FileReader();
            reader.onload = function (event) {
                var dataurl = event.target.result;
                var img = new Image();
                img.src = dataurl;
                self.resize_image_to_dataurl(img, 600, 400, callback);
            };
            reader.onerror = function () {
                return self.pos.gui.show_popup('confirm', {
                    title: 'Error',
                    body: 'Could Not Read Image, The provided file could not be read due to an unknown error',
                });
            };
            reader.readAsDataURL(file);
        },
        resize_image_to_dataurl: function (img, maxwidth, maxheight, callback) {
            img.onload = function () {
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                var ratio = 1;

                if (img.width > maxwidth) {
                    ratio = maxwidth / img.width;
                }
                if (img.height * ratio > maxheight) {
                    ratio = maxheight / img.height;
                }
                var width = Math.floor(img.width * ratio);
                var height = Math.floor(img.height * ratio);

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                var dataurl = canvas.toDataURL();
                callback(dataurl);
            };
        }
    });
    gui.define_popup({name: 'popup_create_product', widget: popup_create_product});

    var popup_set_guest = PopupWidget.extend({
        template: 'popup_set_guest',
        show: function (options) {
            var self = this;
            options = options || {};
            this._super(options);
            this.renderElement();
            this.$('.confirm').click(function () {
                self.click_confirm();
            });
            this.$('.cancel').click(function () {
                self.click_cancel();
            });
        },
        click_confirm: function () {
            var fields = {};
            this.$('.guest_field').each(function (idx, el) {
                fields[el.name] = el.value || false;
            });
            this.gui.close_popup();
            if (this.options.confirm) {
                this.options.confirm.call(this, fields);
            }
        },
    });

    gui.define_popup({name: 'popup_set_guest', widget: popup_set_guest});

    var popup_lock_session = PopupWidget.extend({
        template: 'popup_lock_session',
        show: function (options) {
            options = options || {};
            this._super(options);
            this.renderElement();
        },
        click_confirm: function () {
            var value = this.$('input').val();
            this.gui.close_popup();
            if (this.options.confirm) {
                this.options.confirm.call(this, value);
            }
        },
    });

    gui.define_popup({name: 'popup_lock_session', widget: popup_lock_session});

    _.each(gui.Gui.prototype.popup_classes, function (popup) {
        if (popup.name == 'packlotline') {
            var packlotline_widget = popup.widget;
            packlotline_widget.include({
                show: function (options) {
                    this._super(options);
                    var order = this.pos.get_order();
                    if (order) {
                        var selected_line = order.get_selected_orderline();
                        var lots = this.pos.lot_by_product_id[selected_line.product.id];
                        if (lots) {
                            var lots_auto_complete = [];
                            for (var i = 0; i < lots.length; i++) {
                                lots_auto_complete.push({
                                    value: lots[i]['name'],
                                    label: lots[i]['name']
                                })
                            }
                            var self = this;
                            var $input_lot = $('.packlot-lines  >input');
                            $input_lot.autocomplete({
                                source: lots_auto_complete,
                                minLength: this.pos.config.min_length_search,
                                select: function (event, item_selected) {
                                    if (item_selected && item_selected['item'] && item_selected['item']['value']) {
                                        var lot = self.pos.lot_by_name[item_selected['item']['value']];
                                        if (lot && lot.replace_product_public_price && lot.public_price) {
                                            var order = self.pos.get_order();
                                            var selected_line = order.get_selected_orderline();
                                            selected_line.set_unit_price(lot['public_price'])
                                        }
                                        self.click_confirm();
                                        setTimeout(function () {
                                            self.pos.get_order().get_selected_orderline().trigger('change', self.pos.get_order().get_selected_orderline());
                                        }, 500)
                                    }
                                }
                            });
                        }
                    }
                },
            })
        }
    });

    PopupWidget.include({
        close: function () {
            this._super();
            var current_screen = this.pos.gui.get_current_screen();
            if (current_screen && current_screen == 'products') {
                this.pos.trigger('back:order'); // trigger again add keyboard
            }
        },
    });

    var popup_select_tax = PopupWidget.extend({
        template: 'popup_select_tax',
        show: function (options) {
            var self = this;
            this.options = options;
            this.line_selected = options.line_selected;
            var product = this.line_selected.get_product();
            var taxes_ids = product.taxes_id;
            this._super(options);
            var taxes = _.filter(this.pos.taxes, function (tax) {
                return tax.type_tax_use == 'sale';
            });
            this.taxes_selected = [];
            for (var i = 0; i < taxes.length; i++) {
                var tax = taxes[i];
                var tax_selected = _.find(taxes_ids, function (tax_id) {
                    return tax_id == tax['id'];
                })
                if (tax_selected) {
                    tax.selected = true;
                    this.taxes_selected.push(tax);
                } else {
                    tax.selected = false;
                }
            }
            self.$el.find('div.body').html(qweb.render('tax_item', {
                taxes: taxes,
                widget: this
            }));
            this.$('.tax-item').click(function () {
                var tax_id = parseInt($(this).data('id'));
                var tax = self.pos.taxes_by_id[tax_id];
                if (tax) {
                    if ($(this).closest('.product').hasClass("item-selected") == true) {
                        $(this).closest('.product').toggleClass("item-selected");
                        self.taxes_selected = _.filter(self.taxes_selected, function (tax_selected) {
                            return tax_selected['id'] != tax['id']
                        })
                    } else {
                        $(this).closest('.product').toggleClass("item-selected");
                        self.taxes_selected.push(tax)
                    }
                }
            });
            this.$('.cancel').click(function () {
                self.gui.close_popup();
            });
            this.$('.add_taxes').click(function () {
                var order = self.pos.get_order();
                if (!order) {
                    return;
                }
                if (self.taxes_selected.length == 0) {
                    var line_selected = self.line_selected;
                    var product = line_selected.get_product();
                    product.taxes_id = [];
                    line_selected.trigger('change', line_selected);
                    line_selected.order.trigger('change', line_selected.order);
                    return self.pos.gui.close_popup();
                }
                var line_selected = self.line_selected;
                var product = line_selected.get_product();
                product.taxes_id = [];
                for (var i = 0; i < self.taxes_selected.length; i++) {
                    var tax = self.taxes_selected[i];
                    product.taxes_id.push(tax['id']);
                }
                line_selected.trigger('change', line_selected);
                line_selected.order.trigger('change', line_selected.order);
                return self.pos.gui.close_popup();
            });
        }
    });
    gui.define_popup({name: 'popup_select_tax', widget: popup_select_tax});

    var popup_cash_in = PopupWidget.extend({
        template: 'popup_cash_in',
        init: function (parent, options) {
            this._super(parent, options);
        },
        show: function (options) {
            var self = this;
            this._super(options);
            this.$(".cancel").click(function (e) {
                self.pos.gui.close_popup();
            });
        },
        renderElement: function () {
            var self = this;
            this._super();
            this.$('.cancel').click(function () {
                self.gui.close_popup();
            });
            this.$('.confirm').click(function () {
                var name = $('#cash_in_reason').val();
                var cash_in_amount = $('#cash_in_amount').val();
                self.pos.gui.close_popup();
                if (name && cash_in_amount) {
                    self.cash_in_amount = cash_in_amount
                    self.gui.close_popup();
                    var datas = {
                        name: self.pos.config.id,
                        amount: parseFloat(cash_in_amount),
                    }
                    var cashout = rpc.query({
                        model: 'cash.box.in',
                        method: 'create',
                        args: [datas]
                    });
                    cashout.then(function (cash_box_in_id) {
                        return rpc.query({
                            model: 'cash.box.in',
                            method: 'run',
                            args: [cash_box_in_id],
                            context: {
                                active_model: 'pos.session',
                                active_ids: [self.pos.pos_session['id']]
                            }
                        }).then(function (result) {
                            self.pos.gui.show_popup('confirm', {
                                title: 'Succeed',
                                body: 'You just put money in ' + self.cash_in_amount + ' done.',
                            })
                        }).fail(function (type, error) {
                            return self.pos.query_backend_fail(type, error);
                        });
                    }).fail(function (type, error) {
                        return self.pos.query_backend_fail(type, error);
                    });
                } else {
                    self.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: '2 field reason and amount required input',
                    })
                }
            })
        }
    });
    gui.define_popup({
        name: 'popup_cash_in',
        widget: popup_cash_in
    });

    var popup_cash_out = PopupWidget.extend({
        template: 'popup_cash_out',
        init: function (parent, options) {
            this._super(parent, options);
        },
        show: function (options) {
            var self = this;
            this._super(options);
            this.$(".cancel").click(function (e) {
                self.pos.gui.close_popup();
            });
        },
        renderElement: function () {
            var self = this;
            this._super();
            this.$('.cancel').click(function () {
                self.gui.close_popup();
            });
            this.$('.confirm').click(function () {
                var name = $('#cash_out_reason').val();
                var cash_out_amount = $('#cash_out_amount').val();
                self.pos.gui.close_popup();
                if (name && cash_out_amount) {
                    self.cash_out_amount = cash_out_amount
                    self.gui.close_popup();
                    var datas = {
                        name: self.pos.config.id,
                        amount: parseFloat(cash_out_amount),
                    }
                    var cashout = rpc.query({
                        model: 'cash.box.out',
                        method: 'create',
                        args: [datas]
                    });
                    cashout.then(function (cash_box_in_id) {
                        return rpc.query({
                            model: 'cash.box.out',
                            method: 'run',
                            args: [cash_box_in_id],
                            context: {
                                active_model: 'pos.session',
                                active_ids: [self.pos.pos_session['id']]
                            }
                        }).then(function (result) {
                            self.pos.gui.show_popup('confirm', {
                                title: 'Succeed',
                                body: 'You just take money out ' + self.cash_out_amount + ' done.',
                            })
                        }).fail(function (type, error) {
                            return self.pos.query_backend_fail(type, error);
                        });
                    }).fail(function (type, error) {
                        return self.pos.query_backend_fail(type, error);
                    });
                } else {
                    self.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: '2 field reason and amount is required input',
                    })
                }
            })
        }
    });
    gui.define_popup({
        name: 'popup_cash_out',
        widget: popup_cash_out
    });

});
