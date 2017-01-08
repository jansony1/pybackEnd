'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId
var Mixed = Schema.Types.Mixed


var VideoSchema = new Schema({
	author:{
		type: ObjectId, //用ObjectId去引用User表
		ref: 'User'
	},
	//七牛图床相关的地址
	qiniu_key: String, //初始上传视频地址
	persistentId: String, //转码阶段视频地址
	qiniu_final_key:String,	//转码完毕后视频地址

	//cloudinary图床相关地址
	public_id: String,
	//cloudinary返回后的混合数据
	detail: Mixed,

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

VideoSchema.pre('save',function(next){
	if(this.isNew){
		this.meta.createAt = this.meta.updateAt = Date.now()
	}else{
		this.meta.updateAt = Date.now()
	}

	next() //这个pre相当于同一路径下的一个中间件。所以需要调用next方法去执行，下一步
})

module.exports = mongoose.model('Video', VideoSchema)