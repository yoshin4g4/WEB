{
    # Theme information
    'name' : 'Clarico Base',
    'category' : 'Website',
    'version' : '1.0',
    'summary': 'Contains Common Design Styles for Theme Clarico',
    'description': """""",

    # Dependencies
    'depends': [
        'website_sale','website_blog', 'auth_signup',
    ],

    # Views
    'data': [
        'template/assets.xml',
    ],

    # Author
    'author': 'Emipro Technologies Pvt. Ltd.',
    'website': 'http://www.emiprotechnologies.com',

    # Technical
    'installable': True,
    'application': False,
}
