from openerp import models, fields, api

class filter_ept(models.Model):
    _name="filter.ept"    
    
    fid=fields.Integer("FID")
    fname=fields.Char("Filter name")
    filter_ept_id=fields.Many2one("website.filter.ept",required=True,ondelete='cascade')