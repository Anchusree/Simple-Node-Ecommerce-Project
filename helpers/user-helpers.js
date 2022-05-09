const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')

module.exports = {
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
        userData.Password = await bcrypt.hash(userData.Password,10)
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
            console.log(data);
            resolve(data)
        })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus= false;
            let response={}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
               bcrypt.compare(userData.Password, user.Password).then((status)=>{
                if(status){
                    console.log('Login Sucess');
                    response.user = user
                    response.status = true
                    resolve(response)
                }
                else{
                    console.log("Login failed");
                    resolve({status:false})
                }
               })
            }
            else{
                console.log("Login Failed");
            }
        })
    },
    addToCart:(prodId,userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:ObjectId(userId)})
            if(userCart){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:ObjectId(userId)},
                {
                    $push:{products:ObjectId(prodId)}   
                })
                .then((response)=>{
                    resolve(response)
                })
            }else{
                let cartobj = {
                    user:ObjectId(userId),
                    products:[ObjectId(prodId)]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj).then((response)=>{
                    resolve(response)
                })
            }
        
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let cartItems = await db.get().collection(collection.CART_COLLECTION)
            .aggregate([
                {
                $match:{user:ObjectId(userId)}
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        let:{prodList:'$products'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id',["$$prodList"]]
                                    }
                                }
                            }
                        ],
                        as:'cartItems'
                    }
                }
        ]).toArray()
        console.log("cartItems ",cartItems)
        resolve(cartItems[0].cartItems)
        })
    }
}