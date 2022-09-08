var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelpers.getAllProducts().then((products)=>{
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

router.get('/delete-product/:id',(req,res)=>{

  let prodId = req.params.id
  console.log("prodId",prodId);

  productHelpers.deleteProduct(prodId).then((response)=>{
    console.log("response ",response)
    res.redirect('/admin/')
  })
})
router.get('/edit-product/:id',async(req,res)=>{

  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',async(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/')
    if(req.files.Image){
      let image = req.files.Image
      image.mv('./public/product-images/'+ req.params.id+'.jpg')
    }
  })
})


router.get('/login', function(req, res) {

});


module.exports = router;
