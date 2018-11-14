odoo.define('pos_retail.pos_rounding', function (require) {
    "use strict";

    var pos_model = require('point_of_sale.models');
    var screen = require('point_of_sale.screens');
    var SuperOrder = pos_model.Order.prototype;
    pos_model.load_fields('account.journal', ['decimal_rounding']);

    pos_model.Order = pos_model.Order.extend({
        initialize: function (attributes, options) {
            var self = this;
            this.previous_amount = 0;
            SuperOrder.initialize.call(this, attributes, options);
        },
    });

    screen.PaymentScreenWidget.include({
        init: function (parent, options) {
            this._super(parent, options);
        },
        render_paymentlines: function () {
            var self = this;
            self._super();
            self.$('.refresh-rounding-button').on('click', function (event) {
                self.update_rounding_amount($(this).data('cid'));
            });
        },
        update_rounding_amount: function (cid) {
            var self = this;
            self.click_paymentline(cid);
            var current_order = self.pos.get_order();
            var total_amount = current_order.get_total_with_tax();
            var rounding_amount = self.get_rounding_amount(total_amount);
            current_order.previous_amount = current_order.get_total_with_tax();
            if (rounding_amount != null) {
                current_order.selected_paymentline.set_amount(rounding_amount);
                self.order_changes();
                self.render_paymentlines();
                self.$('.paymentline.selected .edit').text(self.chrome.screens.payment.format_currency_no_symbol(rounding_amount));
            }
        },
        get_rounding_amount: function (total_amount) {
            var self = this;
            var selected_paymentline = self.pos.get_order().selected_paymentline;
            var rounding_amount = null;
            if (selected_paymentline) {
                var round_value = selected_paymentline.cashregister.journal.decimal_rounding;
                var decimal_val = (total_amount - Math.floor(total_amount)).toFixed(2) * 100;
                var remainder = decimal_val % round_value;
                if (round_value > 1) {
                    if (remainder >= (Math.ceil(round_value / 2))) {
                        rounding_amount = round_value - remainder;
                        rounding_amount *= -1;
                    } else {
                        rounding_amount = remainder;
                    }
                    rounding_amount = rounding_amount / 100
                }
            }
            return rounding_amount;
        },
        payment_input: function (input) { // block input if selected line use rounding journal
            var order = this.pos.get_order();
            if (!order || (order.selected_paymentline && order.selected_paymentline.cashregister.journal.pos_method_type != 'rounding')) {
                return this._super(input);
            }
        },
        click_paymentmethods: function (id) { // auto add rounding line to payment lines
            this._super(id);
            var selected_paymentline = this.pos.get_order().selected_paymentline;
            var cashregister = null;
            var current_order = this.pos.get_order();
            if (!current_order) {
                return;
            }
            for (var i = 0; i < this.pos.cashregisters.length; i++) {
                if (this.pos.cashregisters[i].journal_id[0] === id) {
                    cashregister = this.pos.cashregisters[i];
                    break;
                }
            }
            var cashregister_rounding = _.find(this.pos.cashregisters, function (register) {
                return register.journal.pos_method_type == 'rounding';
            })
            if (!cashregister_rounding) {
                return;
            }
            if (cashregister_rounding && current_order) {
                var due = current_order.get_due();
                if (due) {
                    var rounding_amount = this.get_rounding_amount(due);
                } else {
                    var total_amount = current_order.get_total_with_tax();
                    var rounding_amount = this.get_rounding_amount(total_amount);
                }
                if (rounding_amount) {
                    var payment_line_rounding = _.find(current_order.paymentlines.models, function (payment) {
                        return payment.cashregister.journal.pos_method_type == 'rounding';
                    });
                    if (payment_line_rounding) {
                        payment_line_rounding.set_amount(rounding_amount);
                    } else {
                        current_order.add_paymentline(cashregister_rounding);
                        current_order.selected_paymentline.set_amount(rounding_amount);
                    }
                    current_order.select_paymentline(selected_paymentline);
                    this.reset_input();
                    this.render_paymentlines();
                    this.order_changes();
                }
            }

        }
    });
});
