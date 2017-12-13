from odoo import http
from odoo.http import request
from odoo import SUPERUSER_ID
from odoo import models, fields, api


class ClearCart(http.Controller):

    @http.route(['/shop/clear_cart'], type='json', auth="public", methods=['POST'], website=True)
    def clear_cart(self, **kw):
        order = request.website.sale_get_order(force_create=1)
        order_line = request.env['sale.order.line'].sudo()
        line_ids = order_line.search([('order_id','=',order.id)])
        for line in line_ids :
            line_obj = order_line.browse([int(line)])
            if line_obj :
                line_obj.unlink()
                
    @http.route(['/shop/cart/total_count'], type='json', auth="public", methods=['POST'], website=True, csrf=False)
    def cart_total_count(self):
        
        order=request.website.sale_get_order()
        values={
            'cart_qty_total'   : order.cart_quantity,
            'cart_total_amount'   : order.amount_total,
            'cart_subtotal_amount'   : order.amount_untaxed,
            'currency_symbol': order.currency_id.symbol
            }
        return values 