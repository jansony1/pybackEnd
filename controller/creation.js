'use strict'

//上传到七牛完视频后，再异步同步视频到cloudinary之上。因为最终配音视频需要在cloudinary上拼接，七牛不支持拼接
var mongoose = require('mongoose')
var Video = mongoose.model('Video')
var Audio = mongoose.model('Audio')
var Creation = mongoose.model('Creation')
var Promise = require('bluebird')
var xss = require('xss')
var _ = require('lodash')
var robot = require('../util/robot')
var config = require('../config/config')


//同步音频视频从cloudinary到qiniu
function asyncMedia(videoId, audioId){

	if(!videoId){
		return 
	}

	console.log(videoId)
	console.log(audioId)

	var query = {_id: audioId}

	if(!audioId){
		query = {
			video: videoId
		}
	}
	Promise.all([
		Video.findOne({_id: videoId}).exec(),
		Audio.findOne(query).exec()
	])
	.then(function(data){
		console.log(data)

		var video = data[0]
		var audio = data[1]

		console.log('最开始同步数据，检查数据有效性')
		if(!video || !video.public_id|| !audio|| !audio.public_id){
			console.log('还有数据没拿到，不能执行同步')
			return 
		}


	    var video_public_id = video.public_id
	    var audio_public_id = audio.public_id.replace(/\//g, ':')
	    var videoName = video_public_id.replace(/\//g, '_') + '.mp4'
	    var videoURL = 'http://res.cloudinary.com/dkll20hc1/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id + '/' + video_public_id + '.mp4'
	    var thumbName = video_public_id.replace(/\//g, '_') + '.jpg'
	    var thumbURL = 'http://res.cloudinary.com/dkll20hc1/video/upload/' + video_public_id + '.jpg'
	    console.log('videoUrl:'+ videoURL)
	    console.log('thumbURL:'+ thumbURL)
	    console.log('同步视频到七牛')




		// var video_public_id = video.public_id
		// var audio_public_id = audio.public_id.replace('/',':')
		// var videoName = video_public_id.replace('/','_')+'.mp4'
		// var videoURL = config.cloudinary.video+'e_volume:-100/e_volume:400,l_video:'+audio_public_id+'/'+ video_public_id + '.mp4'
		// console.log('videoUrl:'+ videoURL)
		// var thumbName = video_public_id.replace('/','_')+'.jpg'
		// var thumbURL = config.cloudinary.video+video_public_id+'.jpg'

		console.log('start syncronize to qiniu')
		

		robot.asyncToQiniu(thumbURL,thumbName)
			.then((data)=>{
				console.log(data)
				if(data && data.key){
					audio.qiniu_thumb = data.key
					audio.save()
					.then((_audio)=>{
						var creation = Creation.findOne({
							audio: _audio._id,
							video: video._id
						}).exec()
						.then((_creation)=>{
							if(_creation){ //此时可能视频才上传完毕
								if(!_creation.qiniu_thumb){
									_creation.qiniu_thumb = _audio.qiniu_thumb
									_creation.save()

								}
							}
						})
						//console.log('audio:'+ _data)
					})
					console.log('同步到qiniu图片成功')
				}
			})
			.catch((err)=>{
				console.log('同步到qiniu thumb失败'+JSON.stringify(err))
			})

		robot.asyncToQiniu(videoURL,videoName)
			.then((data)=>{
				console.log(data)
				if(data && data.key){
					audio.qiniu_video = data.key
					audio.save()
					.then((_audio)=>{
						var creation = Creation.findOne({
							audio: _audio._id,
							video: video._id
						}).exec()
						.then((_creation)=>{
							if(_creation){ //此时可能视频才上传完毕
								if(!_creation.qiniu_video){
									_creation.qiniu_video = _audio.qiniu_video
									_creation.finish = 100
									 _creation.save()
									console.log('_creation:'+ _creation)
								}
								console.log('补充音视频成功')
							}
						})

					})
					console.log('同步到qiniu视频成功')
				}
			})
			.catch((err)=>{
				console.log('同步到七牛视频失败'+JSON.stringify(err))
			})
	})
}

var userFields = [
  'avatar',
  'nickname',
  'gender',
  'age',
  'breed'
]
//取得视频列表页
exports.find = function * (next){

	  var page = parseInt(this.query.page, 10) || 1
	  var count = 5
	  var offset = (page - 1) * count
	  var queryArray = [
	    Creation
	      .find({finish: 100})
	      .sort({
	        'meta.createAt': -1
	      })
	      .skip(offset)
	      .limit(count)
	      .populate('author', userFields.join(' '))
	      .exec(),
	    Creation.count({finish: 100}).exec()
	  ]

	  var data = yield queryArray

	  console.log('data1:'+ data[0])

	  this.body = {
	    success: true,
	    data: data[0],
	    total: data[1]
	  }
}

//完整提交配音视频
exports.saveCompleteVideo = function *(next){
	var body = this.request.body
	var title = body.title
	var videoId = body.videoId
	var audioId = body.audioId
	var user = this.session.user

	var audio = yield Audio.findOne({
		_id: audioId
	}).exec()

	var video = yield Video.findOne({
		_id: videoId
	}).exec()

	if(!video || !audio){
		this.body = {
			err: '视频或者音频资料不全'
		}
		return next
	}
	console.log('here1')
	var creation = yield Creation.findOne({
		audio: audio,
		video: video
	}).exec()

	console.log('here2')

	if (!creation) {
	    var creationData = {
	      author: user._id,
	      title: xss(title),
	      audio: audioId,
	      video: videoId,
	      finish: 20
	    }

	    var video_public_id = video.public_id
	    var audio_public_id = audio.public_id

	    //下面的逻辑是把两个图床的值都在creation中保存一份
	    if (video_public_id && audio_public_id) {
	      creationData.cloudinary_thumb = 'http://res.cloudinary.com/gougou/video/upload/' + video_public_id + '.jpg'
	      creationData.cloudinary_video = 'http://res.cloudinary.com/gougou/video/upload/e_volume:-100/e_volume:400,l_video:' + audio_public_id.replace(/\//g, ':') + '/' + video_public_id + '.mp4'

	      creationData.finish += 20
	    }

	    if (audio.qiniu_thumb) {
	      creationData.qiniu_thumb = audio.qiniu_thumb

	      creationData.finish += 30
	    }

	    if (audio.qiniu_video) {
	      creationData.qiniu_video = audio.qiniu_video

	      creationData.finish += 30
	    }

	    creation = new Creation(creationData)
   }

   	  creation = yield creation.save()

   	  console.log(creation)

	  this.body = {
	    success: true,
	    data: {
	      _id: creation._id,
	      finish: creation.finish,
	      title: creation.title,
	      qiniu_thumb: creation.qiniu_thumb,
	      qiniu_video: creation.qiniu_video,
	      author: {
	        avatar: user.avatar,
	        nickname: user.nickname,
	        gender: user.gender,
	        breed: user.breed,
	        _id: user._id
	      }
	    }
	  }

}

//提交视频
exports.uploadVideo = function *(next){
	var body = this.request.body
	console.log('body:'+JSON.stringify(body))
	var videoData = body.videoData
	var user = this.session.user

	if(!videoData || !videoData.key){
		this.body = {
			success:false,
			err:'视频上传失败'
		}
		return next
	}

	var video = yield Video.findOne({
		qiniu_key: videoData.key
	}).exec()


	if(!video){
		video = new Video({
			author:user._id,
			qiniu_key: videoData.key,
			persistentId: videoData.persistentId
		})

		video = yield video.save()
	}


	//异步同步视频到cloudinary之上
	let url = config.qiniu.video+ video.qiniu_key
	console.log('url:'+url)
	robot.uploadToCloudinary(url)
		 .then((data)=>{
		 	if(data&& data.public_id){
		 		console.log('视频同步到Cloudinary成功')
		 		video.public_id = data.public_id
		 		video.detail = data.detail
				video.save()
				.then((data)=>{
					asyncMedia(data._id, null)
				})
		 	}
		 })

	this.body = {
		success: true,
		data: video._id
	}

}

//提交音频
exports.uploadAudio = function *(next){
	var body = this.request.body
	console.log('body:'+JSON.stringify(body))
	var audioData = body.audioData
	var videoId = body.videoId
	var user = this.session.user

	if(!audioData || !audioData.public_id){
		this.body = {
			success:false,
			err:'音频上传失败'
		}
		return next
	}

	var audio = yield Audio.findOne({
		public_id: audioData.public_id
	}).exec()

	var video = yield Video.findOne({
		_id: videoId
	}).exec()

	console.log('video:'+ video)

	if(!audio){
	console.log('audio1:'+audio)
		var _audio = {
			author:user._id,
			public_id: audioData.public_id,
			detail:audioData
		}
		if(video){
			_audio.video = video._id
		}
		audio = new Audio(_audio)
	    audio = yield audio.save()
	}

	console.log('audio2:'+audio)

	this.body = {
		success: true,
		data: audio._id
	}

	asyncMedia(video._id, audio._id)
}

exports.up = function *(next){

	var user = this.session.user
	var body = this.request.body
	var creation = body.creation
	console.log('body:'+body)

	creation = yield Creation.findOne({
		_id: creation
	}).exec()

	if(!creation){
		this.body = {
			success: false,
			err: '视频呢哥'
		}
		return next
	}
	if (body.up === 'true') {
	    creation.votes.push(String(user._id))
	  }
  	else {
	    creation.votes = _.without(creation.votes, String(user._id))
	  }

  	creation.up = creation.votes.length

	yield creation.save()

	this.body = {
	    success: true
	}

}

