const Verify=require('../util/verify');
const verify=new Verify();
const vfKey=require('../appkey.js').vfKey;
const hiddenVf=require('../tool/hiddenVf.js');

module.exports=function(app,Router,mongo){
	let router=new Router();
	const manageRouter=require('./user/manage.js')(Router,mongo);
	hiddenVf({
		key:'hidVf',
		maxAge:300000,
		path:'/user'
	},app)

	router.post('/vf',async(ctx)=>{
		const vf=verify.genVerify();
		ctx.vf=vf;
		ctx.body=verify.encrypt(vf,vfKey);
	});
	router.post('/login',async(ctx)=>{
		//user vf  in session ,ensure the other router can not use vf.
		let name=ctx.session.name;
		if(name){
			ctx.body=await mongo.userColle.login({'_id':name});
		}else{
			ctx.body=await ctx.filterObj({useVf:true},(body,resolve)=>{
				return mongo.userColle.login({'_id':body.name,'info.pswd':body.pswd}).then(v=>{
					if(!v)return resolve(null);
					ctx.session.name=v._id;
					resolve(v);
				})
			})
		}
	});
	router.post('/logout',async(ctx)=>{
		if(ctx.session.name)ctx.session.name=null;
		ctx.status=201;
	})
	router.post('/register',async(ctx)=>{
		ctx.body=await ctx.filterObj({useVf:true},(body,resolve)=>{
			if(!body.name)return null;
				mongo.userColle.find({$or:[{'_id':body.name},{'info.nickN':body.nickN}]},{'_id':1,'info.nickN':1}).then(v=>{
					if(v&&v.length)return resolve({data:v});
					new mongo.userColle({
						'_id':body.name,
						'info.pswd':body.pswd,
						'info.email':body.email,
						'info.nickN':body.nickN
					}).save((err,v)=>{
						if(err)return resolve(null)
						resolve({data:1});
					});
				})
		})
	});
	//nested router
	
	router.use('/manage',manageRouter.routes());
	return router;
}