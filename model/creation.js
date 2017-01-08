'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId
var Mixed = Schema.Types.Mixed


var CreationSchema = new Schema({
	author:{
		type: ObjectId, //用ObjectId去引用User表
		ref: 'User'
	},
	video:{
		type: ObjectId,
		ref: 'Video'
	},
	audio:{
		type: ObjectId,
		ref: 'Audio'
	},

	title: String,
	//cloudinary图床相关地址
	cloudinary_thumb: String,
	cloudinary_video: String,
	
	//cloudinary返回的数据
	detail: Mixed,
	//qiniu图床存储视频的地址
	qiniu_video: String,
	qiniu_thumb: String,

	votes: [],

	finish: {  //判断上传进度
	    type: Number,
	    default: 0
	},
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

CreationSchema.pre('save',function(next){
	if(this.isNew){
		this.meta.createAt = this.meta.updateAt = Date.now()
	}else{
		this.meta.updateAt = Date.now()
	}

	next() //这个pre相当于同一路径下的一个中间件。所以需要调用next方法去执行，下一步
})

module.exports = mongoose.model('Creation', CreationSchema)