"use strict";
/*
    This module create by: thanhchatvn@gmail.com
    License: OPL-1
    Please do not modification if i not accept
    Thanks for understand
 */
odoo.define('pos_retail.pack_lot', function (require) {
    var models = require('point_of_sale.models');

    var _super_packlot_line = models.Packlotline.prototype;
    models.Packlotline = models.Packlotline.extend({
        set_lot: function (lot) {
            this.set({lot: lot || null});
        },
        export_as_JSON: function () {
            var json = _super_packlot_line.export_as_JSON.apply(this, arguments);
            if (this.lot) {
                json['lot_id'] = this.lot.id
            }
            return json
        },
        init_from_JSON: function (json) {
            var res = _super_packlot_line.init_from_JSON.apply(this, arguments);
            if (json.lot_id) {
                var lot = this.pos.lot_by_id[json.lot_id];
                if (lot) {
                    this.set_lot(lot)
                }
            }
            return res;
        },
    })
});
