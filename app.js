'use strict'

//加载model，项目初始将所有的model schema加载进来。
var fs = require('fs')
var path = require('path')
var mongoose = require('mongoose')
var db = 'mongodb://localhost/imoc-app'

mongoose.Promise = require('bluebird')
mongoose.connect(db)

var models_path = path.join(__dirname, './model')

var walk = function(modelPath){
	//加载所有的model，如果model少的情况下，可以采取直接引入的方式。
	fs
	  .readdirSync(modelPath)
		  .forEach(function(file){

		  	var filePath = path.join(modelPath, '/' + file)
		  	var stat = fs.statSync(filePath)
		   	if(stat.isFile()){
		   		if(/(.*)\.(js|coffee)/.test(file)){
		   			require(filePath)
		   		}
		   	}else if(stat.isDirectory()){
		   		walk(filePath)
		   	}
		  })
}


walk(models_path)

var koa = require('koa')
var logger = require('koa-logger')
var session = require('koa-session')
var bodyParser = require('koa-bodyparser')


var router = require('./config/routes')()


var app = koa()
app.keys =['zhenyu']

app.use(logger())
app.use(session(app))
app.use(bodyParser())


app.use(router.routes());
app.use(router.allowedMethods());

app.listen('1234')