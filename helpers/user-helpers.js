const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const Razorpay = require('razorpay')
const crypto = require('crypto');

// let instance = new Razorpay({
//     key_id: 'key_secret',
//     key_secret: 'NSBTa97tI46hOCR33hVTe9Hm',
//   });

let instance = new Razorpay({ key_id: 'rzp_test_7DBoD0gGYOAuPO', key_secret: 'P2m2OzacYsTZ3ynGMCQbkMgN' })


module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.Password = await bcrypt.hash(userData.Password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                console.log(data);
                resolve(data)
            })
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('Login Sucess');
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log("Login failed");
                        resolve({ status: false })
                    }
                })
            }
            else {
                console.log("Login Failed");
            }
        })
    },
    addToCart: (prodId, userId) => {
        let prodObj = {
            item: ObjectId(prodId),
            quantity: 1
        }

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let prodExist = userCart.products.findIndex(product => product.item == prodId);
                console.log("prodExist",prodExist);
                if (prodExist != -1) {//product not exist
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:ObjectId(userId),
                        "products.item": ObjectId(prodId)
                    },
                        {
                            $inc: { "products.$.quantity": 1 }//increment by 1
                        }

                    ).then(() => {
                        resolve()
                    })
                }
                else {

                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: prodObj }
                        })
                        .then((response) => {
                            resolve(response)
                        })
                }

            } 
            else {
                let cartobj = {
                    user: ObjectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response) => {
                    console.log("response3", response.insertedId)
                    resolve(response.insertedId)
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
               
                // {
                //     $lookup:
                //     {
                //         from: collection.PRODUCT_COLLECTION,
                //         let: { prodList: "$products" },
                //         pipeline: [{
                //             $match: {
                //                 $expr: { $in: ["$_id", "$$prodList"] }
                //             }
                //         }],
                //         as: "cartItems"
                //     }
                // }
            ]).toArray()
             console.log("cartItems ",cartItems)
            resolve(cartItems)
        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
                console.log(count);
            }
            resolve(count)

        })

    },
    changeProductQuantity:(details)=>{
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        //console.log(cartId,prodId,count);
        return new Promise(async (resolve, reject) => {
            if(details.count == -1 && details.quantity == 1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne(
                    {_id:ObjectId(details.cart)},
                    {
                        $pull:{products:{item:ObjectId(details.product
                            
                            )}}
                    }
                ).then((response)=>{
                        resolve({removeProduct:true})
                })
            }
            else{
                db.get().collection(collection.CART_COLLECTION)
                .updateOne(
                    {_id:ObjectId(details.cart),
                    "products.item": ObjectId(details.product)
                    },
                    {
                        $inc: { "products.$.quantity": details.count }//increment by 1
                    }
                ).then((response) => {
                    console.log("response",response);
                    resolve({status:true})
                })
            }
           
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply: ['$quantity', {$toInt: '$product.Price'}]}}
                    }
                }
            ]).toArray()
             console.log("total ",total)
            resolve( total.length > 0 ? total[0].total : 0)
        })
    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
           //console.log(order,products,total)
           let status = order.paymentmethod ==='COD' ? 'placed' : 'pending' 
           let orderObj ={
               deliveryDetails:{
                   mobile:order.Mobile,
                   address:order.Address,
                   pincode:order.Pincode
               },
               userId:ObjectId(order.userId),
               paymentmethod:order.paymentmethod,
               products:products,
               status:status,
               total:total,
               date:new Date()
           }
           db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
               db.get().collection(collection.CART_COLLECTION).deleteOne({user:ObjectId(order.userId)})
           console.log("response:::::",response.insertedId)
               resolve(response.insertedId)
           })
          
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            console.log(cart)
            resolve(cart.products)
        })
    },
    getOrderHistory:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
            .find({userId:ObjectId(userId)}).toArray()
            console.log(orders)
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
             console.log("cartItems ",orderItems)
            resolve(orderItems)
        })
    },
    generateRazonpay:(orderId,totalPrice)=>{
        return new Promise((resolve,reject)=>{
           //const Razorpay = require('razorpay');
           // var instance = new Razorpay({ key_id: 'YOUR_KEY_ID', key_secret: 'YOUR_SECRET' })

           console.log(orderId,totalPrice)
           
                instance.orders.create({
                amount: totalPrice*100,//amount in smallest currency unit
                currency: "INR",
                receipt: orderId.toString(),
                notes: {
                    key1: "value3",
                    key2: "value2"
                }
                },(err,order)=>{
                    if(err){
                        console.log(err)
                    }
                    else{
                        console.log("New Order",order);
                        resolve(order)
                    }
                    
                })
          
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
           
            var hmac = crypto.createHmac('sha256','P2m2OzacYsTZ3ynGMCQbkMgN');
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac == details['payment[razorpay_signature]']){
                resolve()
            }
            else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }).then(()=>{
                resolve()
            })
        })
    }
}