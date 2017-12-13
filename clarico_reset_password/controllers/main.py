from odoo.http import request, route
from odoo.addons.portal.controllers.portal import CustomerPortal
 
class my_details(CustomerPortal):
     
    @route(['/my/account'], type='http', auth='user', website=True)
    def account(self, redirect=None, **post):
        values = self._prepare_portal_layout_values()
        partner = request.env.user.partner_id
        values.update({
            'error': {},
            'error_message': [],
        })
 
        if post:
            reset_password_fields=['old_pwd','new_password','confirm_pwd']
            reset_password_fields_vals = {}
              
            for index in reset_password_fields:
                if index in post:
                    reset_password_fields_vals.update({index: post.get(index,0)})
                    post.pop(index)
              
            error, error_message = self.details_form_validate(post)
              
            if reset_password_fields_vals:
                old_password=reset_password_fields_vals.get('old_pwd',None)
                new_password=reset_password_fields_vals.get('new_password',None)
                confirm_password=reset_password_fields_vals.get('confirm_pwd',None)    
             
            if old_password or new_password or confirm_password:
                # Validation
                for field_name in reset_password_fields:
                    if not reset_password_fields_vals.get(field_name):
                        error[field_name] = 'missing'
                          
                # error message for empty required fields
                if [err for err in list(error.values()) if err == 'missing']:
                    if 'Some required fields are empty.' not in error_message:
                        error_message.append('Some required fields are empty.')
                 
                # error message for compare a old_password and new_password
                if new_password != confirm_password:
                    error['new_password']= 'error'
                    error['confirm_pwd']= 'error'
                    error_message.append('The new password and its confirmation must be identical.')
                elif not error:    
                    try:
                        if request.env['res.users'].change_password(old_password, new_password.strip()):
                            print("password change")
                    except Exception:
                        #error message for old_password wrong
                        error['old_pwd']= 'error'
                        error_message.append('The old password you provided is incorrect, your password was not changed.')
                         
            values.update({'error': error, 'error_message': error_message})
            values.update(post)
            if not error:
                values = {key: post[key] for key in self.MANDATORY_BILLING_FIELDS}
                values.update({key: post[key] for key in self.OPTIONAL_BILLING_FIELDS if key in post})
                values.update({'zip': values.pop('zipcode', '')})
                partner.sudo().write(values)
                if redirect:
                    return request.redirect(redirect)
                return request.redirect('/my/home')
 
        countries = request.env['res.country'].sudo().search([])
        states = request.env['res.country.state'].sudo().search([])
 
        values.update({
            'partner': partner,
            'countries': countries,
            'states': states,
            'has_check_vat': hasattr(request.env['res.partner'], 'check_vat'),
            'redirect': redirect,
            'page_name': 'my_details',
        })
 
        response = request.render("portal.portal_my_details", values)
        response.headers['X-Frame-Options'] = 'DENY'
        return response
