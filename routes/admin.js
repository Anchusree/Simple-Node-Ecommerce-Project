var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers')
const adminHelpers = require('../helpers/admin-helpers')

const verifyLogin = (req, res, next) => {
  if (req.session.admin && req.session.adminLoggedIn) {
    next();
  }
  else {
    res.redirect('/adminlogin')
  }
}

router.get('/', (req, res) => {
  let admin = req.session.admin
  if (admin) {
    // res.render('admin/view-products', admin);
    res.render('admin/dashboard');
  }
  else {
    res.render('admin/login', admin);
  }
})

/* GET users listing. */
router.get('/products', verifyLogin, function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render('admin/view-products', { admin: true, products, index: 0 })
  })
});

router.get('/add-product', verifyLogin, (req, res) => {
  res.render('admin/add-product')
})
router.post('/add-product', verifyLogin, (req, res) => {
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image;
    console.log("results ", id);
    image.mv('./public/product-images/' + id.insertedId + '.jpg', (err, done) => {

      if (!err) {
        res.render('admin/add-product')
      }
      else {
        console.log("Something went wrong", err);
      }
    })

  })
})

router.get('/delete-product/:id', verifyLogin, (req, res) => {

  let prodId = req.params.id

  productHelpers.deleteProduct(prodId).then((response) => {
    console.log("response ", response)
    res.redirect('/admin/')
  })
})
router.get('/edit-product/:id', verifyLogin, async (req, res) => {

  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product', { product })
})

router.post('/edit-product/:id', verifyLogin, async (req, res) => {
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin/')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + req.params.id + '.jpg')
    }
  })
})
router.get('/adminlogin', (req, res) => {
  if (req.session.admin) {
    // res.redirect('/admin/products')
    res.redirect('/admin/dashboard')
  }
  else {
    res.render('admin/login', { "loginErr": req.session.adminLoginError })
    req.session.adminLoginError = false
  }
})

router.post('/adminlogin', (req, res) => {
  adminHelpers.doLogin(req.body)
    .then((response) => {
      if (response.status) {
        req.session.admin = response.admin
        req.session.adminLoggedIn = true
        // res.redirect('/admin/products')
        res.render('admin/dashboard');
      }

      req.session.adminLoginError = "Invalid Username/Password"
      res.redirect('/admin/adminlogin')

    })
})

router.get('/logout',(req, res) => {
  //  req.session.destroy()
  req.session.admin = null
  req.session.adminLoggedIn = false
  res.redirect('/admin/')
})

router.get('/users',verifyLogin, (req, res) => {
  adminHelpers.getAllUsers(req.session.admin).then((users) => {
    res.render('admin/view-users', { admin: true, users, index: 0 })
  })
})

router.get('/dashboard',verifyLogin,(req,res)=>{
  let admin = req.session.admin
  res.render('admin/dashboard',admin);
})

router.get('/orders',verifyLogin,(req,res)=>{
  adminHelpers.getAllOrders(req.session.admin).then((orders) => {
    res.render('admin/view-order', { admin: true, orders, index: 0 })
  })
})

router.get('/add-category', verifyLogin, (req, res) => {
  res.render('admin/add-category')
})

router.post('/add-category', verifyLogin, (req, res) => {
  adminHelpers.addCategory(req.body, (id) => {
    let image = req.files.Image;
    console.log("results ", id);
    image.mv('./public/product-images/' + id.insertedId + '.jpg', (err, done) => {

      if (!err) {
        res.render('admin/add-category')
      }
      else {
        console.log("Something went wrong", err);
      }
    })

  })
})

router.get('/category', verifyLogin, function (req, res, next) {
  adminHelpers.getAllCategory().then((category) => {
    res.render('admin/view-category', { admin: true, category, index: 0 })
  })
});

router.get('/delete-category/:id', verifyLogin, (req, res) => {

  let prodId = req.params.id

  adminHelpers.deleteCategory(prodId).then((response) => {
    console.log("response ", response)
    res.redirect('/admin/')
  })
})
router.get('/edit-category/:id', verifyLogin, async (req, res) => {
  let category = await adminHelpers.getCategoryDetails(req.params.id)
  console.log("category",category)
  res.render('admin/edit-category', { category })
})

router.post('/edit-category/:id', verifyLogin, async (req, res) => {
  adminHelpers.updatecategory(req.params.id, req.body).then(() => {
    res.redirect('/admin/')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + req.params.id + '.jpg')
    }
  })
})

module.exports = router;
