'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var UserSchema = new Schema({
	phoneNumber:{
		unique: true,
		type:String
	},
	areaCode: String,
	verifyCode: String,
	accessToken: String,
	nickname: String,
	verified: false,
	gender: String,
	breed: String,
	age: String,
	avatar: String,
	meta:{
		createAt:{
			type:Date,
			default: Date.now()
		},
		updateAt:{
			type:Date,
			default: Date.now()
		}
	}
})

UserSchema.pre('save',function(next){
	if(this.isNew){
		this.meta.createAt = this.meta.updateAt = Date.now()
	}else{
		this.meta.updateAt = Date.now()
	}

	next() //这个pre相当于同一路径下的一个中间件。所以需要调用next方法去执行，下一步
})

module.exports = mongoose.model('User', UserSchema)