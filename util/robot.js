'use strict'

//图床API
var qiniu = require('qiniu')
var cloudinary = require('cloudinary')
var Promise = require('bluebird')

var config = require('../config/config')
var sha1 = require('sha1')
var uuid = require('uuid')

qiniu.conf.ACCESS_KEY = config.qiniu.AK
qiniu.conf.SECRET_KEY = config.qiniu.SK

cloudinary.config(config.cloudinary)

var bucket = 'zhenyutest' //七牛上得存储空间
//key = 'test.png';  //保存的文件名

exports.asyncToQiniu= function(url,key){
	var client = new qiniu.rs.Client()

	return new Promise(function(resolve,reject){
		client.fetch(url,'zhenyutest',key,function(err,ret){  //第二个参数为bucket，七牛中的存储空间
			if(err){
				reject(err)
			}else{
				resolve(ret)
			}
		})
	})
}


exports.getQiNiuToken = function(body){

	  var putPolicy
	  var type = body.type 
	  var key
	  var options = {
	  	persistentNotifyUrl: config.notify, //类似于图片中的callback url，对于视频转码后存储的位置，文档中有介绍
	  	
	  }

	  if(type == 'image'){
	  	key = uuid.v4()+'.png'
	  	putPolicy = new qiniu.rs.PutPolicy(bucket+":"+key)

	  	//putPolicy.callbackUrl = 'http://your.domain.com/callback'   //七牛返还给服务器端的数据，用以后续处理
 		//putPolicy.callbackBody = 'filename=$(fname)&filesize=$(fsize)' //
	  }else if(type =='video'){
	  	key = uuid.v4()+'.mp4'
	  	options.scope = bucket+":"+key
	  	options.persistentOps = 'avthumb/mp4/an/1'
	  	putPolicy = new qiniu.rs.PutPolicy2(options)
	  }else if (type == 'audio'){
	  	//
	  	//key = uuid.v4()+ '.mp3'
	  }


	var token = putPolicy.token()

	console.log('token:'+token)
	
	return {
		key: key,
		token: token
	}

}



exports.uploadToCloudinary = function(url){
	return new Promise(function(resolve,reject){
		cloudinary.uploader.upload(url,function(result){

			console.log('result:'+JSON.stringify(result))
			if(result && result.public_id)
				resolve(result)
			else
				reject(result)	
		},{
			resource_type: 'video',
			folder: 'video',
		})


	}) 
}
exports.getCloudinaryToken = function(body){

	  var timestamp = body.timestamp
	  var type=body.type 
	  var folder 
	  var tags

	  if(type == 'image'){
	  	folder = 'avatar'
	  	tags = 'app.avatar'
	  }else if(type =='video'){

	  	folder = 'video'
	  	tags = 'app.video'
	  }else if (type == 'audio'){

	  	folder ='audio'
	  	tags = 'app.audio'
	  }

	  var key = uuid.v4()
	  var signature = 'folder='+folder+'&tags='+tags+'&timestamp='+timestamp+config.cloudinary.api_secret
	  console.log('signature:'+ signature)
	  signature = sha1(signature)	

	  return {
	  		signature: signature,
	  		key: key
	  }
	  	

}