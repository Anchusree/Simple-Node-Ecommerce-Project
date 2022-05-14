const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

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
                //console.log("prodExist",prodExist);
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

            } else {
                let cartobj = {
                    user: ObjectId(userId),
                    products: [prodObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response) => {
                    resolve(response)
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
            resolve(total[0].total)
        })
    }
}