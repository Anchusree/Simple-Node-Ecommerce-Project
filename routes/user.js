var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {

  let products=[
    {
      name:"IPHONE 11",
      category:"Mobile",
      description:'This is a good phone',
      image:'https://assets.swappie.com/cdn-cgi/image/width=600,height=600,fit=contain,format=auto/swappie-iphone-11-pro-max-midnight-green.png'
    },
    {
      name:"Samsung Galaxy",
      category:"Mobile",
      description:'This is a nice phone',
      image:'https://image.oppo.com/content/dam/oppo/common/mkt/v2-2/a15/navigation/A15-navigation-black-v2.png.thumb.webp'
    },
    {
      name:"OPPO 10X",
      category:"Mobile",
      description:'This is a good phone',
      image:'https://image.oppo.com/content/dam/oppo/common/mkt/v2-2/reno6-pro-5g-oversea/navigation/Homepage-header2-artic-blue-427-x-600.png.thumb.webp'
    },
    {
      name:"One Plus 71",
      category:"Mobile",
      description:'This is a good phone',
      image:'https://fdn2.gsmarena.com/vv/bigpic/oneplus-8.jpg'
    },
  ]


  res.render('index', { products,admin:false });
});

module.exports = router;
