"use strict";
/*
    This module create by: thanhchatvn@gmail.com
    License: OPL-1
    Please do not modification if i not accept
    Thanks for understand
 */
odoo.define('pos_retail.order', function (require) {

    var utils = require('web.utils');
    var round_pr = utils.round_precision;
    var models = require('point_of_sale.models');
    var core = require('web.core');
    var qweb = core.qweb;
    var _t = core._t;

    var _super_Order = models.Order.prototype;
    models.Order = models.Order.extend({
        initialize: function (attributes, options) {
            _super_Order.initialize.apply(this, arguments);
            var self = this;
            this.orderlines.bind('change add remove', function (line) {
                self.pos.trigger('update:count_item')
            });
            if (!this.plus_point) {
                this.plus_point = 0;
            }
            if (!this.redeem_point) {
                this.redeem_point = 0;
            }
            if (!this.note) {
                this.note = '';
            }
            if (!this.signature) {
                this.signature = '';
            }
            this.orderlines.bind('change add remove', function (line) {
                self.trigger('update:table-list');
            });
            if (this.pos.server_version == 10 && this.pos.default_pricelist) { // default price list for version 10
                if (!this.pricelist) {
                    this.pricelist = this.pos.default_pricelist;
                    this.set_pricelist_to_order(this.pricelist);
                }
            }
            if (!this.lock) {
                this.lock = false;
            }
            if (this.pos.config.pos_auto_invoice) { // auto checked button invoice if field pos_auto_invoice checked at pos config
                this.to_invoice = true;
            }
            if (this.pos.config.auto_register_payment) { // auto checked button auto register payment if field auto_register_payment checked at pos config
                this.auto_register_payment = true;
            }
        },
        init_from_JSON: function (json) {
            var res = _super_Order.init_from_JSON.apply(this, arguments);
            if (json.date) {
                this.date = json.date;
            }
            if (json.name) {
                this.name = json.name;
            }
            if (json.email_invoice) {
                this.email_invoice = json.email_invoice;
            }
            if (json.email_invoice) {
                this.email_invoice = json.email_invoice;
            }
            if (json.auto_register_payment) {
                this.auto_register_payment = json.auto_register_payment;
            }
            if (json.delivery_date) {
                this.delivery_date = json.delivery_date;
            }
            if (json.delivery_address) {
                this.delivery_address = json.delivery_address;
            }
            if (json.delivery_phone) {
                this.delivery_phone = json.delivery_phone;
            }
            if (json.amount_debit) {
                this.amount_debit = json.amount_debit;
            }
            if (json.sale_id) {
                this.sale_id = json.sale_id;
            }
            if (json.return_order_id) {
                this.return_order_id = json.return_order_id;
            }
            if (json.is_return) {
                this.is_return = json.is_return;
            }
            if (json.add_credit) {
                this.add_credit = json.add_credit;
            }
            if (json.to_invoice) {
                this.to_invoice = json.to_invoice;
            }
            if (json.parent_id) {
                this.parent_id = json.parent_id;
            }
            if (json.invoice_journal_id) {
                this.invoice_journal_id = json.invoice_journal_id;
            }
            if (json.ean13) {
                this.ean13 = json.ean13;
            }
            if (json.plus_point) {
                this.plus_point = json.plus_point;
            }
            if (json.redeem_point) {
                this.redeem_point = json.redeem_point;
            }
            if (json.signature) {
                this.signature = json.signature
            }
            if (json.note) {
                this.note = json.note
            }
            if (this.pos.server_version == 10 && this.pos.default_pricelist) { // init price list for version 10
                if (json.pricelist_id) {
                    this.pricelist = _.find(this.pos.pricelists, function (pricelist) {
                        return pricelist.id === json.pricelist_id;
                    });
                    if (this.pricelist) {
                        this.set_pricelist_to_order(this.pricelist);
                    } else {
                        this.pricelist = this.pos.default_pricelist;
                        this.set_pricelist_to_order(this.pos.default_pricelist);
                    }
                } else {
                    this.pricelist = this.pos.default_pricelist;
                    this.set_pricelist_to_order(this.pricelist);
                }
            }
            if (json.lock) {
                this.lock = json.lock;
            } else {
                this.lock = false;
            }
            if (json.medical_insurance_id) {
                this.medical_insurance = this.pos.db.insurance_by_id[json.medical_insurance_id];
            }
            if (json.guest) {
                this.guest = json.guest;
            }
            if (json.guest_number) {
                this.guest_number = json.guest_number;
            }
            return res;
        },
        export_as_JSON: function () {
            var json = _super_Order.export_as_JSON.apply(this, arguments);
            if (this.partial_payment) {
                json.partial_payment = this.partial_payment
            }
            if (this.email_invoice) {
                json.email_invoice = this.email_invoice;
                var client = this.get_client();
                if (client && client.email) {
                    json.email = client.email;
                }
            }
            if (this.auto_register_payment) {
                json.auto_register_payment = this.auto_register_payment;
            }
            if (this.delivery_date) {
                json.delivery_date = this.delivery_date;
            }
            if (this.delivery_address) {
                json.delivery_address = this.delivery_address;
            }
            if (this.delivery_phone) {
                json.delivery_phone = this.delivery_phone;
            }
            if (this.amount_debit) {
                json.amount_debit = this.amount_debit;
            }
            if (this.sale_id) {
                json.sale_id = this.sale_id;
            }
            if (this.return_order_id) {
                json.return_order_id = this.return_order_id;
            }
            if (this.is_return) {
                json.is_return = this.is_return;
            }
            if (this.parent_id) {
                json.parent_id = this.parent_id;
            }
            if (this.add_credit) {
                json.add_credit = this.add_credit;
            }
            if (this.invoice_journal_id) {
                json.invoice_journal_id = this.invoice_journal_id;
            }
            if (this.voucher_id) {
                json.voucher_id = parseInt(this.voucher_id);
            }
            if (this.promotion_amount) {
                json.promotion_amount = this.promotion_amount;
            }
            if (this.note) {
                json.note = this.note;
            }
            if (this.signature) {
                json.signature = this.signature;
            }
            if (this.ean13) {
                json.ean13 = this.ean13;
            }
            if (!this.ean13 && this.uid) {
                var ean13 = '998';
                if (this.pos.user.id) {
                    ean13 += this.pos.user.id;
                }
                if (this.sequence_number) {
                    ean13 += this.sequence_number;
                }
                if (this.pos.config.id) {
                    ean13 += this.pos.config.id;
                }
                var format_ean13 = this.uid.split('-');
                for (var i in format_ean13) {
                    ean13 += format_ean13[i];
                }
                ean13 = ean13.split("");
                var ean13_array = []
                var ean13_str = ""
                for (var i = 0; i < ean13.length; i++) {
                    if (i < 12) {
                        ean13_str += ean13[i]
                        ean13_array.push(ean13[i])
                    }
                }
                this.ean13 = ean13_str + this.generate_unique_ean13(ean13_array).toString()
            }
            if (this.plus_point) {
                json.plus_point = this.plus_point;
            }
            if (this.redeem_point) {
                json.redeem_point = this.redeem_point;
            }
            if (this.pos.server_version == 10 && this.pricelist) { // export price list for version 10
                json.pricelist_id = this.pricelist.id;
            }
            if (this.lock) {
                json.lock = this.lock;
            } else {
                json.lock = false;
            }
            if (this.invoice_number) {
                json.invoice_number = this.invoice_number
            }
            if (this.medical_insurance) {
                json.medical_insurance_id = this.medical_insurance.id
            }
            if (this.guest) {
                json.guest = this.guest.id
            }
            if (this.guest_number) {
                json.guest_number = this.guest_number.id
            }
            return json;
        },
        export_for_printing: function () {
            var receipt = _super_Order.export_for_printing.call(this);
            var order = this.pos.get_order();
            receipt['guest'] = this.guest;
            receipt['guest_number'] = this.guest_number;
            receipt['add_credit'] = false;
            receipt['medical_insurance'] = null;
            receipt.plus_point = this.plus_point || 0;
            receipt.redeem_point = this.redeem_point || 0;
            receipt['delivery_date'] = this.delivery_date;
            receipt['delivery_address'] = this.delivery_address;
            receipt['delivery_phone'] = this.delivery_phone;
            receipt['note'] = this.note;
            receipt['signature'] = this.signature;
            if (this.promotion_amount) {
                receipt.promotion_amount = this.promotion_amount;
            }
            if (this.fiscal_position) {
                receipt.fiscal_position = this.fiscal_position
            }
            if (this.amount_debit) {
                receipt['amount_debit'] = this.amount_debit;
            }
            if (this.add_credit) {
                receipt['add_credit'] = true;
            }
            if (this.medical_insurance) {
                receipt['medical_insurance'] = this.medical_insurance;
            }
            var orderlines_by_category_name = {};
            var orderlines = order.orderlines.models;
            var categories = [];
            receipt['categories'] = [];
            receipt['orderlines_by_category_name'] = [];
            if (this.pos.config.category_wise_receipt) {
                for (var i = 0; i < orderlines.length; i++) {
                    var line = orderlines[i];
                    var pos_categ_id = line['product']['pos_categ_id']
                    line['tax_amount'] = line.get_tax();
                    if (pos_categ_id && pos_categ_id.length == 2) {
                        var root_category_id = order.get_root_category_by_category_id(pos_categ_id[0])
                        var category = this.pos.db.category_by_id[root_category_id]
                        var category_name = category['name'];
                        if (!orderlines_by_category_name[category_name]) {
                            orderlines_by_category_name[category_name] = [line];
                            var category_index = _.findIndex(categories, function (category) {
                                return category == category_name;
                            });
                            if (category_index == -1) {
                                categories.push(category_name)
                            }
                        } else {
                            orderlines_by_category_name[category_name].push(line)
                        }

                    } else {
                        if (!orderlines_by_category_name['None']) {
                            orderlines_by_category_name['None'] = [line]
                        } else {
                            orderlines_by_category_name['None'].push(line)
                        }
                        var category_index = _.findIndex(categories, function (category) {
                            return category == 'None';
                        });
                        if (category_index == -1) {
                            categories.push('None')
                        }
                    }
                }
                receipt['orderlines_by_category_name'] = orderlines_by_category_name;
                receipt['categories'] = categories;
            }
            return receipt
        },
        get_medical_insurance: function () {
            if (this.medical_insurance) {
                return this.medical_insurance
            } else {
                return null
            }
        },
        get_guest: function () {
            if (this.guest) {
                return this.guest
            } else {
                return null
            }
        },
        validate_medical_insurance: function () {
            var lines = this.orderlines.models;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line['medical_insurance']) {
                    this.remove_orderline(line);
                }
            }
            if (this.medical_insurance) {
                var total_without_tax = this.get_total_without_tax();
                var product = this.pos.db.product_by_id[this.medical_insurance.product_id[0]]
                var price = total_without_tax / 100 * this.medical_insurance.rate
                this.add_product(product, {
                    price: price,
                    quantity: -1
                });
                var selected_line = this.get_selected_orderline();
                selected_line['medical_insurance'] = true;
                selected_line.discount_reason = this.medical_insurance.name;
                selected_line.trigger('update:OrderLine', selected_line);
                selected_line.trigger('change', selected_line);
            }
        },
        validate_promotion: function () {
            var self = this;
            var active_promotion = this.current_order_can_apply_promotion();
            var promotions_apply = active_promotion['promotions_apply'];
            if (promotions_apply.length) {
                this.pos.gui.show_screen('products');
                this.pos.gui.show_popup('confirm', {
                    title: 'Promotion active',
                    body: 'Are you want apply promotion on this order ?',
                    confirm: function () {
                        self.remove_all_promotion_line();
                        self.compute_promotion();
                        setTimeout(function () {
                            self.validate_global_discount();
                        }, 1000);
                        self.pos.gui.show_screen('payment');
                    },
                    cancel: function () {
                        setTimeout(function () {
                            self.validate_global_discount();
                        }, 1000);
                        self.pos.gui.show_screen('payment');
                    }
                });
            } else {
                setTimeout(function () {
                    self.validate_global_discount();
                }, 1000);
            }
        },
        validate_global_discount: function () {
            var self = this;
            var client = this && this.get_client();
            if (client && client['discount_id']) {
                this.pos.gui.show_screen('products');
                this.discount = this.pos.discount_by_id[client['discount_id'][0]];
                this.pos.gui.show_screen('products');
                var body = client['name'] + ' have discount ' + self.discount['name'] + '. Are you want apply ?';
                return this.pos.gui.show_popup('confirm', {
                    'title': _t('Customer special discount ?'),
                    'body': body,
                    confirm: function () {
                        self.add_global_discount(self.discount);
                        self.pos.gui.show_screen('payment');
                        self.validate_payment();
                    },
                    cancel: function () {
                        self.pos.gui.show_screen('payment');
                        self.validate_payment();
                    }
                });
            } else {
                this.validate_payment();
            }
        },
        validate_payment: function () {
            var self = this;
            if (this.pos.config.validate_payment) {
                this.pos.gui.show_screen('products');
                return this.pos.gui.show_popup('password', {
                    title: 'Input pos security pin ?',
                    confirm: function (value) {
                        if (value != this.pos.user.pos_security_pin) {
                            return this.pos.gui.show_popup('confirm', {
                                title: 'Wrong',
                                body: 'Password not correct, please check pos security pin'
                            })
                        } else {
                            return self.pos.gui.show_screen('payment');
                        }
                    }
                })
            }
        },
        validate_payment_order: function () {
            if (this && this.orderlines.models.length == 0) {
                this.pos.gui.show_screen('products');
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Your order lines is blank'
                })
            }
            this.validate_promotion();
            this.validate_medical_insurance();
        },
        add_global_discount: function (discount) {
            var total_without_tax = this.get_total_without_tax();
            var product = this.pos.db.product_by_id[discount.product_id[0]]
            var price = total_without_tax / 100 * discount['amount']
            this.add_product(product, {
                price: price,
                quantity: -1
            });
            var selected_line = this.get_selected_orderline();
            selected_line.discount_reason = discount.reason;
            selected_line.trigger('update:OrderLine', selected_line);
            selected_line.trigger('change', selected_line);
        },
        is_email_invoice: function () { // send email invoice or not
            return this.email_invoice;
        },
        is_auto_register_payment: function () { // auto register payment or not
            return this.auto_register_payment;
        },
        set_email_invoice: function (email_invoice) {
            this.assert_editable();
            this.email_invoice = email_invoice;
            this.set_to_invoice(email_invoice);
        },
        set_auto_register_payment: function (auto_register_payment) {
            this.assert_editable();
            this.auto_register_payment = auto_register_payment;
            this.set_to_invoice(auto_register_payment);
        },
        get_root_category_by_category_id: function (category_id) { // get root of category, root is parent category is null
            var root_category_id = category_id;
            var category_parent_id = this.pos.db.category_parent[category_id];
            if (category_parent_id) {
                root_category_id = this.get_root_category_by_category_id(category_parent_id)
            }
            return root_category_id
        },
        // odoo wrong when compute price with tax have option price inclued
        // and now i fixing
        fix_tax_included_price: function (line) {
            _super_Order.fix_tax_included_price.apply(this, arguments);
            if (this.fiscal_position) {
                var unit_price = line.product['list_price'];
                var taxes = line.get_taxes();
                var mapped_included_taxes = [];
                _(taxes).each(function (tax) {
                    var line_tax = line._map_tax_fiscal_position(tax);
                    if (tax.price_include && tax.id != line_tax.id) {

                        mapped_included_taxes.push(tax);
                    }
                })
                if (mapped_included_taxes.length > 0) {
                    unit_price = line.compute_all(mapped_included_taxes, unit_price, 1, this.pos.currency.rounding, true).total_excluded;
                    line.set_unit_price(unit_price);
                }
            }
        },
        set_signature: function (signature) {
            this.signature = signature;
            this.trigger('change', this);
        },
        get_signature: function () {
            if (this.signature) {
                return 'data:image/png;base64, ' + this.signature
            } else {
                return null
            }
        },
        set_note: function (note) {
            this.note = note;
            this.trigger('change', this);
        },
        get_note: function (note) {
            return this.note;
        },
        active_button_add_wallet: function (active) {
            var $add_wallet = $('.add_wallet');
            if (!$add_wallet) {
                return;
            }
            if (active) {
                $add_wallet.removeClass('oe_hidden');
                $add_wallet.addClass('highlight')
            } else {
                $add_wallet.addClass('oe_hidden');
            }
        },
        get_change: function (paymentline) {
            var change = _super_Order.get_change.apply(this, arguments);
            var client = this.get_client();
            var wallet_register = _.find(this.pos.cashregisters, function (register_journal) {
                return register_journal.journal['pos_method_type'] == 'wallet';
            }); // display wallet method when have change
            if (wallet_register) {
                var $journal_element = $("[data-id='" + wallet_register.journal['id'] + "']");
                if (change > 0 || (client && client['wallet'] > 0)) {
                    $journal_element.removeClass('oe_hidden');
                    $journal_element.addClass('highlight');
                } else {
                    $journal_element.addClass('oe_hidden');
                }
            }
            var company_currency = this.pos.company.currency_id; // return amount with difference currency
            if (paymentline && paymentline.cashregister && paymentline.cashregister.currency_id && paymentline.cashregister.currency_id[0] != company_currency[0]) {
                var new_change = -this.get_total_with_tax();
                var lines = this.paymentlines.models;
                var company_currency = this.pos.company.currency_id;
                var company_currency_data = this.pos.currency_by_id[company_currency[0]];
                for (var i = 0; i < lines.length; i++) {
                    var selected_currency = this.pos.currency_by_id[lines[i].cashregister.currency_id[0]];
                    var selected_rate = selected_currency['rate'];
                    var amount_of_line = lines[i].get_amount();
                    new_change += amount_of_line * selected_rate / company_currency_data['rate'];
                    if (lines[i] === paymentline) {
                        break;
                    }
                }
                var currency_change = round_pr(Math.max(0, new_change), this.pos.currency.rounding);
                if (currency_change > 0) {
                    this.active_button_add_wallet(true);
                } else {
                    this.active_button_add_wallet(false);
                }
                return currency_change
            }
            if (change > 0) {
                this.active_button_add_wallet(true);
            } else {
                this.active_button_add_wallet(false);
            }
            return change;
        },
        get_due: function (paymentline) {
            var due = _super_Order.get_due.apply(this, arguments);
            if (!paymentline) {
                return due;
            }
            var active_multi_currency = false;
            var lines = this.paymentlines.models;
            var company_currency = this.pos.company.currency_id;
            var company_currency_data = this.pos.currency_by_id[company_currency[0]];
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var currency_id_of_line = line.cashregister.currency_id[0];
                var currency_of_line = this.pos.currency_by_id[currency_id_of_line];
                if (currency_of_line['id'] != company_currency_data['id']) {
                    active_multi_currency = true;
                }
            }
            var paymentline_currency_id = paymentline.cashregister.currency_id[0]
            var paymentline_currency = this.pos.currency_by_id[paymentline_currency_id];
            var payment_rate = paymentline_currency['rate'];
            if (paymentline_currency['id'] != company_currency_data['id']) {
                active_multi_currency = true
            }
            if (!active_multi_currency || active_multi_currency == false) {
                return due;
            } else {
                var total_amount_with_tax = this.get_total_with_tax();
                if (!payment_rate || payment_rate == 0) {
                    return due
                }
                var new_due = total_amount_with_tax * payment_rate / company_currency_data['rate'];
                var lines = this.paymentlines.models;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] === paymentline) {
                        break;
                    } else {
                        var line = lines[i];
                        var line_cashregister = line['cashregister'];
                        var line_currency_rate = this.pos.currency_by_id[line_cashregister['currency_id'][0]]['rate'];
                        var line_amount = lines[i].get_amount() * line_currency_rate;
                        new_due -= line_amount * payment_rate / company_currency_data['rate'];
                    }
                }
                var new_due = round_pr(Math.max(0, new_due), this.pos.currency.rounding);
                return new_due
            }
        },
        get_due_without_rounding: function (paymentline) {
            if (!paymentline) {
                var due = this.get_total_with_tax() - this.get_total_paid();
            } else {
                var due = this.get_total_with_tax();
                var lines = this.paymentlines.models;
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i] === paymentline) {
                        break;
                    } else {
                        due -= lines[i].get_amount();
                    }
                }
            }
            return due;
        },
        get_total_paid: function () {
            var total_paid = _super_Order.get_total_paid.apply(this, arguments);
            var lines = this.paymentlines.models;
            var active_multi_currency = false;
            var total_paid_multi_currency = 0;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                var currency = line.cashregister.currency_id;
                var company_currency = this.pos.company.currency_id;
                var company_currency_data = this.pos.currency_by_id[company_currency[0]];
                if (currency[0] != company_currency[0]) {
                    var register_currency = this.pos.currency_by_id[currency[0]];
                    var register_rate = register_currency['rate'];
                    active_multi_currency = true;
                    total_paid_multi_currency += line.get_amount() * register_rate / company_currency_data['rate'];
                } else {
                    total_paid_multi_currency += line.get_amount()
                }
            }
            if (active_multi_currency == true) {
                return round_pr(Math.max(0, total_paid_multi_currency), this.pos.currency.rounding);
            } else {
                return total_paid;
            }
        },
        generate_unique_ean13: function (array_code) {
            if (array_code.length != 12) {
                return -1
            }
            var evensum = 0;
            var oddsum = 0;
            for (var i = 0; i < array_code.length; i++) {
                if ((i % 2) == 0) {
                    evensum += parseInt(array_code[i])
                } else {
                    oddsum += parseInt(array_code[i])
                }
            }
            var total = oddsum * 3 + evensum
            return parseInt((10 - total % 10) % 10)
        },
        get_product_image_url: function (product) {
            return window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + product.id;
        },
        add_product: function (product, options) {
            if (product['qty_available'] <= 0 && this.pos.config['allow_order_out_of_stock'] == false && product['type'] == 'product') {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Product is out of stock, your config setting have not allowed add products when them have out of stock.',
                });
            }
            var res = _super_Order.add_product.apply(this, arguments);
            var selected_orderline = this.selected_orderline;
            var combo_items = [];
            for (var i = 0; i < this.pos.combo_items.length; i++) {
                var combo_item = this.pos.combo_items[i];
                if (combo_item.product_combo_id[0] == selected_orderline.product.product_tmpl_id && combo_item.default == true) {
                    combo_items.push(combo_item);
                }
            }
            if (selected_orderline) {
                selected_orderline['combo_items'] = combo_items;
                selected_orderline.trigger('change', selected_orderline);
            }
            var product_tmpl_id = product['product_tmpl_id'];
            if (product_tmpl_id && product_tmpl_id.length == undefined && (product['cross_selling'] || product['suggestion_sale'])) {
                // cross selling
                var cross_items = _.filter(this.pos.cross_items, function (cross_item) {
                    return cross_item['product_tmpl_id'][0] == product_tmpl_id;
                });
                if (cross_items.length) {
                    this.pos.gui.show_popup('popup_cross_selling', {
                        widget: this,
                        cross_items: cross_items
                    });
                }
                var suggestion_items = _.filter(this.pos.suggestion_items, function (suggestion_item) {
                    return suggestion_item['product_tmpl_id'][0] == product_tmpl_id;
                });
                var contents = $('.product-list-re-comment'); // sale suggestion
                if (suggestion_items.length && contents) {
                    contents.empty();
                    contents.css({'display': 'table'})
                    for (var i = 0; i < suggestion_items.length; i++) {
                        var suggestion_product = this.pos.db.get_product_by_id(suggestion_items[i]['product_id'][0])
                        if (suggestion_product) {
                            var image_url = this.get_product_image_url(suggestion_product);
                            var product_html = qweb.render('product_suggestion', {
                                widget: this.pos.chrome,
                                suggestion: suggestion_items[i],
                                pricelist: this.pricelist || this.pos.default_pricelist,
                                image_url: image_url
                            });
                            contents.append(product_html);
                        }
                    }
                } else {
                    contents.css({'display': 'none'})
                }
            }
            return res
        },
        validation_order_can_do_internal_transfer: function () {
            var can_do = true;
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var product = this.orderlines.models[i].product;
                if (product['type'] == 'service' || product['uom_po_id'] == undefined) {
                    can_do = false;
                }
            }
            if (this.orderlines.models.length == 0) {
                can_do = false;
            }
            return can_do;
        },
        build_plus_point: function () { // auto compute loyalty point
            var plus_point = 0;
            var lines = this.orderlines.models;
            if (lines.length == 0 || !lines) {
                return plus_point;
            }
            var amount_total_included_tax = this.get_total_with_tax();
            var loyalty_ids = this.pos.loyalty_ids;
            if (!loyalty_ids) {
                return plus_point;
            }
            var rules = [];
            if (loyalty_ids.length > 0) {
                for (var i = 0; i < loyalty_ids.length; i++) {
                    var rules_by_loylaty_id = this.pos.rules_by_loyalty_id[loyalty_ids[i]]
                    if (!rules_by_loylaty_id) {
                        continue;
                    }
                    for (var j = 0; j < rules_by_loylaty_id.length; j++) {
                        rules.push(rules_by_loylaty_id[j]);
                    }
                }
            } else {
                return plus_point;
            }
            if (!rules) {
                return plus_point;
            }
            if (rules.length) {
                for (var j = 0; j < lines.length; j++) {
                    var line = lines[j];
                    if (line['redeem_point'] || line['promotion']) {
                        line['plus_point'] = 0;
                        continue;
                    }
                    if (line['is_return']) {
                        plus_point += line['plus_point'];
                        continue;
                    } else {
                        line.plus_point = 0;
                        for (var i = 0; i < rules.length; i++) {
                            var rule = rules[i];
                            if (!line.redeem_point || line.redeem_point == 0) {
                                var plus = round_pr(line['price'] * line['quantity'] * rule['coefficient'], rule['rounding'])
                                if (rule['type'] == 'products' && rule['product_ids'].indexOf(line.product['id']) != -1) {
                                    line.plus_point += plus;
                                    plus_point += plus;
                                } else if (rule['type'] == 'categories' && rule['category_ids'].indexOf(line.product.pos_categ_id[0]) != -1) {
                                    line.plus_point += plus;
                                    plus_point += plus;
                                } else if (rule['type'] == 'order_amount') {
                                    var order_amount_by_rule_id = this.pos.order_amount_by_rule_id[rule['id']];
                                    if (order_amount_by_rule_id.length > 0) {
                                        var amount_temp = 0;
                                        var order_amount_rule_apply = null;
                                        for (var z = 0; z < order_amount_by_rule_id.length; z++) {
                                            var current_order_rule = order_amount_by_rule_id[z];
                                            if (current_order_rule['amount_from'] >= amount_temp && amount_total_included_tax >= current_order_rule['amount_from']) {
                                                amount_temp = current_order_rule['amount_from'];
                                                order_amount_rule_apply = current_order_rule;
                                            }
                                        }
                                        if (order_amount_rule_apply) {
                                            var point_plus = round_pr(order_amount_rule_apply['point'] / lines.length, rule['rounding'])
                                            line.plus_point += point_plus;
                                            plus_point += point_plus;
                                            console.log('type order_amount + ' + point_plus + ' point ')
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } else {
                return plus_point;
            }
            return plus_point;
        },
        build_redeem_point: function () {
            var redeem_point = 0;
            var lines = this.orderlines.models;
            if (lines.length == 0 || !lines) {
                return redeem_point;
            }
            for (var i = 0; i < lines.length; i++) {
                if (lines[i].redeem_point > 0) {
                    redeem_point += lines[i].redeem_point;
                }
            }
            return redeem_point;
        },
        get_total_without_promotion_and_tax: function () {
            var rounding = this.pos.currency.rounding;
            var orderlines = this.orderlines.models;
            var sum = 0;
            var i = 0;
            while (i < orderlines.length) {
                var line = orderlines[i];
                if (line.promotion && line.promotion == true) {
                    i++;
                    continue
                }
                sum += round_pr(line.get_unit_price() * line.get_quantity() * (1 - line.get_discount() / 100), rounding)
                i++
            }
            return sum;
        },
        compute_promotion: function () {
            var self = this;
            var promotions = this.pos.promotions
            if (promotions) {
                this.remove_all_promotion_line();
                for (var i = 0; i < promotions.length; i++) {
                    var type = promotions[i].type
                    var order = this;
                    if (order.orderlines.length) {
                        if (type == '1_discount_total_order') { // discount filter by total of current order
                            order.compute_discount_total_order(promotions[i]);
                        }
                        if (type == '2_discount_category') { // discount by category
                            order.compute_discount_category(promotions[i]);
                        }
                        if (type == '3_discount_by_quantity_of_product') { // discount by quantity of product
                            order.compute_discount_by_quantity_of_products(promotions[i]);
                        }
                        if (type == '4_pack_discount') { // discount by pack
                            order.compute_pack_discount(promotions[i]);
                        }
                        if (type == '5_pack_free_gift') { // free items filter by pack
                            order.compute_pack_free_gift(promotions[i]);
                        }
                        if (type == '6_price_filter_quantity') { // re-build price filter by quantity of product
                            order.compute_price_filter_quantity(promotions[i]);
                        }
                        if (type == '7_special_category') {
                            order.compute_special_category(promotions[i]);
                        }
                        if (type == '8_discount_lowest_price') {
                            order.compute_discount_lowest_price(promotions[i]);
                        }
                        if (type == '9_multi_buy') {
                            order.compute_multi_buy(promotions[i]);
                        }
                    }
                }
                var applied_promotion = false;
                for (var i = 0; i < this.orderlines.models.length; i++) {
                    if (this.orderlines.models[i]['promotion'] == true) {
                        applied_promotion = true;
                        break;
                    }
                }
                if (applied_promotion == false) {
                    return this.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'Have not any promotion applied',
                    });
                }
            }
        },
        remove_all_promotion_line: function () {
            var lines = this.orderlines.models;
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line['promotion'] || line['promotion_discount_total_order'] || line['promotion_discount_category'] || line['promotion_discount_by_quantity'] || line['promotion_discount'] || line['promotion_gift'] || line['promotion_price_by_quantity']) {
                    this.remove_orderline(line);
                }
            }
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line['promotion'] || line['promotion_discount_total_order'] || line['promotion_discount_category'] || line['promotion_discount_by_quantity'] || line['promotion_discount'] || line['promotion_gift'] || line['promotion_price_by_quantity']) {
                    this.remove_orderline(line);
                }
            }
        },
        product_quantity_by_product_id: function () {
            var lines_list = {};
            var lines = this.orderlines.models;
            var i = 0;
            while (i < lines.length) {
                var line = lines[i];
                if (line.promotion) {
                    i++;
                    continue
                }
                if (!lines_list[line.product.id]) {
                    lines_list[line.product.id] = line.quantity;
                } else {
                    lines_list[line.product.id] += line.quantity;
                }
                i++;
            }
            return lines_list
        },
        // 1) check current order can apply discount by total order
        checking_apply_total_order: function (promotion) {
            var discount_lines = this.pos.promotion_discount_order_by_promotion_id[promotion.id];
            var total_order = this.get_total_without_promotion_and_tax();
            var discount_line_tmp = null;
            var discount_tmp = 0;
            if (discount_lines) {
                var i = 0;
                while (i < discount_lines.length) {
                    var discount_line = discount_lines[i];
                    if (total_order >= discount_line.minimum_amount && total_order >= discount_tmp) {
                        discount_line_tmp = discount_line;
                        discount_tmp = discount_line.minimum_amount
                    }
                    i++;
                }
            }
            return discount_line_tmp;
        },
        // 2) check current order can apply discount by categories
        checking_can_discount_by_categories: function (promotion) {
            var can_apply = false
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            if (!product || !this.pos.promotion_by_category_id) {
                return false;
            }
            for (var i in this.pos.promotion_by_category_id) {
                var promotion_line = this.pos.promotion_by_category_id[i];
                var amount_total_by_category = 0;
                var z = 0;
                var lines = this.orderlines.models;
                while (z < lines.length) {
                    if (!lines[z].product.pos_categ_id) {
                        z++;
                        continue;
                    }
                    if (lines[z].product.pos_categ_id[0] == promotion_line.category_id[0]) {
                        amount_total_by_category += lines[z].get_price_without_tax();
                    }
                    z++;
                }
                if (amount_total_by_category > 0) {
                    can_apply = true
                }
            }
            return can_apply
        },
        // 3) check condition for apply discount by quantity product
        checking_apply_discount_filter_by_quantity_of_product: function (promotion) {
            var can_apply = false;
            var rules = this.pos.promotion_quantity_by_product_id;
            var product_quantity_by_product_id = this.product_quantity_by_product_id();
            for (var product_id in product_quantity_by_product_id) {
                var rules_by_product_id = rules[product_id];
                if (rules_by_product_id) {
                    for (var i = 0; i < rules_by_product_id.length; i++) {
                        var rule = rules_by_product_id[i];
                        if (rule && product_quantity_by_product_id[product_id] >= rule.quantity) {
                            can_apply = true;
                        }
                    }
                }
            }
            return can_apply;
        },
        // 4 & 5 : check pack free gift and pack discount product
        checking_pack_discount_and_pack_free_gift: function (rules) {
            var can_apply = true;
            var product_quantity_by_product_id = this.product_quantity_by_product_id();
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                var product_id = parseInt(rule.product_id[0]);
                var minimum_quantity = rule.minimum_quantity;
                if (!product_quantity_by_product_id[product_id] || product_quantity_by_product_id[product_id] < minimum_quantity) {
                    can_apply = false;
                }
            }
            return can_apply
        },
        // 6. check condition for apply price filter by quantity of product
        checking_apply_price_filter_by_quantity_of_product: function (promotion) {
            var condition = false;
            var rules = this.pos.promotion_price_by_promotion_id[promotion.id];
            var product_quantity_by_product_id = this.product_quantity_by_product_id();
            for (var i = 0; i < rules.length; i++) {
                var rule = rules[i];
                if (rule && product_quantity_by_product_id[rule.product_id[0]] && product_quantity_by_product_id[rule.product_id[0]] >= rule.minimum_quantity) {
                    condition = true;
                }
            }
            return condition;
        },
        // 7. checking promotion special category
        checking_apply_specical_category: function (promotion) {
            var condition = false;
            var promotion_lines = this.pos.promotion_special_category_by_promotion_id[promotion['id']];
            this.lines_by_category_id = {};
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                var pos_categ_id = line['product']['pos_categ_id'][0]
                if (pos_categ_id) {
                    if (!this.lines_by_category_id[pos_categ_id]) {
                        this.lines_by_category_id[pos_categ_id] = [line]
                    } else {
                        this.lines_by_category_id[pos_categ_id].push(line)
                    }
                }
            }
            for (var i = 0; i < promotion_lines.length; i++) {
                var promotion_line = promotion_lines[i];
                var categ_id = promotion_line['category_id'][0];
                var total_quantity = 0;

                if (this.lines_by_category_id[categ_id]) {
                    var total_quantity = 0;
                    for (var i = 0; i < this.lines_by_category_id[categ_id].length; i++) {
                        total_quantity += this.lines_by_category_id[categ_id][i]['quantity']
                    }
                    if (promotion_line['count'] <= total_quantity) {
                        condition = true;
                    }
                }
            }
            return condition;
        },
        // 9. checking multi buy
        checking_multi_by: function (promotion) {
            var condition = false;
            var rule_applied = {};
            var total_qty_by_product = {};
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                if (!total_qty_by_product[line.product.id]) {
                    total_qty_by_product[line.product.id] = line.quantity;
                } else {
                    total_qty_by_product[line.product.id] += line.quantity;
                }
            }
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                var product_id = line.product.id;
                var rules = this.pos.multi_buy_by_product_id[product_id];
                if (rules) {
                    for (var n = 0; n < rules.length; n++) {
                        var rule = rules[n];
                        if (!rule_applied[rule['product_id'][0]] && rule['quantity_of_by'] <= total_qty_by_product[rule['product_id'][0]]) {
                            rule_applied[rule['product_id'][0]] = rule;
                            condition = true;
                        }
                        if (rule_applied[rule['product_id'][0]]) {
                            var old_rule = rule_applied[rule['product_id'][0]];
                            var new_rule = rule;
                            if (rule['quantity_of_by'] <= total_qty_by_product[rule['product_id'][0]] && new_rule['quantity_of_by'] >= old_rule['quantity_of_by']) {
                                rule_applied[rule['product_id'][0]] = new_rule;
                                condition = true;
                            }
                        }
                    }
                }
            }
            return condition;
        },
        // 1. compute promotion discount
        compute_discount_total_order: function (promotion) { // 1. compute discount filter by total order
            var discount_line_tmp = this.checking_apply_total_order(promotion)
            if (discount_line_tmp == null) {
                return false;
            }
            var total_order = this.get_total_without_promotion_and_tax();
            if (discount_line_tmp && total_order > 0) {
                var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
                var price = -total_order / 100 * discount_line_tmp.discount
                if (product && price != 0) {
                    var options = {};
                    options.promotion_discount_total_order = true;
                    options.promotion = true;
                    options.promotion_reason = 'discount ' + discount_line_tmp.discount + ' % ' + ' because total order greater or equal ' + discount_line_tmp.minimum_amount;
                    this.add_promotion(product, price, 1, options)
                }
            }
        },
        // 2. compute promotion discount by category
        compute_discount_category: function (promotion) { // 2. compute discount filter by product categories
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            if (!product || !this.pos.promotion_by_category_id) {
                return false;
            }
            var can_apply = this.checking_can_discount_by_categories(promotion);
            if (can_apply == false) {
                return false;
            }
            for (var i in this.pos.promotion_by_category_id) {
                var promotion_line = this.pos.promotion_by_category_id[i];
                var amount_total_by_category = 0;
                var z = 0;
                var lines = this.orderlines.models;
                while (z < lines.length) {
                    if (!lines[z].product.pos_categ_id) {
                        z++;
                        continue;
                    }
                    if (lines[z].product.pos_categ_id[0] == promotion_line.category_id[0]) {
                        amount_total_by_category += lines[z].get_price_without_tax();
                    }
                    z++;
                }
                if (amount_total_by_category > 0) {
                    var price = -amount_total_by_category / 100 * promotion_line.discount
                    var options = {};
                    options.promotion_discount_category = true;
                    options.promotion = true;
                    options.promotion_reason = ' discount ' + promotion_line.discount + ' % from ' + promotion_line.category_id[1];
                    this.add_promotion(product, price, 1, options)
                }
            }
        },
        // 3. compute discount filter by quantity of product
        compute_discount_by_quantity_of_products: function (promotion) {
            var check = this.checking_apply_discount_filter_by_quantity_of_product(promotion)
            if (check == false) {
                return;
            }
            var quantity_by_product_id = {}
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            var i = 0;
            var lines = this.orderlines.models;
            while (i < lines.length) {
                var line = lines[i];
                if (!quantity_by_product_id[line.product.id]) {
                    quantity_by_product_id[line.product.id] = line.quantity;
                } else {
                    quantity_by_product_id[line.product.id] += line.quantity;
                }
                i++;
            }
            for (i in quantity_by_product_id) {
                var product_id = i;
                var promotion_lines = this.pos.promotion_quantity_by_product_id[product_id];
                if (!promotion_lines) {
                    continue;
                }
                var quantity_tmp = 0;
                var promotion_line = null;
                var j = 0;
                for (j in promotion_lines) {
                    if (quantity_tmp <= promotion_lines[j].quantity && quantity_by_product_id[i] >= promotion_lines[j].quantity) {
                        promotion_line = promotion_lines[j];
                        quantity_tmp = promotion_lines[j].quantity
                    }
                }
                var lines = this.orderlines.models;
                var amount_total_by_product = 0;
                if (lines.length) {
                    var x = 0;
                    while (x < lines.length) {
                        if (lines[x].promotion) {
                            x++;
                            continue
                        }
                        if (lines[x].promotion_discount_by_quantity) {
                            this.remove_orderline(lines[x]);
                        }
                        if (lines[x].product.id == product_id && lines[x].promotion != true) {
                            amount_total_by_product += lines[x].get_price_without_tax()
                        }
                        x++;
                    }
                }
                if (amount_total_by_product > 0 && promotion_line) {
                    var price = -amount_total_by_product / 100 * promotion_line.discount
                    var options = {};
                    options.promotion_discount_by_quantity = true;
                    options.promotion = true;
                    options.promotion_reason = ' discount ' + promotion_line.discount + ' % when ' + promotion_line.product_id[1] + ' have quantity greater or equal ' + promotion_line.quantity;
                    this.add_promotion(product, price, 1, options)
                }
            }
        },

        // 4. compute discount product filter by pack items
        compute_pack_discount: function (promotion) {
            var promotion_condition_items = this.pos.promotion_discount_condition_by_promotion_id[promotion.id];
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            var check = this.checking_pack_discount_and_pack_free_gift(promotion_condition_items);
            if (check == true) {
                var discount_items = this.pos.promotion_discount_apply_by_promotion_id[promotion.id]
                if (!discount_items) {
                    return;
                }
                var i = 0;
                while (i < discount_items.length) {
                    var discount_item = discount_items[i];
                    var discount = 0;
                    var lines = this.orderlines.models;
                    for (var x = 0; x < lines.length; x++) {
                        if (lines[x].promotion) {
                            continue;
                        }
                        if (lines[x].product.id == discount_item.product_id[0]) {
                            discount += lines[x].get_price_without_tax()
                        }
                    }
                    if (product && discount > 0) {
                        var price = -discount / 100 * discount_item.discount
                        var options = {};
                        options.promotion_discount = true;
                        options.promotion = true;
                        options.promotion_reason = 'discount ' + discount_item.product_id[1] + ' ' + discount_item.discount + ' % of Pack name: ' + promotion.name;
                        this.add_promotion(product, price, 1, options)
                    }
                    i++;
                }
            }
        },
        // get total quantity by product on order lines
        count_quantity_by_product: function (product) {
            var qty = 0;
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                if (line.product['id'] == product['id']) {
                    qty += line['quantity'];
                }
            }
            return qty;
        },

        // 5. compute gift products filter by pack items
        compute_pack_free_gift: function (promotion) {
            var promotion_condition_items = this.pos.promotion_gift_condition_by_promotion_id[promotion.id];
            var check = this.checking_pack_discount_and_pack_free_gift(promotion_condition_items);
            if (check == true) {
                var gifts = this.pos.promotion_gift_free_by_promotion_id[promotion.id]
                if (!gifts) {
                    return;
                }
                var products_condition = {};
                for (var i = 0; i < promotion_condition_items.length; i++) {
                    var condition = promotion_condition_items[i];
                    var product = this.pos.db.get_product_by_id(condition.product_id[0]);
                    products_condition[product['id']] = this.count_quantity_by_product(product)
                }
                var can_continue = true;
                var temp = 1;
                for (var i = 1; i < 100; i++) {
                    for (var j = 0; j < promotion_condition_items.length; j++) {
                        var condition = promotion_condition_items[j];
                        var condition_qty = condition.minimum_quantity;
                        var product = this.pos.db.get_product_by_id(condition.product_id[0]);
                        var total_qty = this.count_quantity_by_product(product);
                        if (i * condition_qty <= total_qty) {
                            can_continue = true;
                        } else {
                            can_continue = false
                        }
                    }
                    if (can_continue == true) {
                        temp = i;
                    } else {
                        break;
                    }
                }
                var i = 0;
                while (i < gifts.length) {
                    var product = this.pos.db.get_product_by_id(gifts[i].product_id[0]);
                    if (product) {
                        var quantity = gifts[i].quantity_free * temp;
                        var options = {};
                        options.promotion_gift = true;
                        options.promotion = true;
                        options.promotion_reason = 'Free ' + quantity + ' ' + product['display_name'] + ' because [' + promotion.name + '] active';
                        this.add_promotion(product, 0, quantity, options)
                    }
                    i++;
                }
            }
        },
        // 6. compute and reset price of line filter by rule: price filter by quantity of product
        compute_price_filter_quantity: function (promotion) {
            var promotion_prices = this.pos.promotion_price_by_promotion_id[promotion.id]
            var product = this.pos.db.get_product_by_id(promotion.product_id[0]);
            if (promotion_prices) {
                var prices_item_by_product_id = {};
                for (var i = 0; i < promotion_prices.length; i++) {
                    var item = promotion_prices[i];
                    if (!prices_item_by_product_id[item.product_id[0]]) {
                        prices_item_by_product_id[item.product_id[0]] = [item]
                    } else {
                        prices_item_by_product_id[item.product_id[0]].push(item)
                    }
                }
                var quantity_by_product_id = this.product_quantity_by_product_id()
                var discount = 0;
                for (i in quantity_by_product_id) {
                    if (prices_item_by_product_id[i]) {
                        var quantity_tmp = 0
                        var price_item_tmp = null
                        // root: quantity line, we'll compare this with 2 variable quantity line greater minimum quantity of item and greater quantity temp
                        for (var j = 0; j < prices_item_by_product_id[i].length; j++) {
                            var price_item = prices_item_by_product_id[i][j];
                            if (quantity_by_product_id[i] >= price_item.minimum_quantity && quantity_by_product_id[i] >= quantity_tmp) {
                                quantity_tmp = price_item.minimum_quantity;
                                price_item_tmp = price_item;
                            }
                        }
                        if (price_item_tmp) {
                            var discount = 0;
                            var z = 0;
                            while (z < lines.length) {
                                var line = lines[z];
                                if (line.product.id == price_item_tmp.product_id[0]) {
                                    discount += line.get_price_without_tax() - (line.quantity * price_item_tmp.list_price)
                                }
                                z++;
                            }
                            if (discount > 0) {
                                var price = -discount;
                                var options = {};
                                options.promotion_price_by_quantity = true;
                                options.promotion = true;
                                options.promotion_reason = ' By greater or equal ' + price_item_tmp.minimum_quantity + ' ' + price_item_tmp.product_id[1] + ' applied price ' + price_item_tmp.list_price
                                this.add_promotion(product, price, 1, options)
                            }
                        }
                    }
                }
            }
        },
        // 7. compute promotion filter by special category
        compute_special_category: function (promotion) {
            var product_service = this.pos.db.product_by_id[promotion['product_id'][0]];
            var promotion_lines = this.pos.promotion_special_category_by_promotion_id[promotion['id']];
            this.lines_by_category_id = {};
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                if (line.promotion) {
                    continue;
                }
                var pos_categ_id = line['product']['pos_categ_id'][0]
                if (pos_categ_id) {
                    if (!this.lines_by_category_id[pos_categ_id]) {
                        this.lines_by_category_id[pos_categ_id] = [line]
                    } else {
                        this.lines_by_category_id[pos_categ_id].push(line)
                    }
                }
            }
            for (var i = 0; i < promotion_lines.length; i++) {
                var promotion_line = promotion_lines[i];
                var categ_id = promotion_line['category_id'][0];
                if (this.lines_by_category_id[categ_id]) {
                    var total_quantity = 0;
                    for (var i = 0; i < this.lines_by_category_id[categ_id].length; i++) {
                        total_quantity += this.lines_by_category_id[categ_id][i]['quantity']
                    }
                    if (promotion_line['count'] <= total_quantity) {
                        var promotion_type = promotion_line['type'];
                        if (promotion_type == 'discount') {
                            var discount = 0;
                            var quantity = 0;
                            var lines = this.lines_by_category_id[categ_id];
                            for (var j = 0; j < lines.length; j++) {
                                quantity += lines[j]['quantity'];
                                if (quantity >= promotion_line['count']) {
                                    discount += lines[j].get_price_without_tax() / 100 / lines[j]['quantity'] * promotion_line['discount']
                                }
                            }
                            if (discount > 0) {
                                this.add_promotion(product_service, -discount, 1, {
                                    promotion: true,
                                    promotion_special_category: true,
                                    promotion_reason: 'By bigger than or equal ' + promotion_line['count'] + ' product of ' + promotion_line['category_id'][1] + ' discount ' + promotion_line['discount'] + ' %'
                                })
                            }
                        }
                        if (promotion_type == 'free') {
                            var product_free = this.pos.db.product_by_id[promotion_line['product_id'][0]];
                            if (product_free) {
                                this.add_promotion(product_free, 0, promotion_line['qty_free'], {
                                    promotion: true,
                                    promotion_special_category: true,
                                    promotion_reason: 'By bigger than or equal ' + promotion_line['count'] + ' product of ' + promotion_line['category_id'][1] + ' free ' + promotion_line['qty_free'] + ' ' + product_free['display_name']
                                })
                            }
                        }
                    }
                }
            }
        },
        compute_discount_lowest_price: function (promotion) { // compute discount lowest price
            var orderlines = this.orderlines.models;
            var line_apply = null;
            for (var i = 0; i < orderlines.length; i++) {
                var line = orderlines[i];
                if (!line_apply) {
                    line_apply = line
                } else {
                    if (line.get_price_with_tax() < line_apply.get_price_with_tax()) {
                        line_apply = line;
                    }
                }
            }
            var product_discount = this.pos.db.product_by_id[promotion.product_id[0]];
            if (product_discount) {
                this.add_promotion(product_discount, line_apply.get_price_with_tax(), -1, {
                    promotion: true,
                    promotion_discount_lowest_price: true,
                    promotion_reason: 'Discount ' + promotion.discount_lowest_price + ' % on product ' + line_apply.product.display_name + ', from promotion ' + promotion.name
                })
            }
        },
        compute_multi_buy: function (promotion) { // compute multi by
            var rule_applied = {};
            var total_qty_by_product = {};
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                if (!total_qty_by_product[line.product.id]) {
                    total_qty_by_product[line.product.id] = line.quantity;
                } else {
                    total_qty_by_product[line.product.id] += line.quantity;
                }
            }
            for (var i = 0; i < this.orderlines.models.length; i++) {
                var line = this.orderlines.models[i];
                var product_id = line.product.id;
                var rules = this.pos.multi_buy_by_product_id[product_id];
                if (rules) {
                    for (var n = 0; n < rules.length; n++) {
                        var rule = rules[n];
                        if (!rule_applied[rule['product_id'][0]] && rule['quantity_of_by'] <= total_qty_by_product[rule['product_id'][0]]) {
                            rule_applied[rule['product_id'][0]] = rule;
                        }
                        if (rule_applied[rule['product_id'][0]]) {
                            var old_rule = rule_applied[rule['product_id'][0]];
                            var new_rule = rule;
                            if (rule['quantity_of_by'] <= total_qty_by_product[rule['product_id'][0]] && new_rule['quantity_of_by'] >= old_rule['quantity_of_by']) {
                                rule_applied[rule['product_id'][0]] = new_rule;
                            }
                        }
                    }
                }
            }
            var product_discount = this.pos.db.product_by_id[promotion.product_id[0]];
            if (rule_applied && product_discount) {
                for (var product_id in rule_applied) {
                    var product = this.pos.db.get_product_by_id(product_id);
                    var quantity_promotion = rule_applied[product_id]['quantity_promotion'];
                    var price_promotion = rule_applied[product_id]['price_promotion'];
                    var total_qty = 0;
                    for (var i = 0; i < this.orderlines.models.length; i++) {
                        var line = this.orderlines.models[i];
                        if (line.product.id == product.id) {
                            total_qty += line.quantity
                        }
                    }
                    var qty_not_apply = total_qty - quantity_promotion;
                    var price_end = product['price'] * qty_not_apply + quantity_promotion * price_promotion;
                    var total_price_discount = product['price'] * total_qty - price_end;
                    this.add_promotion(product_discount, total_price_discount, -1, {
                        promotion: true,
                        promotion_multi_buy: true,
                        promotion_reason: 'By ' + quantity_promotion + ' ' + product['display_name'] + ' for price ' + price_promotion
                    })
                }
            }
        },
        // add promotion to current order
        add_promotion: function (product, price, quantity, options) {
            var line = new models.Orderline({}, {pos: this.pos, order: this, product: product});
            if (options.promotion) {
                line.promotion = options.promotion;
            }
            if (options.promotion_reason) {
                line.promotion_reason = options.promotion_reason;
            }
            if (options.promotion_discount_total_order) {
                line.promotion_discount_total_order = options.promotion_discount_total_order;
            }
            if (options.promotion_discount_category) {
                line.promotion_discount_category = options.promotion_discount_category;
            }
            if (options.promotion_discount_by_quantity) {
                line.promotion_discount_by_quantity = options.promotion_discount_by_quantity;
            }
            if (options.promotion_discount) {
                line.promotion_discount = options.promotion_discount;
            }
            if (options.promotion_gift) {
                line.promotion_gift = options.promotion_gift;
            }
            if (options.promotion_price_by_quantity) {
                line.promotion_price_by_quantity = options.promotion_price_by_quantity;
            }
            if (options.promotion_special_category) {
                line.promotion_special_category = options.promotion_special_category;
            }
            if (options.promotion_discount_lowest_price) {
                line.promotion_discount_lowest_price = options.promotion_discount_lowest_price;
            }
            line.price_manually_set = true; // no need pricelist change, price of promotion change the same, i blocked
            line.set_quantity(quantity);
            line.set_unit_price(price);
            this.orderlines.add(line);
            this.trigger('change', this);
        },
        current_order_can_apply_promotion: function () {
            var can_apply = null;
            var promotions_apply = []
            if (!this.pos.promotions) {
                return {
                    can_apply: can_apply,
                    promotions_apply: []
                };
            }
            for (var i = 0; i < this.pos.promotions.length; i++) {
                var promotion = this.pos.promotions[i];
                if (promotion['type'] == '1_discount_total_order' && this.checking_apply_total_order(promotion)) {
                    can_apply = true;
                    promotions_apply.push(promotion);
                }
                else if (promotion['type'] == '2_discount_category' && this.checking_can_discount_by_categories(promotion)) {
                    can_apply = true;
                    promotions_apply.push(promotion);
                }
                else if (promotion['type'] == '3_discount_by_quantity_of_product' && this.checking_apply_discount_filter_by_quantity_of_product(promotion)) {
                    can_apply = true;
                    promotions_apply.push(promotion);
                }
                else if (promotion['type'] == '4_pack_discount') {
                    var promotion_condition_items = this.pos.promotion_discount_condition_by_promotion_id[promotion.id];
                    var check = this.checking_pack_discount_and_pack_free_gift(promotion_condition_items);
                    if (check) {
                        can_apply = true;
                        promotions_apply.push(promotion);
                    }
                }
                else if (promotion['type'] == '5_pack_free_gift') {
                    var promotion_condition_items = this.pos.promotion_gift_condition_by_promotion_id[promotion.id];
                    var check = this.checking_pack_discount_and_pack_free_gift(promotion_condition_items);
                    if (check) {
                        can_apply = true;
                        promotions_apply.push(promotion);
                    }
                }
                else if (promotion['type'] == '6_price_filter_quantity' && this.checking_apply_price_filter_by_quantity_of_product(promotion)) {
                    can_apply = true;
                    promotions_apply.push(promotion);
                }
                else if (promotion['type'] == '7_special_category' && this.checking_apply_specical_category(promotion)) {
                    can_apply = true;
                    promotions_apply.push(promotion);
                }
                else if (promotion['type'] == '8_discount_lowest_price') {
                    can_apply = true;
                    promotions_apply.push(promotion);
                }
                else if (promotion['type'] == '9_multi_buy') {
                    can_apply = this.checking_multi_by(promotion);
                    if (can_apply) {
                        promotions_apply.push(promotion);
                    }
                }
            }
            return {
                can_apply: can_apply,
                promotions_apply: promotions_apply
            };
        },
        // set prices list to order
        // this method only use for version 10
        set_pricelist_to_order: function (pricelist) {
            var self = this;
            if (!pricelist) {
                return;
            }
            this.pricelist = pricelist;
            // change price of current order lines
            _.each(this.get_orderlines(), function (line) {
                var price = self.pos.db.compute_price(line['product'], pricelist, line.quantity);
                line['product']['price'] = price;
                line.set_unit_price(price);
            });
            // after update order lines price
            // will update screen product and with new price
            this.update_product_price(pricelist);
            this.trigger('change', this);
        },
        update_product_price: function (pricelist) {
            var self = this;
            var products = this.pos.products;
            for (var i = 0; i < products.length; i++) {
                var product = products[i];
                var price = this.pos.db.compute_price(product, pricelist, 1);
                product['price'] = price;
            }
            self.pos.trigger('product:change_price_list', products)
        },
        set_to_add_credit: function (add_credit) {
            this.add_credit = add_credit;
        },
        is_add_credit: function () {
            return this.add_credit || false;
        }
    });

    var _super_Orderline = models.Orderline.prototype;
    models.Orderline = models.Orderline.extend({
        initialize: function (attributes, options) {
            var res = _super_Orderline.initialize.apply(this, arguments);
            this.combo_items = this.combo_items || [];
            this.tags = this.tags || [];
            this.variants = this.variants || [];
            this.plus_point = this.plus_point || 0;
            this.redeem_point = this.redeem_point || 0;
            return res;
        },
        init_from_JSON: function (json) {
            var res = _super_Orderline.init_from_JSON.apply(this, arguments);
            if (json.user_id) {
                var user = this.pos.user_by_id[json.user_id];
                if (user) {
                    this.set_sale_person(user)
                }
            }
            if (json.tag_ids && json.tag_ids.length) {
                this.tags = [];
                var tag_ids = json.tag_ids[0][2];
                for (var i = 0; i < tag_ids.length; i++) {
                    var tag_id = tag_ids[i];
                    var tag = this.pos.tag_by_id[tag_id];
                    this.tags.push(tag);
                }
            }
            if (json.is_return) {
                this.is_return = json.is_return;
            }
            if (json.plus_point) {
                this.plus_point = json.plus_point;
            }
            if (json.redeem_point) {
                this.redeem_point = json.redeem_point;
            }
            if (json.uom_id) {
                this.uom_id = json.uom_id;
                var unit = this.pos.units_by_id[json.uom_id]
                if (unit) {
                    this.product.uom_id = [unit['id'], unit['name']];
                }
            }
            if (this.note) {
                this.note = this.set_line_note(json.note);
            }
            if (json.variants) {
                this.variants = json.variants
            }
            if (json.promotion) {
                this.promotion = json.promotion;
            }
            if (json.promotion_reason) {
                this.promotion_reason = json.promotion_reason;
            }
            if (json.promotion_discount_total_order) {
                this.promotion_discount_total_order = json.promotion_discount_total_order;
            }
            if (json.promotion_discount_category) {
                this.promotion_discount_category = json.promotion_discount_category;
            }
            if (json.promotion_discount_by_quantity) {
                this.promotion_discount_by_quantity = json.promotion_discount_by_quantity;
            }
            if (json.promotion_gift) {
                this.promotion_gift = json.promotion_gift;
            }
            if (json.promotion_discount) {
                this.promotion_discount = json.promotion_discount;
            }
            if (json.promotion_price_by_quantity) {
                this.promotion_price_by_quantity = json.promotion_price_by_quantity;
            }
            if (json.discount_reason) {
                this.discount_reason = json.discount_reason;
            }
            if (json.medical_insurance) {
                this.medical_insurance = json.medical_insurance;
            }
            return res;
        },
        export_as_JSON: function () {
            var json = _super_Orderline.export_as_JSON.apply(this, arguments);
            if (this.user_id) {
                json.user_id = this.user_id.id;
            }
            if (this.tags) {
                var tag_ids = [];
                for (var i = 0; i < this.tags.length; i++) {
                    tag_ids.push(this.tags[i].id)
                }
                if (tag_ids.length) {
                    json.tag_ids = [[6, false, tag_ids]]
                }
            }
            if (this.get_line_note()) {
                json.note = this.get_line_note();
            }
            if (this.is_return) {
                json.is_return = this.is_return;
            }
            if (this.combo_items) {
                json.combo_items = this.combo_items;
            }
            if (this.plus_point) {
                json.plus_point = this.plus_point;
            }
            if (this.redeem_point) {
                json.redeem_point = this.redeem_point;
            }
            if (this.uom_id) {
                json.uom_id = this.uom_id
            }
            if (this.variants) {
                json.variants = this.variants;
            }
            if (this.promotion) {
                json.promotion = this.promotion;
            }
            if (this.promotion_reason) {
                json.promotion_reason = this.promotion_reason;
            }
            if (this.promotion_discount_total_order) {
                json.promotion_discount_total_order = this.promotion_discount_total_order;
            }
            if (this.promotion_discount_category) {
                json.promotion_discount_category = this.promotion_discount_category;
            }
            if (this.promotion_discount_by_quantity) {
                json.promotion_discount_by_quantity = this.promotion_discount_by_quantity;
            }
            if (this.promotion_discount) {
                json.promotion_discount = this.promotion_discount;
            }
            if (this.promotion_gift) {
                json.promotion_gift = this.promotion_gift;
            }
            if (this.promotion_price_by_quantity) {
                json.promotion_price_by_quantity = this.promotion_price_by_quantity;
            }
            if (this.discount_reason) {
                json.discount_reason = this.discount_reason
            }
            if (this.medical_insurance) {
                json.medical_insurance = this.medical_insurance
            }
            return json;
        },
        clone: function () {
            var orderline = _super_Orderline.clone.call(this);
            orderline.note = this.note;
            return orderline;
        },
        export_for_printing: function () {
            var receipt_line = _super_Orderline.export_for_printing.apply(this, arguments);
            receipt_line['combo_items'] = [];
            receipt_line['variants'] = [];
            receipt_line['tags'] = [];
            receipt_line['note'] = this.note || '';
            receipt_line['promotion'] = null;
            receipt_line['promotion_reason'] = null;
            if (this.combo_items) {
                receipt_line['combo_items'] = this.combo_items;
            }
            if (this.variants) {
                receipt_line['variants'] = this.variants;
            }
            if (this.promotion) {
                receipt_line.promotion = this.promotion;
                receipt_line.promotion_reason = this.promotion_reason;
            }
            if (this.tags) {
                receipt_line['tags'] = this.tags;
            }
            if (this.discount_reason) {
                receipt_line['discount_reason'] = this.discount_reason;
            }
            receipt_line['tax_amount'] = this.get_tax() || 0.00;
            return receipt_line;
        },
        set_global_discount: function (discount) {
            this.discount_reason = discount.reason;
            this.set_discount(discount.amount);
            this.trigger('change', this);
        },
        change_unit: function () {
            var self = this;
            var product = this.product;
            var uom_items = this.pos.uoms_prices_by_product_tmpl_id[product.product_tmpl_id]
            if (!uom_items) {
                this.pos.gui.show_popup('notify_popup', {
                    title: 'ERROR',
                    from: 'top',
                    align: 'center',
                    body: product['display_name'] + ' have ' + product['uom_id'][1] + ' only.',
                    color: 'danger',
                    timer: 2000
                });
                return;
            }
            var list = [];
            for (var i = 0; i < uom_items.length; i++) {
                var item = uom_items[i];
                list.push({
                    'label': item.uom_id[1],
                    'item': item,
                });
            }
            if (list.length) {
                this.pos.gui.show_popup('selection', {
                    title: _t('Select Unit need to change'),
                    list: list,
                    confirm: function (item) {
                        self.set_unit_price(item['price'])
                        self.uom_id = item['uom_id'][0];
                        self.trigger('change', this);
                        self.trigger('update:OrderLine');
                    }
                });
            } else {
                return this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: product['display_name'] + ' only one ' + product['uom_id'][1],
                });
            }
        },
        change_combo: function () {
            var line = this;
            var combo_items = _.filter(this.pos.combo_items, function (combo_item) {
                return combo_item.product_combo_id[0] == line.product.product_tmpl_id || combo_item.product_combo_id[0] == line.product.product_tmpl_id[0]
            });
            if (combo_items.length) {
                this.pos.gui.show_popup('popup_selection_combos', {
                    title: 'Please choice items',
                    combo_items: combo_items,
                    selected_orderline: this
                });
            } else {
                this.pos.gui.show_popup('confirm', {
                    title: 'Warning',
                    body: 'Product is combo but have not set combo items',
                });
            }
        },
        change_cross_selling: function () {
            var self = this;
            var cross_items = _.filter(this.pos.cross_items, function (cross_item) {
                return cross_item['product_tmpl_id'][0] == self.product.product_tmpl_id;
            });
            if (cross_items.length) {
                this.pos.gui.show_popup('popup_cross_selling', {
                    widget: this,
                    cross_items: cross_items
                });
            }
        },
        get_sale_person: function () {
            return this.user_id || null
        },
        set_sale_person: function (user) {
            this.user_id = user;
            this.trigger('change', this);
        },
        get_price_without_quantity: function () {
            if (this.quantity != 0) {
                return this.get_price_with_tax() / this.quantity
            } else {
                return 0
            }
        },
        get_line_image: function () { // show image on receipt and orderlines
            return window.location.origin + '/web/image?model=product.product&field=image_medium&id=' + this.product.id;
        },
        // ------------- **** --------------------------------------
        // when cashiers select line, auto pop-up cross sell items
        // or if product have suggestion items, render element show all suggestion items
        // ------------- **** --------------------------------------
        set_selected: function (selected) {
            _super_Orderline.set_selected.apply(this, arguments);
            var self = this;
            var contents = $('.product-list-re-comment');
            if (this.product && this.selected && (this.product['cross_selling'] || this.product['suggestion_sale'])) {
                var product_tmpl_id = this.product['product_tmpl_id'];
                if (product_tmpl_id && product_tmpl_id.length == undefined) {
                    var suggestion_items = _.filter(this.pos.suggestion_items, function (suggestion_item) {
                        return suggestion_item['product_tmpl_id'][0] == product_tmpl_id;
                    });
                    if (suggestion_items.length && contents) {
                        contents.empty();
                        contents.css({'display': 'inherit'})
                        for (var i = 0; i < suggestion_items.length; i++) {
                            var suggestion_product = this.pos.db.get_product_by_id(suggestion_items[i]['product_id'][0])
                            if (suggestion_product) {
                                var image_url = this.order.get_product_image_url(suggestion_product);
                                var product_html = qweb.render('product_suggestion', {
                                    widget: this.pos.chrome,
                                    suggestion: suggestion_items[i],
                                    pricelist: this.pricelist || this.pos.default_pricelist,
                                    image_url: image_url
                                });
                                contents.append(product_html);
                            }
                        }
                        $('.product-list-re-comment .product').click(function () {
                            var suggestion_id = parseInt($(this).data()['suggestionId']);
                            if (suggestion_id) {
                                var suggestion = self.pos.suggestion_by_id[suggestion_id];
                                var product_id = suggestion['product_id'][0];
                                var product = self.pos.db.get_product_by_id(product_id);
                                if (product) {
                                    self.pos.get_order().add_product(product);
                                    var selected_orderline = self.pos.get_order().selected_orderline;
                                    selected_orderline.set_unit_price(suggestion['list_price']);
                                    selected_orderline.set_quantity(suggestion['quantity'], 'keep price when add suggestion item');
                                }
                            }
                        })
                    }
                    else if (!suggestion_items && contents) {
                        contents.css({'display': 'none'});
                    }
                }
            }
            if (this.selected == false) {
                contents.css({'display': 'none'})
            }
        },
        is_has_tags: function () {
            if (!this.tags || this.tags.length == 0) {
                return true
            } else {
                return false
            }
        },
        is_multi_variant: function () {
            var variants = this.pos.variant_by_product_tmpl_id[this.product.product_tmpl_id];
            if (!variants) {
                return
            }
            if (variants.length > 0) {
                return true;
            } else {
                return false;
            }
        },
        get_price_discount: function () { // method return discount amount of pos order lines gui
            var price_unit = this.get_unit_price();
            var prices = this.get_all_prices();
            var priceWithTax = prices['priceWithTax'];
            var tax = prices['tax'];
            var discount = priceWithTax - tax - price_unit;
            return discount
        },
        get_unit: function () {
            if (!this.uom_id) {
                return _super_Orderline.get_unit.apply(this, arguments);
            } else {
                var unit_id = this.uom_id
                return this.pos.units_by_id[unit_id];
            }
        },
        is_multi_unit_of_measure: function () {
            var uom_items = this.pos.uoms_prices_by_product_tmpl_id[this.product.product_tmpl_id];
            if (!uom_items) {
                return false;
            }
            if (uom_items.length > 0) {
                return true;
            } else {
                return false;
            }
        },
        is_combo: function () {
            var combo_items = [];
            for (var i = 0; i < this.pos.combo_items.length; i++) {
                var combo_item = this.pos.combo_items[i];
                if (combo_item.product_combo_id[0] == this.product['product_tmpl_id']) {
                    combo_items.push(combo_item);
                }
            }
            if (combo_items.length > 0) {
                return true
            } else {
                return false;
            }
        },
        has_combo_item_tracking_lot: function () {
            var tracking = false;
            for (var i = 0; i < this.pos.combo_items.length; i++) {
                var combo_item = this.pos.combo_items[i];
                if (combo_item['tracking']) {
                    tracking = true;
                }
            }
            return tracking;
        },
        set_quantity: function (quantity, keep_price) {
            if (this.uom_id) {
                keep_price = 'keep price because changed uom id'
            }
            if (this.pos.the_first_load == false && quantity != 'remove' && this.pos.config['allow_order_out_of_stock'] == false && quantity && quantity != 'remove' && this.order.syncing != true && this.product['type'] != 'service') {
                var current_qty = 0
                for (var i = 0; i < this.order.orderlines.models.length; i++) {
                    var line = this.order.orderlines.models[i];
                    if (this.product.id == line.product.id && line.id != this.id) {
                        current_qty += line.quantity
                    }
                }
                current_qty += parseFloat(quantity);
                if (current_qty > this.product['qty_available'] && this.product['type'] == 'product') {
                    var product = this.pos.db.get_product_by_id(this.product.id);
                    return this.pos.gui.show_popup('confirm', {
                        title: 'Warning',
                        body: 'You can not set quantity bigger than ' + product.qty_available + ' unit',
                    });
                }
            }
            var res = _super_Orderline.set_quantity.call(this, quantity, keep_price); // call style change parent parameter : keep_price
            var order = this.order;
            var orderlines = order.orderlines.models;
            if (!order.fiscal_position || orderlines.length != 0) {
                for (var i = 0; i < orderlines.length; i++) { // reset taxes_id of line
                    orderlines[i]['taxes_id'] = [];
                }
            }
            if (order.fiscal_position && orderlines.length) {
                var fiscal_position = order.fiscal_position;
                var fiscal_position_taxes_by_id = fiscal_position.fiscal_position_taxes_by_id
                if (fiscal_position_taxes_by_id) {
                    for (var number in fiscal_position_taxes_by_id) {
                        var fiscal_tax = fiscal_position_taxes_by_id[number];
                        var tax_src_id = fiscal_tax.tax_src_id;
                        var tax_dest_id = fiscal_tax.tax_dest_id;
                        if (tax_src_id && tax_dest_id) {
                            for (var i = 0; i < orderlines.length; i++) { // reset taxes_id of line
                                orderlines[i]['taxes_id'] = [];
                            }
                            for (var i = 0; i < orderlines.length; i++) { // append taxes_id of line
                                var line = orderlines[i];
                                var product = line.product;
                                var taxes_id = product.taxes_id;
                                for (var number in taxes_id) {
                                    var tax_id = taxes_id[number];
                                    if (tax_id == tax_src_id[0]) {
                                        orderlines[i]['taxes_id'].push(tax_dest_id[0]);
                                    }
                                }
                            }
                        }
                    }
                } else {
                    for (var i = 0; i < orderlines.length; i++) { // reset taxes_id of line
                        orderlines[i]['taxes_id'] = [];
                    }
                }
            }
            return res;
        },
        set_unit_price: function (price) {
            if (price > 0) {
                if (this.plus_point && this.plus_point > 0) {
                    var curr_plus_point = this.plus_point;
                    var new_plus = price / this.price * curr_plus_point;
                    this.plus_point = new_plus;
                }
                else if (this.redeem_point && this.redeem_point > 0 && this.price > 0) {
                    var curr_redeem_point = this.redeem_point;
                    var new_redeem_point = price / this.price * curr_redeem_point;
                    this.redeem_point = new_redeem_point;
                }
            } else if (price <= 0) {
                if (this.plus_point && this.plus_point > 0) {
                    this.plus_point = 0;
                }
                else if (this.redeem_point && this.redeem_point > 0) {
                    this.redeem_point = 0;
                }
            }
            return _super_Orderline.set_unit_price.apply(this, arguments);
        },
        set_line_note: function (note) {
            this.note = note;
            if (this.syncing == false || !this.syncing) {
                if (this.pos.pos_bus) {
                    var order = this.order.export_as_JSON();
                    this.pos.pos_bus.push_message_to_other_sessions({
                        action: 'set_line_note',
                        data: {
                            uid: this.uid,
                            note: note,
                        },
                        bus_id: this.pos.config.bus_id[0],
                        order_uid: order.uid,
                    });
                }
            }
            this.trigger('change', this);
        },
        get_line_note: function (note) {
            return this.note;
        },
        can_be_merged_with: function (orderline) {
            var merge = _super_Orderline.can_be_merged_with.apply(this, arguments);
            var current_price = this.price;
            var line_add_price;
            if (this.pos.server_version == 10) {
                var line_add_price = this.price;
            }
            if (this.pos.server_version == 11) {
                var line_add_price = orderline.get_product().get_price(orderline.order.pricelist, this.get_quantity());
            }
            var current_price_round = round_pr(Math.max(0, current_price), this.pos.currency.rounding);
            var line_add_price_round = round_pr(Math.max(0, line_add_price), this.pos.currency.rounding);
            if (orderline.get_line_note() !== this.get_line_note() || this.promotion) {
                return false;
            }
            if (current_price != line_add_price && current_price_round == line_add_price_round) {
                if (this.get_product().id !== orderline.get_product().id) {
                    return false;
                } else if (!this.get_unit() || !this.get_unit().is_pos_groupable) {
                    return false;
                } else if (this.get_product_type() !== orderline.get_product_type()) {
                    return false;
                } else if (this.get_discount() > 0) {
                    return false;
                } else if (this.product.tracking == 'lot') {
                    return false;
                } else {
                    return true;
                }
            }
            return merge
        },
        compute_all: function (taxes, price_unit, quantity, currency_rounding, no_map_tax) {
            var all_taxes = _super_Orderline.compute_all.apply(this, arguments);
            if (!this.taxes_id || this.taxes_id == [] || this.taxes_id.length == 0) {
                return all_taxes;
            } else {
                var taxes = [];
                for (var number in this.taxes_id) {
                    taxes.push(this.pos.taxes_by_id[this.taxes_id[number]])
                }
                var self = this;
                var list_taxes = [];
                var currency_rounding_bak = currency_rounding;
                if (this.pos.company.tax_calculation_rounding_method == "round_globally") {
                    currency_rounding = currency_rounding * 0.00001;
                }
                var total_excluded = round_pr(price_unit * quantity, currency_rounding);
                var total_included = total_excluded;
                var base = total_excluded;
                _(taxes).each(function (tax) {
                    if (!no_map_tax) {
                        tax = self._map_tax_fiscal_position(tax);
                    }
                    if (!tax) {
                        return;
                    }
                    if (tax.amount_type === 'group') {
                        var ret = self.compute_all(tax.children_tax_ids, price_unit, quantity, currency_rounding);
                        total_excluded = ret.total_excluded;
                        base = ret.total_excluded;
                        total_included = ret.total_included;
                        list_taxes = list_taxes.concat(ret.taxes);
                    }
                    else {
                        var tax_amount = self._compute_all(tax, base, quantity);
                        tax_amount = round_pr(tax_amount, currency_rounding);

                        if (tax_amount) {
                            if (tax.price_include) {
                                total_excluded -= tax_amount;
                                base -= tax_amount;
                            }
                            else {
                                total_included += tax_amount;
                            }
                            if (tax.include_base_amount) {
                                base += tax_amount;
                            }
                            var data = {
                                id: tax.id,
                                amount: tax_amount,
                                name: tax.name,
                            };
                            list_taxes.push(data);
                        }
                    }
                });
                var tax_values = {
                    taxes: list_taxes,
                    total_excluded: round_pr(total_excluded, currency_rounding_bak),
                    total_included: round_pr(total_included, currency_rounding_bak)
                }
                return tax_values;
            }

        },
    });
});
