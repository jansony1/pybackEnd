'use strict'

var mongoose = require('mongoose')
var Comment = mongoose.model('Comment')
var Creation = mongoose.model('Creation')

var userFields = [
  'avatar',
  'nickname',
  'gender',
  'age',
  'breed'
]

exports.find = function *(next) {
  var id = this.query.creation //拿到特定视频的评论

  if (!id) {
    this.body = {
      success: false,
      err: 'id 不能为空'
    }

    return next
  }

  var queryArray = [
    Comment.find({
      creation: id
    })
    .populate('replyBy', userFields.join(' '))
    .sort({
      'meta.createAt': -1
    })
    .exec(),
    Comment.count({creation: id}).exec() //一共多少条评论依附于这个视频
  ]

  var data = yield queryArray

  //console.log('data[0]:'+data[0])

  this.body = {
    success: true,
    data: data[0],
    total: data[1]
  }
}

exports.save = function *(next) {
  var commentData = this.request.body.comment
  var user = this.session.user
  var creation = yield Creation.findOne({
    _id: commentData.creation
  })
  .exec()

  if (!creation) {
    this.body = {
      success: false,
      err: '视频不见了'
    }

    return next
  }

  var comment

  if (commentData.cid) { //这个是某一条评论的数据，作者回复，评论者回复，来来回回需要保持的一个id，走到这一步的话，那么只需要更新reply数组即可
    comment = yield Comment.findOne({
      _id: commentData.cid
    })
    .exec()

    var reply = {
      from: commentData.from,
      to: commentData.tid,
      content: commentData.content
    }

    comment.reply.push(reply)

    comment = yield comment.save()

    this.body = {
      success: true
    }
  }
  else {
    comment = new Comment({ //来了一条新评论
      creation: creation._id,
      replyBy: user._id,
      replyTo: creation.author,
      content: commentData.content
    })

    comment = yield comment.save()

    console.log('comment:'+comment)

    this.body = {
      success: true,
      data: [comment]  // 返回数组是和前端对应
    }
  }
}
