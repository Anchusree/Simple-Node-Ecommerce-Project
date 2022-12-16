const db = require('../config/connection')
const collection = require('../config/collections')
const bcrypt = require('bcrypt')
// const { ObjectId } = require('mongodb')
// const Razorpay = require('razorpay')
// const crypto = require('crypto');


module.exports = {
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email, Role:"admin" })
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {
                    if (status) {
                        console.log('Login Sucess');
                        response.admin = user
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
    getAllUsers:(admindata)=>{
        //console.log('admindata',admindata)
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collection.USER_COLLECTION).find({Role:"user"})
            .toArray()
            resolve(users)
        })
    },
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({})
            .toArray()
            resolve(orders)
        })
    },
    addCategory:(category,callback)=>{
        db.get().collection('category').insertOne(category).then((data)=>{
           console.log("data: ",data);
           callback(data)
        })
    },

    getAllCategory:()=>{
        return new Promise(async(resolve,reject)=>{
            let category = await db.get().collection(collection.PRODUCT_COLLECTION).find()
            .toArray()
            resolve(category)
        })
    },
    deleteCategory:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({_id:objectId(prodId)})
            .then((response)=>{
                console.log(response)
                resolve(response)
            })
            
        }) 
    },
    getCategoryDetails:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catId)})
            .then((response)=>{
                console.log(response)
                resolve(response)
            })
        })
    },
    updatecategory:(catId,categoryDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).updateOne({_id:objectId(catId)},{
                $set:{
                    Name:categoryDetails.Name,
                    Description:categoryDetails.Description
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    }
    
}