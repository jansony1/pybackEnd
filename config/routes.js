'use strict'

var Router = require('koa-router')
var User = require('../controller/user')
var App = require('../controller/app')
var Creation = require('../controller/creation')
var Comment = require('../controller/comment')

module.exports = function(){

	var router = new Router({
	  prefix: '/api'
	})

	//账户相关路由
	router.post('/u/signup', App.hasBody ,User.signup)

	router.post('/u/verify', App.hasBody ,User.verify)

	router.post('/u/update', App.hasBody, App.hasValidToken, User.update)

	//应用相关路由App.hasBody, App.hasValidToken,
	router.post('/signature',App.hasBody, App.hasValidToken, App.signature)

	//评论视频列表功能
	router.get('/comments', App.hasValidToken, Comment.find)
	router.post('/comments', App.hasBody, App.hasValidToken, Comment.save)

	router.post('/votes', App.hasBody, App.hasValidToken, Creation.up)

	//视频相关路由
	router.get('/creations',App.hasValidToken, Creation.find)
	router.post('/uploadvideo', App.hasBody ,App.hasValidToken, Creation.uploadVideo)
	router.post('/creations', App.hasBody ,App.hasValidToken, Creation.saveCompleteVideo)
	router.post('/uploadaudio', App.hasBody ,App.hasValidToken, Creation.uploadAudio)

	return router
}