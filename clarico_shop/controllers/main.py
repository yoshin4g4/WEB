import odoo
from odoo import http
from odoo.http import request
import json
from odoo.addons.base.ir.ir_qweb.fields import nl2br
from odoo.addons.http_routing.models.ir_http import slug
from odoo.addons.website.controllers.main import QueryURL
from odoo.exceptions import ValidationError
from odoo.addons.website_form.controllers.main import WebsiteForm
from operator import pos

PPG = 20  # Products Per Page
PPR = 4   # Products Per Row

class TableCompute(object):

    def __init__(self):
        self.table = {}

    def _check_place(self, posx, posy, sizex, sizey):
        res = True
        for y in range(sizey):
            for x in range(sizex):
                if posx + x >= PPR:
                    res = False
                    break
                row = self.table.setdefault(posy + y, {})
                if row.setdefault(posx + x) is not None:
                    res = False
                    break
            for x in range(PPR):
                self.table[posy + y].setdefault(x, None)
        return res

    def process(self, products, ppg=PPG):
        # Compute products positions on the grid
        minpos = 0
        index = 0
        maxy = 0
        x = 0
        for p in products:
            x = min(max(p.website_size_x, 1), PPR)
            y = min(max(p.website_size_y, 1), PPR)
            if index >= ppg:
                x = y = 1

            pos = minpos
            while not self._check_place(pos % PPR, pos // PPR, x, y):
                pos += 1
            # if 21st products (index 20) and the last line is full (PPR products in it), break
            # (pos + 1.0) / PPR is the line where the product would be inserted
            # maxy is the number of existing lines
            # + 1.0 is because pos begins at 0, thus pos 20 is actually the 21st block
            # and to force python to not round the division operation
            if index >= ppg and ((pos + 1.0) // PPR) > maxy:
                break

            if x == 1 and y == 1:   # simple heuristic for CPU optimization
                minpos = pos // PPR

            for y2 in range(y):
                for x2 in range(x):
                    self.table[(pos // PPR) + y2][(pos % PPR) + x2] = False
            self.table[pos // PPR][pos % PPR] = {
                'product': p, 'x': x, 'y': y,
                'class': " ".join(x.html_class for x in p.website_style_ids if x.html_class)
            }
            if index <= ppg:
                maxy = max(maxy, y + (pos // PPR))
            index += 1

        # Format table according to HTML needs
        rows = sorted(self.table.items())
        rows = [r[1] for r in rows]
        for col in range(len(rows)):
            cols = sorted(rows[col].items())
            x += len(cols)
            rows[col] = [r[1] for r in cols if r[1]]

        return rows

        # TODO keep with input type hidden


class WebsiteSaleForm(WebsiteForm):

    @http.route('/website_form/shop.sale.order', type='http', auth="public", methods=['POST'], website=True)
    def website_form_saleorder(self, **kwargs):
        model_record = request.env.ref('sale.model_sale_order')
        try:
            data = self.extract_data(model_record, kwargs)
        except ValidationError as e:
            return json.dumps({'error_fields': e.args[0]})

        order = request.website.sale_get_order()
        if data['record']:
            order.write(data['record'])

        if data['custom']:
            values = {
                'body': nl2br(data['custom']),
                'model': 'sale.order',
                'message_type': 'comment',
                'no_auto_thread': False,
                'res_id': order.id,
            }
            request.env['mail.message'].sudo().create(values)

        if data['attachments']:
            self.insert_attachment(model_record, order.id, data['attachments'])

        return json.dumps({'id': order.id})

class claricoShop(http.Controller):
    
    def _get_compute_currency_and_context(self):
        pricelist_context = dict(request.env.context)
        pricelist = False
        if not pricelist_context.get('pricelist'):
            pricelist = request.website.get_current_pricelist()
            pricelist_context['pricelist'] = pricelist.id
        else:
            pricelist = request.env['product.pricelist'].browse(pricelist_context['pricelist'])
 
        from_currency = request.env.user.company_id.currency_id
        to_currency = pricelist.currency_id
        compute_currency = lambda price: from_currency.compute(price, to_currency)
 
        return compute_currency, pricelist_context, pricelist
    
    def get_attribute_value_ids(self, product):
        product = product.with_context(quantity=1)

        visible_attrs_ids = product.attribute_line_ids.filtered(lambda l: len(l.value_ids) > 1).mapped('attribute_id').ids
        to_currency = request.website.get_current_pricelist().currency_id
        attribute_value_ids = []
        for variant in product.product_variant_ids:
            if to_currency != product.currency_id:
                price = variant.currency_id.compute(variant.website_public_price, to_currency)
            else:
                price = variant.website_public_price
            visible_attribute_ids = [v.id for v in variant.attribute_value_ids if v.attribute_id.id in visible_attrs_ids]
            attribute_value_ids.append([variant.id, visible_attribute_ids, variant.website_price, price])
        return attribute_value_ids

    def _get_search_order(self, post):
        return 'website_published desc,%s , id desc' % post.get('order', 'website_sequence desc')

    def _get_search_domain(self, search, category, attrib_values, price_vals = {}):
        domain = request.website.sale_product_domain()
        if search:
            for srch in search.split(" "):
                domain += [
                    '|', '|', '|','|', ('name', 'ilike', srch), ('description', 'ilike', srch),
                    ('description_sale', 'ilike', srch), ('product_variant_ids.default_code', 'ilike', srch),
                    ('brand_ept_id.name','ilike', srch)]
 
        if category:
            domain += [('public_categ_ids', 'child_of', int(category))]
 
        if price_vals :
            domain += [('list_price','>=',price_vals.get('min_val')),('list_price','<=',price_vals.get('max_val'))]
        
        if attrib_values:
            attrib = None
            ids = []
            for value in attrib_values:
                if value[0] == 0 :
                    ids.append(value[1])
                    domain += [('brand_ept_id.id', 'in', ids)]
                elif not attrib:
                    attrib = value[0]
                    ids.append(value[1])
                elif value[0] == attrib:
                    ids.append(value[1])
                else:
                    domain += [('attribute_line_ids.value_ids', 'in', ids)]
                    attrib = value[0]
                    ids = [value[1]]
            if attrib:
                domain += [('attribute_line_ids.value_ids', 'in', ids)]   
        return domain

    @http.route([
        '/shop',
        '/shop/page/<int:page>',
        '/shop/category/<model("product.public.category"):category>',
        '/shop/category/<model("product.public.category"):category>/page/<int:page>'
    ], type='http', auth="public", website=True)
    def shop(self, page=0, category=None, search='', ppg=False, **post):
        
        if 'ppg' in request.httprequest.args:
            ppg = request.httprequest.args['ppg']
        if ppg:
            try:
                ppg = int(ppg)
            except ValueError:
                ppg = PPG
            post["ppg"] = ppg
        else:
            ppg = PPG

        
        attrib_list = request.httprequest.args.getlist('attrib')
        attrib_values = [[int(x) for x in v.split("-")] for v in attrib_list if v]
        attributes_ids = {v[0] for v in attrib_values}
        attrib_set = {v[1] for v in attrib_values}
        
        
        request.cr.execute( 'select min(list_price),max(list_price) from product_template where sale_ok=True and active=True and website_published=True')
        min_max_vals = request.cr.fetchall()
        min_val = min_max_vals[0][0] or 0
        if int(min_val) == 0:
            min_val = 1
        max_val = min_max_vals[0][1] or 1
                   
        product_price_search_vals = {}
        attrib_price=post.get("attrib_price",'%s-%s'%(min_val,max_val))
        product_price_search_vals.update({'min_val':attrib_price.split("-")[0],'max_val':attrib_price.split("-")[1]})       
        domain = self._get_search_domain(search, category,  attrib_values , product_price_search_vals)
        
        min_max_price='%s-%s'%(min_val,max_val)
        if attrib_price == min_max_price:
            attrib_price=""
     #       del post["attrib_price"]
        

        keep = QueryURL('/shop', category=category and int(category), search=search, attrib=attrib_list, order=post.get('order'))
        compute_currency, pricelist_context, pricelist = self._get_compute_currency_and_context()

        request.context = dict(request.context, pricelist=pricelist.id, partner=request.env.user.partner_id)

        url = "/shop"
        if search:
            post["search"] = search
        if category:
            category = request.env['product.public.category'].browse(int(category))
            url = "/shop/category/%s" % slug(category)
        if attrib_list:
            post['attrib'] = attrib_list

        categs = request.env['product.public.category'].search([('parent_id', '=', False)])
        Product = request.env['product.template']

        parent_category_ids = []
        if category:
            parent_category_ids = [category.id]
            current_category = category
            while current_category.parent_id:
                parent_category_ids.append(current_category.parent_id.id)
                current_category = current_category.parent_id

        product_count = Product.search_count(domain)
        pager = request.website.pager(url=url, total=product_count, page=page, step=ppg, scope=7, url_args=post)
        products = Product.search(domain, limit=ppg, offset=pager['offset'], order=self._get_search_order(post))
        products_count = Product.search_count(domain)

        ProductAttribute = request.env['product.attribute']
        if products:
            attributes = ProductAttribute.search([('attribute_line_ids.product_tmpl_id', 'in', products.ids)])
        else:
            attributes = ProductAttribute.browse(attributes_ids)

        values = {
            'search': search,
            'category': category,
            'attrib_values': attrib_values,
            'attrib_set': attrib_set,
            'pager': pager,
            'pricelist': pricelist,
            'products': products,
            'search_count': product_count, 
            'bins': TableCompute().process(products, ppg),
            'rows': PPR,
            'categories': categs,
            'attributes': attributes,
            'compute_currency': compute_currency,
            'keep': keep,
            'parent_category_ids': parent_category_ids,
            'products_count':products_count,
            
        }
        if category:
            values['main_object'] = category
        return request.render("website_sale.products", values)


class getProduct(http.Controller):
    @http.route(['/productdata'], type='json', auth="public", website=True)    
    def fetchProduct(self,product_id=None, **kwargs):
        if product_id :
            product_record = request.env['product.template'].search([['id','=',product_id]])
            
            values={
                'product':product_record,
            }
            response = http.Response(template="clarico_shop.fetch-record",qcontext=values)            
        return response.render()
        
class clricoShopLogin(http.Controller):   
    @http.route(['/shoplogin'], type='json', auth="public", website=True)    
    def wlist(self,product_id=None, **kwargs):
        if request.env.user.id:
            user_id = request.env['website'].search_count([['user_id.id','=',request.env.user.id]])
            if not user_id:
                return {'user':False};
        return {'user':True};


