var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const userHelpers = require('../helpers/user-helpers')


const verifyLogin = (req,res,next)=>{

  if(req.session.loggedIn){
  next()
  }
  else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user
  console.log('user',user)

  let cartCount = null
  if(user && user._id){
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }

  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products', { products,user,cartCount});
  })
});

router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }
  else{
    res.render('user/login',{"loginErr":req.session.loginError})
    req.session.loginError = false
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response);
    req.session.loggedIn = true
    req.session.user = response
    res.redirect('/login')
  })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body)
  .then((response)=>{
    if(response.status){
      req.session.loggedIn = true
      req.session.user = response.user
      res.redirect('/')
    }
    else{
      req.session.loginError = "Invalid Username/Password"
      res.redirect('/login')
    }
  })
})
router.get('/logout',(req,res)=>{
 req.session.destroy()
 res.redirect('/')
})

router.get('/cart',verifyLogin,async (req, res)=> {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  //console.log(products);
  let total = await userHelpers.getTotalAmount(req.session.user._id)

  res.render('user/cart',{products,'user':req.session.user,total})
});

router.get('/add-to-cart/:id',(req, res)=> {
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  
    res.redirect('/')
 })
})

router.post('/change-product-quantity',(req,res,next)=>{
  //console.log("hey ",req.body);
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
  response.total = await userHelpers.getTotalAmount(req.body.userId)

    res.json(response)
  })
})
router.get('/place-order',verifyLogin,async(req,res)=>{

  let total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
})


router.post('/place-order',verifyLogin,async(req,res)=>{
  let products = await userHelpers.getCartProductList(req.body.userId);
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
 userHelpers.placeOrder(req.body,products,totalPrice).then((response)=>{
  res.json({status:true})
 })
})

router.get('/order-success',verifyLogin,async(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})

router.get('/order-history',verifyLogin,async(req,res)=>{
  let orders = await userHelpers.getOrderHistory(req.session.user._id)
  console.log(orders)
  res.render('user/order-history',{user:req.session.user,orders})
})


router.get('/view-order-products/:id',verifyLogin,async(req,res)=>{
  
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/order-success',{user:req.session.user,products})
})

module.exports = router;
