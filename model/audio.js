'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId
var Mixed = Schema.Types.Mixed


var AudioSchema = new Schema({
	author:{
		type: ObjectId, //用ObjectId去引用User表
		ref: 'User'
	},
	video:{
		type: ObjectId,
		ref: 'Video'
	},

	//cloudinary图床相关地址
	public_id: String,
	//cloudinary返回的数据
	detail: Mixed,
	//qiniu图床存储视频的地址
	qiniu_video: String,
	qiniu_thumb: String,
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

AudioSchema.pre('save',function(next){
	if(this.isNew){
		this.meta.createAt = this.meta.updateAt = Date.now()
	}else{
		this.meta.updateAt = Date.now()
	}

	next() //这个pre相当于同一路径下的一个中间件。所以需要调用next方法去执行，下一步
})

module.exports = mongoose.model('Audio', AudioSchema)