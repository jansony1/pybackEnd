'use strict'

var mongoose = require('mongoose')
var User = mongoose.model('User')
var robot = require('../util/robot')


exports.signature = function *(next){
	  var body = this.request.body

	  console.log('body'+JSON.stringify(body))
	  var cloud = body.cloud

	  var data
	  if(cloud == 'qiniu'){
		  data = robot.getQiNiuToken(body)

	  }else if (cloud =='cloudinary'){
		  data = robot.getCloudinaryToken(body)
	  }

	  this.body = {
			data:data,
			success: true
	}
}

exports.hasValidToken = function *(next){//验证token和token的合法性

	console.log('here is token')

	var accessTokenBODY = this.request.body.accessToken
	var accessTokenURL = this.request.query.accessToken

	if(!accessTokenURL && !accessTokenBODY){
	//存在性
		this.body = {
			success: false,
			err: 'token并没有'
		}

		return next
	}
	var accessToken = accessTokenBODY? accessTokenBODY: accessTokenURL
	//合法性

	var user = yield User.findOne({
		accessToken: accessToken
	}).exec()


	if(!user){
		this.body = {
			success: false,
			err: 'token不合法'
		}

		return next
	}

	this.session = this.session || {}
	this.session.user = user

	yield next

}

exports.hasBody = function * (next){
	console.log('here is boyd')
	var body = this.request.body || {}

	if(Object.keys(body).length === 0){
		this.body = {
			success: false,
			err: '大哥post没body，别搞我啊'
		}
		return next
	}

	yield next

}