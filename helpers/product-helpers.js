const db = require('../config/connection')
const collection = require('../config/collections')
const objectId = require('mongodb').ObjectId

module.exports ={

    addProduct:(product,callback)=>{
        //console.log(product);
        db.get().collection('product').insertOne(product).then((data)=>{
           console.log("data: ",data);
           callback(data)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find()
            .toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:objectId(prodId)})
            .then((response)=>{
                console.log(response)
                resolve(response)
            })
            
        }) 
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)})
            .then((response)=>{
                resolve(response)
            })
        })
    },
    updateProduct:(prodId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(prodId)},{
                $set:{
                    Name:productDetails.Name,
                    Category:productDetails.Category,
                    Price:productDetails.Price,
                    Description:productDetails.Description
                }
            }).then((response)=>{
                resolve(response)
            })
        })
    }
}