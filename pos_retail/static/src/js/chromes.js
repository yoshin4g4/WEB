odoo.define('pos_retail.chromes', function (require) {
    "use strict";

    var chrome = require('point_of_sale.chrome');
    var core = require('web.core');
    var _t = core._t;
    var qweb = core.qweb;

    chrome.Chrome.include({
        build_widgets: function () {
            this._super();
            if (this.pos.config.allow_lock_screen) {
                this.pos.default_screen = this.gui.default_screen;
                this.pos.startup_screen = this.gui.startup_screen;
                this.gui.set_startup_screen('login_page');
                this.gui.set_default_screen('login_page');
            }
        }
    });

    var CountItemWidget = chrome.StatusWidget.extend({
        template: 'CountItemWidget',

        init: function () {
            this._super(arguments[0], {});
            this.show = true;
        },
        show_buttons: function () {

        },
        hide_buttons: function () {

        },
        set_remaining_point: function (remaining_point) {
            this.$('.remain_point').html(remaining_point);
        },
        set_amount_total: function (amount_total) {
            amount_total = this.format_currency_no_symbol(amount_total)
            this.$('.amount_total').html(amount_total);
        },
        set_count_item: function (count) {
            this.$('.count_item').html(count);
        },
        start: function () {
            var self = this;
            this._super();
            $('.show_hide_buttons').click(function () { // do not add this.$
                if (self.pos.show_left_buttons) {
                    $('.buttons_pane').animate({width: 0}, 'slow');
                    $('.leftpane').animate({left: 0}, 'slow');
                    $('.rightpane').animate({left: 440}, 'slow');
                    $('.show_hide_buttons').addClass('highlight');
                    $('.fa fa-list').toggleClass('highlight');
                    $('.show_hide_buttons .fa-list').toggleClass('fa fa-list fa fa-caret-right');
                    self.pos.show_left_buttons = false;
                } else {
                    $('.buttons_pane').animate({width: 220}, 'slow');
                    $('.leftpane').animate({left: 220}, 'slow');
                    $('.rightpane').animate({left: 660}, 'slow');
                    $('.show_hide_buttons').removeClass('highlight');
                    $('.show_hide_buttons .fa-caret-right').toggleClass('fa fa-caret-right fa fa-list');
                    self.pos.show_left_buttons = true;
                }
            });
            this.pos.bind('change:selectedOrder', function () {
                var selectedOrder = self.pos.get_order();
                if (selectedOrder) {
                    var order_jon = selectedOrder.export_as_JSON();
                    self.set_count_item(selectedOrder.orderlines.length)
                    self.set_amount_total(order_jon['amount_total'])
                    if (order_jon['remaining_point']) {
                        self.set_remaining_point(order_jon['remaining_point'])
                    }
                }

            });
            this.pos.bind('update:count_item', function () {
                var selectedOrder = self.pos.get_order();
                if (selectedOrder) {
                    var order_jon = selectedOrder.export_as_JSON();
                    self.set_count_item(selectedOrder.orderlines.length)
                    self.set_amount_total(order_jon['amount_total'])
                    if (order_jon['remaining_point']) {
                        self.set_remaining_point(order_jon['remaining_point'])
                    }
                } else {
                    self.set_count_item(0);
                    self.set_amount_total(0);
                }

            });
            this.pos.bind('reset:count_item', function () {
                self.set_count_item(0);
                self.set_amount_total(0);
            });
        }
    });
    chrome.Chrome.include({
        build_widgets: function () {
            this.widgets = _.filter(this.widgets, function (widget) {
                return widget['name'] != 'count_item_widget';
            })
            this.widgets.push(
                {
                    'name': 'count_item_widget',
                    'widget': CountItemWidget,
                    'append': '.pos-branding',
                }
            );
            this._super();
        }
    });

    // validate delete order
    chrome.OrderSelectorWidget.include({
        deleteorder_click_handler: function (event, $el) {
            if (this.pos.config.validate_remove_order) {
                return this.pos.gui.show_popup('password', {
                    confirm: function (value) {
                        if (value != this.pos.user.pos_security_pin) {
                            return this.pos.gui.show_popup('confirm', {
                                title: 'Wrong',
                                body: 'Password not correct, please check pos secuirty pin',
                            })
                        } else {
                            var self = this;
                            var order = this.pos.get_order();
                            if (!order) {
                                return;
                            } else if (!order.is_empty()) {
                                this.gui.show_popup('confirm', {
                                    'title': _t('Destroy Current Order ?'),
                                    'body': _t('You will lose any data associated with the current order'),
                                    confirm: function () {
                                        self.pos.delete_current_order();
                                    },
                                });
                            } else {
                                this.pos.delete_current_order();
                            }
                        }
                    }
                })
            } else {
                return this._super()
            }
        },
        renderElement: function () {
            var self = this;
            this._super();
            if (!this.pos.config.allow_remove_order || this.pos.config.allow_remove_order == false || this.pos.config.staff_level == 'marketing' || this.pos.config.staff_level == 'waiter' || this.pos.config.staff_level == 'cashier' || this.pos.config.is_customer_screen) {
                this.$('.deleteorder-button').replaceWith('');
            }
            if (!this.pos.config.allow_add_order || this.pos.config.allow_add_order == false || this.pos.config.is_customer_screen) {
                this.$('.neworder-button').replaceWith('');
            }
            if (this.pos.config.is_customer_screen) {
                $('.pos .order-selector').css('display', 'none');
            }
        },
    })
});
