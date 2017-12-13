# -*- coding: utf-8 -*-
from odoo import api, fields, models
 
class product_public_category(models.Model):
    _inherit = ["product.public.category"]
     
    website_published = fields.Boolean("Website Published",default=True)
    
    

