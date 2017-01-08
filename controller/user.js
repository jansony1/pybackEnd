'use strict'

var mongoose = require('mongoose')
var User = mongoose.model('User')
var xss = require('xss')
var uuid = require('uuid')
var Sms = require('../util/sms')



exports.signup = function *(next){

	var phoneNumber = xss(this.request.body.phoneNumber.trim())

	var user = yield User.findOne({
		phoneNumber: phoneNumber
	}).exec()

	console.log('signup.user:'+user)

	if(!user){

		var verifyCode = Sms.getCode()

		console.log('verifyCode:'+ verifyCode)
		console.log('phoneNumber:'+ phoneNumber)


		var accessToken = uuid.v4() //生成4段的token值

		user = new User({
			nickname: 'kimmy',
			avatar:'http://dummyimage.com/64x64/6ee1b0)',
			phoneNumber: xss(phoneNumber),
			accessToken: accessToken,
			verifyCode: verifyCode
		})
		var msg = '您的注册验证注册吗是'+ verifyCode


		try {
			console.log(user)
			user = yield user.save()
		}
		catch(e){
			console.log(e)
			this.body = {
				success: false,
				err: '短信服务异常'
			}

			return next
		}

		//发送短信要钱，我们就不发送了，直接从命令行里面调出verifycode 和 phonenumber
		//sms.send(phoneNumber,msg) 、

		this.body = {
				success: true
		}
	}
	else{ //如果用户已经存在就不玩了
		this.body = {
			success: false,
			msg: '该手机号已存在'
		}

		return next
	}

	
}



exports.verify = function *(next){
	
	var phoneNumber = this.request.body.phoneNumber
	var verifyCode = this.request.body.verifyCode



	if(!verifyCode || !phoneNumber){
		this.body = {
			success: false,
			err: '验证没通过'
		}
		return next
	}
	var user = yield User.findOne({
		verifyCode: verifyCode,
		phoneNumber: phoneNumber
	}).exec()

	if(user){
		user.verified = true

		user = yield user.save()

		console.log("user:"+ user)
		this.body = {
			success: true,
			data:{
				nickname: user.nickname,
				accessToken: user.accessToken,
				avatar: user.avatar,
				_id: user._id,
			}
		}
	}else{
		this.body = {
			success: false,
			err: '验证未通过',
		}

	}

}

exports.update = function *(next){
	var body = this.request.body

	var user = this.session.user
	
	console.log('update.user:'+ user)

	var fields = 'avatar,gender,age,nickname,breed'.split(',')

	fields.forEach(function(field){
		if(body[field]){
			user[field] = xss(body[field].trim())
		}
	})

	user = yield user.save()

	this.body = {
		success: true,
		data:{
				nickname: user.nickname,
				accessToken: user.accessToken,
				avatar: user.avatar,
				age: user.age,
				breed: user.breed,
				gender: user.gender,
				_id: user._id

			}
	}

}