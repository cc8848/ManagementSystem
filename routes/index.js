var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

mongoose.connect('mongodb://localhost:27017/project', function(err) {
	if(!err) {
		console.log('数据库连接成功!!!');
	}
});

var userSchema = new mongoose.Schema({
	username: String,
	password: String,
	name: String,
	role: String,
	department: String,
	orderNum: Number,
	status: Number
});

var  logSchema = new  mongoose.Schema({
	adminuser:String,
	content:String,
	intime:Date,
	result:String,
	ip:String
});

var userModel = mongoose.model('user', userSchema, 'user');
var logModel = mongoose.model('log', logSchema, 'log');

router.get('/userlogin.html', function(req, res) {
	// 获取用户传递的用户名和密码
	var username = req.query.username;
	var password = req.query.password;

	userModel.find({
		'username': username,
		'password': password
	}).exec(function(err, data) {
		// 如果查询有数据 则将用户名写入cookie中
		if(data.length) {
			res.cookie('username', username);
		}
		var log = new logModel();
 		log.adminuser=username;
 		log.content = '登录了系统';
 		log.intime = new Date().toLocaleString();
 		log.result = '成功';
 		log.ip = req.ip;
 		log.save(function(err){
 			res.send(data);
 		})
	});

});

// 判断用户是否登陆过
router.get('/checklogin.js', function(req, res) {
	// 判断是否存在usernamecookie，如果存在，则不作别的处理，如果不存在，则提示用户,并跳转登录页面
	if(req.cookies.username) {
		res.send('');
	} else {
		res.send('alert("你还未登录，快去登录吧!");location.href="login.html";')
	}
});

/*退出登录  清除cookie并跳转登录页面*/
router.get('/loginout.html', function(req, res) {
	//清除cookies
	res.clearCookie('username');
	res.send('<script>alert("退出登录成功!");location.href="/admin/pages/login.html";</script>');
});

/*添加新用户*/
router.post('/user_add.html', function(req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var name = req.body.name;
	var role = req.body.role;
	var department = req.body.department;
	var orderNum = parseInt(req.body.orderNum);
	var status = parseInt(req.body.status);
//	console.log(username,password,name,role,department,orderNum,status);
	
	 var user = new userModel();
	 user.username = username;
	 user.password = password;
	 user.name = name;
	 user.role = role;
	 user.department = department;
	 user.orderNum = orderNum;
	 user.status = status;
	 
	 user.save(function(err){
	 	if (err) {
	 		res.send('0');
	 	}else{
	 		var log = new logModel();
	 		log.adminuser=req.cookies.username;
	 		log.content = '创建了新用户:'+username;
	 		log.intime = new Date().toLocaleString();
	 		log.result = '成功';
	 		log.ip = req.ip;
	 		log.save(function(err){
	 			res.send('1');
	 		})
	 	}
	 })
});

/*分页显示用户*/
router.get('/user_showpage.html',function(req,res){
	var pagesize = 4;// 每页显示的行数
	//条件二：获取当前的页码，如果没有传值，默认在第1页
	var page = req.query.page?req.query.page:1;
	userModel.find({}).exec(function(err,data){
		// 总页数=向上取整（数据总长度/每页行数）
		var pagecount = Math.ceil(data.length/pagesize);
		/*
		 * 必须要知道从哪里开始读取(起始位置)多少条数据(pagesize)
		 * 	当前在第1页		跳过 0
		 * 	当前在第2页		跳过 3
		 * 	当前在第3页		跳过 6
		 * 	当前在第4页		跳过 9
		 * 	
		 * 	start=(page-1)*pagesize
		 */
		var start = (page-1)*pagesize;
		userModel.find({}).skip(start).limit(pagesize).sort({'orderNum':1}).exec(function(err,data){
			// data是一个数组  可以直接使用push将pagecount添加进去，将data相应给浏览器
			data.push({'pagecount':pagecount});
//			console.log(data[0]._id);
			res.send(data);
		});
		
	});
});

/*删除用户*/
router.post('/user_delete.html',function(req,res){
	var idsArr = req.body.idsArr;
//	console.log(idsArr);
// 将接收到的id字符串转换成数组
	var  idsArr = idsArr.split(',');
	userModel.find({'_id':{$in:idsArr}}).exec(function(err,data){
		
		for (var i in data) {
			// 删除数据
			data[i].remove();
		}
		var log = new logModel();
 		log.adminuser=req.cookies.username;
 		log.content = '删除'+data.length+'个用户';
 		log.intime = new Date().toLocaleString();
 		log.result = '成功';
 		log.ip = req.ip;
 		log.save(function(err){
 			res.send('1');
 		})
	});
});

/*修改用户
 * 根据客户端提交的id进行查找并返回数据
 */
router.get('/user_show.html',function(req,res){
	var id = req.query.id;
//	console.log(id);
		
	userModel.findById(id).exec(function(err,data){
		if (err) {
			throw err;
		} else{
			res.send(data);
		}
	})
});

/*
 * 保存修改的数据
 */
router.post('/user_edit.html',function(req,res){
	var id = req.body.id;
	var name = req.body.name;
	var role = req.body.role;
	var status = parseInt(req.body.status);
	var orderNum = parseInt(req.body.orderNum);
	var username = req.body.username;
	var department = req.body.department;
//	console.log(id,name,role,status,orderNum,username,department)
	 userModel.findById(id).exec(function(err,data){
		 data.username = username;
		 data.name = name;
		 data.role = role;
		 data.department = department;
		 data.orderNum = orderNum;
		 data.status = status;
	 	
		 data.save(function(err){
		 	if (err) {
		 		res.send('0');
		 	}else{
		 		var log = new logModel();
		 		log.adminuser=req.cookies.username;
		 		log.content = '修改了户名为:'+username;
		 		log.intime = new Date().toLocaleString();
		 		log.result = '成功';
		 		log.ip = req.ip;
		 		log.save(function(err){
		 			res.send('1');
		 		})
		 	}
		 })
	 });
});

/*
 * 修改密码
 */
router.get('/edit_password.html',function(req,res){
	// 获取cookie中的username
	var username = req.cookies.username
	var password = req.query.oldpassword;
	var newpassword = req.query.newpassword;
//	console.log(username,password,newpassword)
	userModel.find({'username':username,'password':password}).exec(function(err,data){
		if (data.length) {
			data[0].password=newpassword;
			data[0].save(function(err){
				if (err) {
					throw err;
					res.send('0');
				} else{
					res.send('1');
				}
			})
		}else{
			res.send('0');
		}
	});
});

/*查询用户*/
router.get('/search.html',function(req,res){
	var username = req.query.username;
	var department = req.query.department;
	var role = req.query.role;
//	console.log(username,department,role);
	var obj={};
	if (department!='全部') {
		obj.department=department;
	}
	if (role!='全部') {
		obj.role=role;
	}
	if (username!='') {
		// 如果用户名不等于空 通过正则表达式将username传入
		obj.username = new RegExp(username);
	}
//	console.log(obj);
	userModel.find(obj).sort({'orderNum':1}).exec(function(err,data){
		res.send(data);
	});
});

/*显示所有日志*/
router.get('/log_show.html',function(req,res){
	var  page = req.query.page?req.query.page:1;
	var  pagesize = 5;//每页显示log条数
	logModel.find({}).exec(function(err,data){
		//获取总页数
		var  pagecount = Math.ceil(data.length/pagesize);
		//，每页显示哪条数据开始
		var start = (page-1)*pagesize;
		logModel.find({}).skip(start).limit(pagesize).sort({'intime':-1}).exec(function(err,data){
			if (!err) {
				// 将总页数加入到data数组中返回给浏览器
				data.push({'pagecount':pagecount});
				res.send(data);
			}
		});
	});
});

module.exports = router;