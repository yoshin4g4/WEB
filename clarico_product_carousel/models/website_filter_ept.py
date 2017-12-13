from openerp import models, fields, api

class website_filter_ept(models.Model):
    _name="website.filter.ept"
    _rec_name="name"
    
    name=fields.Char("Filter Name")
    filter_id=fields.Many2one("ir.filters","Select Filter")
    website_published=fields.Boolean("Website Published")
   
