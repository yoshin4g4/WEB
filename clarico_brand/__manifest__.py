{
    # Theme information
    'name' : 'Clarico Brand',
    'category' : 'Website',
    'version' : '1.0',
    'summary': 'Filter Products By Brand at Category Page',
    'description': """""",

    # Dependencies
    'depends': [
        'clarico_shop'
    ],

    # Views
    'data': [
        'security/ir.model.access.csv',  
        'template/template.xml',
        'view/product_template_brand.xml',
        'view/brand.xml',
    ],

    # Author
    'author': 'Emipro Technologies Pvt. Ltd.',
    'website': 'http://www.emiprotechnologies.com',

    # Technical
    'installable': True,
}
