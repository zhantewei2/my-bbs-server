
/*false return status=202;
	true return status=201;
	msn return status=200;
*/

let mount=require('koa-mount');
module.exports=function(app,Router,myMongo){
	let router=new Router();
	let main=myMongo.main;
	let plates=myMongo.main.plates;
	let userRouter=require('./user.js')(app,Router,myMongo);
	let userMsnRouter=require('./userMsn.js')(Router,myMongo);
	let adminRouter=require('./admin/main.js')(Router,myMongo);
	router.get('/home',async(ctx)=>{
		ctx.body=main.mainObj.cgs;
	})
	router.post('/plates',async(ctx)=>{
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
				plates.getPlates(body,(err,data)=>{
					resolve(data);
				})
			});
	})
	router.post('/viewPlate',async(ctx)=>{
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			body.uId=ctx.session.name;
			plates.viewPlate(body,(err,data)=>{
				resolve(data);
			})
		})

	});
	router.post('/getReply',async(ctx)=>{
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			if(body.inner){
				plates.viewReplys2(body,(err,data)=>{resolve(data)})
			}else{
				plates.viewReplys(body,(err,data)=>{resolve(data)})
			}
		})
	})
	app.use(mount('/router',router.routes()));
	//get verify:
	app.use(mount('/user',userRouter.routes()));
	app.use(mount('/um',userMsnRouter.routes()));
	app.use(mount('/admin6',adminRouter.routes()));

}