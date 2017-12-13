from odoo import http, _
from odoo.http import request
from odoo.addons.clarico_shop.controllers.main import claricoShop
import json

class Claricoproductcomparison(claricoShop):
    
    @http.route('/shop/compare/', type='http', auth="public", website=True)
    def product_compare(self, **post):
        values = {}
        product_ids = [int(i) for i in post.get('products', '').split(',') if i.isdigit()]
        if not product_ids:
            return request.redirect("/shop")
        # use search to check read access on each record/ids
        products = request.env['product.product'].search([('id', 'in', product_ids)])
        values['products'] = products.with_context(display_default_code=False)

        res = {}
        for num, product in enumerate(products):
            for var in product.attribute_line_ids:
                cat_name = var.attribute_id.category_id.name or _('Uncategorized')
                att_name = var.attribute_id.name
                if not product.attribute_value_ids: # create_variant = False
                    continue
                res.setdefault(cat_name, {}).setdefault(att_name, [' - '] * len(products))
                val = product.attribute_value_ids.filtered(lambda x: x.attribute_id == var.attribute_id)
                if val:
                    res[cat_name][att_name][num] = val[0].name
                    values['specs'] = res
                    
        values['compute_currency'] = self._get_compute_currency_and_context()[0]
        return request.render("website_sale_comparison.product_compare", values)