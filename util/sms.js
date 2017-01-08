'use strict'


//本接口实现
		   //1）生成短信验证码
		   //2）发送短信验证码的功能
var https =require('https')
var querystring = require('querystring')
var Promise = require('bluebird')
var speakeasy = require('speakeasy')

exports.getCode = function (){
	var code = speakeasy.totp({
		secret: 'zhenyu',
		digits: 4
	})

	return code
}

exports.send = function (phoneNumber, msg){
	return new Promise(function(resolve,reject){
		if(!phoneNumber){
			return reject (new Error('手机号不能为空'))
		}

		var postData = {
			mobile: phoneNumber,
			message:'验证码为：'+msg+'【振宇网络】'
		};

		var content = querystring.stringify(postData);

		var options = {
		    host:'sms-api.luosimao.com',
		    path:'/v1/send.json',
		    method:'POST',
		    auth:'api:key-12312389d10fe16c98896ced5a09945188', //这个key去网页里面看，现在还不是自己的
		    agent:false,
		    rejectUnauthorized : false,
		    headers:{
		    'Content-Type' : 'application/x-www-form-urlencoded',
		    'Content-Length' :content.length
		    }
		}

		var str = ''
		var req = https.request(options,function(res){
			if(res.statusCode ===404){
				reject(new Error('短信服务器没有响应'))

				return next
			}
		    res.setEncoding('utf8');
		    res.on('data', function (chunk) {
		    	str += chunk
		   	    console.log(JSON.parse(chunk));
		    });
		    res.on('end',function(){
		    	var data
		    	try {
		    		data = JSON.parse(str)
		    	}
		    	catch (e){
		    		reject(e)
		    	}
		    	if(data.error === 0){
		    		resolve(data)
		    	}
		    	else{
		    		var errorMap = {
		    			'-10':	'验证信息失败	检查api key是否正确，编码格式是否正确',
						'-20':	'短信余额不足	进入个人中心购买充值',
						'-30':	'短信内容为空	检查调用传入参数：message',
						'-31':	'短信内容存在敏感词	修改短信内容，更换词语',
						'-32':	'短信内容缺少签名信息	短信内容末尾增加签名信息，格式为：【公司名称】',
						'-40':	'错误的手机号	检查手机号是否正确',
						'-41':	'号码在黑名单中	号码因频繁发送或其他原因暂停发送，请,联系客服确认',
						'-42':	'验证码类短信发送频率过快	前台增加60秒获取限制',
						'-50':	'请求发送IP不在白名单内	查看触发短信IP白名单的设',
		    		}
		    		reject(new Error(errorMap[data.error]))
		    	}

		    	console.log('over')
		    })
		})

	    req.write(content)
	    req.end()
	})
			 
}