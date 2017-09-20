const fs=require('fs');
const common=require('../../tool/common.js');
const uniqueNum=common.uniqueNum;
const headerPath=common.headerPath;
const {storeImg,delImg}=require('../../tool/storeImg.js');

module.exports=function(Router,mongo){
	const router=new Router();
	let plates=mongo.main.plates,
		voteMethod=mongo.voteMethod,
		users=mongo.userColle,
		ntfs=mongo.ntfColle;

	router.use(async(ctx,next)=>{
		let name=ctx.session.name;
		if(!ctx.session.name)return ctx.body=null;
		ctx.sessionName=name;
		await next()
	});
	router.post('/upHeader',async(ctx)=>{
		let result=await storeImg(ctx);
		if(result&&result!='over'){
			ctx.body=await new Promise(resolve=>{
				mongo.userColle.findOneAndUpdate(
					{'_id':ctx.sessionName},
					{$set:{head:{name:result,custom:true}}},
					{select:{head:1,_id:0}},
					(err,v)=>{
						v.head.custome?delImg(v.head.name,()=>resolve(result)):resolve(result);
					});
			})
		}else{
			ctx.body=result;
		}
	})
	router.post('/selHeader',async(ctx)=>{
		ctx.body=await ctx.filterObj({},(data,resolve)=>{
			//data: name: imgName ;
			mongo.userColle.findOneAndUpdate(
					{'_id':ctx.sessionName},
					{$set:{head:{name:data.name,custom:false}}},
					{select:{head:1,_id:0}
				}).then(v=>{
					v.head.custom?delImg(v.head.name,(err)=>{resolve(err?null:data.name)}):resolve(data.name);
				})
			})
	});
	router.post('/cgMsn',async(ctx)=>{
		ctx.body=await ctx.filterObj({},(data,resolve)=>{
			mongo.userColle.update({'_id':ctx.sessionName},{$set:data}).then(v=>{resolve(!!v)}).catch(e=>resolve(false));
		})
	})
	router.post('/publish',async(ctx)=>{
		ctx.body=await ctx.filterObj({useVf:true},(body,resolve)=>{
				if(body.mf){
					plates.dealPlate('modify',body,(err,data)=>resolve(!err));
				}else{
					plates.dealPlate('insert',body,(err,data)=>resolve(!err))
				}
			})
	})
	router.post('/reply',async(ctx)=>{
		/*reply2:obj.r2 existing
		*/
		ctx.body=await ctx.filterObj({useVf:true},(body,resolve)=>{
				body.uId=ctx.sessionName;
				if(body.r2){
					plates.newReply2(body,(err,data)=>{resolve(!err)});
				}else{
					plates.newReply(body,(err,data)=>{resolve(!err)})
				}
			})
	});
	router.post('/vote',async(ctx)=>{
		const id=ctx.sessionName;
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			voteMethod.vote(id,body,(err,data)=>resolve(data));
		})
	});
	router.post('/upL',async(ctx)=>{
		ctx.body=await new Promise((resolve)=>{
            users.upgrade(ctx.sessionName,(err)=>resolve(!err))
		})
	});
	router.post('/ntf',async(ctx)=>{
		ctx.body=await new Promise(resolve=>{
			ntfs.getNtf(ctx.sessionName,(err,data)=>resolve(data))
		})
	});
	router.post('/stg',async(ctx)=>{
		/*
		i?:vote
		*/
		ctx.body=await ctx.filterObj({useVf:true},(body,resolve)=>{
			body.uId=ctx.sessionName;
			if(body.i){
				plates.newVote(body,(err,data)=>resolve(!err));
			}else{
				plates.newPay(body,(err,data)=>resolve(!err));
			}
		})
	})
	return router;
}