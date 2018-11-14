/*
    This module create by: thanhchatvn@gmail.com
    License: OPL-1
    Please do not modification if i not accept
    Thanks for understand
 */
odoo.define('pos_retail.paymentline', function (require) {
    var models = require('point_of_sale.models');
    var utils = require('web.utils');
    var round_di = utils.round_decimals;

    // multi currency
    var _super_paymentlinne = models.Paymentline.prototype;
    models.Paymentline = models.Paymentline.extend({
        initialize: function (attributes, options) {
            _super_paymentlinne.initialize.apply(this, arguments);
            this.amount_currency = this.amount_currency || 0;
            this.currency_id = this.currency_id || null;
        },
        set_amount: function (value) {
            _super_paymentlinne.set_amount.apply(this, arguments);
            var order = this.pos.get_order();
            var company_currency = this.pos.currency_by_id[this.pos.currency['id']];
            var amount = parseFloat(value);
            if (this.selected_currency && this.selected_currency['rate'] != 0) {
                var rate = order.selected_currency['rate'];
                if (rate != undefined && rate != 0) {
                    this.currency_id = this.selected_currency['id'];
                    this.amount_currency = amount;
                    this.amount = this.amount_currency * company_currency['rate'] / rate;
                }
            } else if (order.selected_currency) {
                var rate = order.selected_currency['rate'];
                if (rate != undefined && rate != 0) {
                    this.selected_currency = order.selected_currency;
                    this.amount_currency = amount;
                    this.amount = this.amount_currency * company_currency['rate'] / order.selected_currency['rate'];
                    this.currency_id = this.selected_currency['id'];
                }
            }
            this.trigger('change', this);
        },
        export_as_JSON: function () {
            var json = _super_paymentlinne.export_as_JSON.apply(this, arguments);
            if (this.currency_id) {
                json['currency_id'] = this.currency_id;
            }
            if (this.amount_currency) {
                json['amount_currency'] = this.amount_currency;
            }
            return json;
        },
        export_for_printing: function () {
            var json = _super_paymentlinne.export_for_printing.apply(this, arguments);
            if (this.currency_id) {
                json['currency_id'] = this.currency_id;
            }
            if (this.selected_currency) {
                json['selected_currency'] = this.selected_currency;
            }
            if (this.amount_currency) {
                json['amount_currency'] = this.amount_currency;
            }
            return json;
        },
        init_from_JSON: function (json) {
            var res = _super_paymentlinne.init_from_JSON.apply(this, arguments);
            if (json['currency_id']) {
                var company_currency = this.pos.currency_by_id[this.pos.currency['id']];
                this['selected_currency'] = this.pos.currency_by_id[json['currency_id']];
                this['amount_currency'] = round_di(this.amount * company_currency['rate'] / this['selected_currency']['rate'], this.pos.currency.decimals);
                this['currency_id'] = this.pos.currency_by_id[json['currency_id']]['id'];
            }
            return res;
        }
    });
});
