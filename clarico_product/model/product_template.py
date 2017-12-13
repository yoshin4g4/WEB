from odoo import fields, models

class product_template(models.Model):
    _inherit = "product.template"
    
    pif_video = fields.Boolean(string='Product Video Available?')
    p_video_url = fields.Char(string='YouTube Url')
    product_sort_description = fields.Text('Short Description')
