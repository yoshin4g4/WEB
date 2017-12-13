{
    # Theme information
    'name' : 'Clarico Product Multi Carousel',
    'category' : 'Website',
    'version' : '1.0',
    'summary': 'Website Product Carousel',
    'description': """""",

    # Dependencies
    'depends': [
        'clarico_product_carousel',
    ],

    # Views
    'data': [
        'security/ir.model.access.csv',     
        'templates/assets.xml',
        'templates/product_static_carousel.xml',
        'templates/product_static_carousel_option.xml',
        'views/website_multi_filter_ept_view.xml',
    ],

    # Author
    'author': 'Emipro Technologies Pvt. Ltd.',
    'website': 'http://www.emiprotechnologies.com',

    # Technical
    'installable': True,
}
