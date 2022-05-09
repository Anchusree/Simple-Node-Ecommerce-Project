var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{

    console.log(products);
    res.render('admin/view-products',{admin:true,products})
  })

  //res.send('respond with a resource');
});

router.get('/add-product',(req,res)=>{
 res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
  productHelpers.addProduct(req.body,(id)=>{
    let image = req.files.Image;
    console.log("results ",id);
     image.mv('./public/product-images/'+ id.insertedId+'.jpg',(err,done)=>{

      if(!err){
        res.render('admin/add-product')
      }
      else{
        console.log("Something went wrong",err);
      }
    })

  })
})
module.exports = router;
