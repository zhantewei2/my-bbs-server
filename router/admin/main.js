const {reply2pS,cacheNum,rcCount,imgMaxSize}=require('../../tool/common.js');
const fs=require('fs');
const {storeImg,delImg}=require('../../tool/storeImg.js');
const { Readable} =require('stream');
const {headerPath,defaultCoverImg}=require('../../tool/common.js');
const stg=config.strategy;
module.exports=function(Router,myMongo){
	const router=new Router();
	const users=myMongo.userColle;
	const main=myMongo.main;
	const host=myMongo.mainColle;
	const plates=main.plates;
	const replys=main.replys;
	const reply2s=myMongo.reply2Colle;
	const articles=main.models;
	const mainObj=main.mainObj;
	const plateHostMethod=require('../../mongodb/method/plate-host-method.js')(host,articles,mainObj)
	router.use('',async(ctx,next)=>{
		let name=ctx.session.name;
		let result=await users.findOne({_id:name}).then(v=>{
			if(!v||!(v.type=='admin'||v.type=='manager'))return false;
			return true;
		})
		if(!result){
			ctx.body=null;
		}else{
			await next();
		}
	})
	router.post('/dealRg',async(ctx)=>{
		/*
			rg?:
			rgName?:
			cg:
			method: add|remove;
		*/
		ctx.body=await new Promise(resolve=>{
			try{
				const body=ctx.request.body;
				if(method=='add'){
					main.addCg(body.cg,body,rgName).then(v=>resolve(v));
				}else if(method=='remove'){
					main.removeCg(body.rg,body.cg).then(v=>resolve(v));
				}
			}catch(e){
				resolve(null);
			}
		})
	})
	router.post('/dealArticle',async(ctx)=>{
		/**obj:
			id:ObjectId,
			auId:
			rgId:
			cgId:
			m?Modify:boolean?
		*/
		/*obj:Modify:
		  	id:article id;
		 	rgId:
		 	d:ModifyDate={};
		*/
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			if(!body.m){
				plates.dealPlate('remove',body,(err)=>resolve(!err));
			}else{
				for(let i in body.d){
					if(i=='lrd'||i=='cd')body.d[i]=new Date(body.d[i]);
				}
				articles[body.rgId].update({_id:body.id},{$set:body.d},(err)=>resolve(!err))
			}
		})
		
	})
	router.post('/delReply2',async(ctx)=>{
		/**
		*/
		ctx.body=await ctx.filterObj({},(body,resolve)=>{

			if(!body.all){
				plates.removeReply2(body,(err)=>resolve(!err));
			}else{
				plates.removeAllReply2(body,(err)=>resolve(!err));
			}
			
		})
	})
	router.post('/viewReply2',async(ctx)=>{
		/*
			rId,
			aId,
			t:
			dr:
			rgId:
		*/
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			const query={aId:body.aId,rId:body.rId},
				dr=body.dr,
				t=new Date(body.t);

			replys[body.rgId].findOne(query,{'rCache.cs':1},(err,data)=>{
				try{
					const cs=data.rCache.cs-cacheNum;
					const result=(err,v)=>resolve({d:v,c:cs});
					if(!dr){
						reply2s.find(query).sort({cd:1}).limit(reply2Ps).exec(result)
					}else if(dr=='next'){
						query.cd={$gt:t};
						reply2s.find(query).sort({cd:1}).limit(reply2Ps).exec(result);
					}else if(dr=='pre'){
						query.cd={$lt:t};
						reply2s.find(query).sort({cd:-1}).limit(reply2Ps).exec(result);
					}else{
						let count=cs % reply2Ps||reply2Ps;
						reply2s.find(query).sort({cd:-1}).limit(count).exec(result);
					}
				}catch(e){resolve(null)}
			})
		})
	})

	router.post('/recommendArticle',async(ctx)=>{
		/*
		  as?:Array<aId>; modify need
		  rgId:
		  m?:Method  'get'
		*/
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			const mainObj=main.mainObj;
			const rgId=body.rgId;
			const rcArr=mainObj.rcs[rgId];
			try{
				if(body.m=='get'){
					plateHostMethod.getRecommend(rgId,(err,data)=>resolve(data))
				}else{
					const as=body.as;
					if(!(as instanceof Array)||as.length>rcCount)return resolve(false);	
					host.update({rgId:rgId},{$set:{rc:as}},(err,data)=>{
						if(err)return resolve(false);
						mainObj.rcs[rgId]=as;
						let model=articles[rgId];//...global;
						as.asyncForEach(
							(v,next)=>{
								model.update({_id:v},{$set:{'or.rc':true}},next)
							},
							()=>resolve(true)
						)
					})
				}
			}catch(e){resolve(false)}
		})
	})
	router.post('/upImg',async(ctx)=>{
		/*
			cover?:
			rgId?:
			cgId?:
		*/
		try{
			const query=ctx.query;

			if(query&&query.cover&&query.rgId){
				/*
					modify cover:post-upImg =>post-coverC 
				*/
				const result=await storeImg(ctx,stg.img.cover);
				ctx.body=await new Promise(resolve=>{
					host.findOneAndUpdate(
						{rgId:query.rgId},
						{$set:{'cover.img':result}},
						{select:{'cover.img':1,_id:0}},
						(err,data)=>{
						if(!data)return delImg(result,()=>resolve(null))
						const next=()=>{
							const rgObj=main.getRg(query.cgId,query.rgId);
							rgObj.cover.img=result;
							resolve(true);
						}	
						const preImgPath=data.cover.img;
						if(preImgPath&&preImgPath!=defaultCoverImg){
							delImg(preImgPath,next);
						}else{
							next()
						}
					})
				})
			}else{
				ctx.body= await storeImg(ctx);	
			}
		}catch(e){ctx.body=null}
	})

	
	router.post('/brief',async(ctx)=>{
		/*
			s:'del' | 'insert'|'view'
			----del
			url:del relative path;
			---insert
			ul:imgList:Array<img relative url>;
			delImg:Array;
			rgId:
			c:content;
			----view:
			rgId:
		*/
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			const s=body.s;
			try{
				if(s=='del'&&body.url){

					delImg(body.url,()=>resolve(true));
				}else if(s=='insert'){
					const imgList=body.ul;
					const content=body.c;
					const delList=body.delImg;
					const newBrief=()=>{
						host.update(
							{rgId:body.rgId},
							{
								$set:{brief:{c:body.c,imgs:imgList||[]}}
							},
							(err,data)=>{
								resolve(!err);
							}
						)
					}
					if(delList){
						delList.asyncForEach(
							(path,next)=>{
								delImg(path,next);
							},
							newBrief
						)
					}else{newBrief()}
				}else if(s=='view'){
					plateHostMethod.viewPlateBrief(body.rgId,true,(data)=>resolve(data))
				}else{
					resolve(false)
				}
			}catch(e){
				resolve(false)
			}
		})
	})
	router.post('/rg',async(ctx)=>{
		/*
			m:'remove'|'add'|'sort'
			---add:
			cgId:
			rgName:
			---remove:
			cgId:
			rgId:
			---sort:
			change: Object:{rgId1:rgOrder1,rgId2:rgOrder2};
			cgId:
		*/
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			try{
				const cgId=body.cgId;
				if(body.m=='add'){
					main.addRg(cgId,body.rgName).then(v=>resolve(v));
				}else if(body.m=='remove'){
					main.removeRg(cgId,body.rgId).then(v=>resolve(v));
				}else if(body.m=='sort'){
					const params=body.change,
					keys=Object.keys(params),
					rgsObj=mainObj['cgs'][cgId]['rgs'],
					end=()=>{
						main.sortRg(cgId);
						resolve(true);
					}
					let vlaue;
					keys.asyncForEach(
						(v,next)=>{
							value=params[v];
							rgsObj[v].order=value;
							host.update({cgId:cgId,rgId:v},{$set:{order:value}},next)
						},
						end
					)
				}else{
					resolve(null);
				}
			}catch(e){resolve(null)}
		})
	})
	router.post('/cg',async(ctx)=>{
		/*
			m:'remove'|'add'
			----add:
			cgName:
			---remove:
			cgId:
		*/
		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			try{
				if(body.m=='add'){
					main.addCg(body.cgName).then(v=>resolve(v));
				}else if(body.m=='remove'){
					main.removeCg(body.cgId).then(v=>resolve(v));
				}else{
					resolve(null);
				}
			}catch(e){
				resolve(null);
			}
		})
	})

	router.post('/cover',async(ctx)=>{
		/*c:
		  rgId:
		  cgId:
		*/

		ctx.body=await ctx.filterObj({},(body,resolve)=>{
			try{
				host.update({rgId:body.rgId},{$set:{'cover.c':body.c}},(err)=>{
					if(err)return resolve(null);
					const rgObj=main.getRg(body.cgId,body.rgId);
					rgObj.cover.c=body.c;
					resolve(rgObj.cover);
				})
			}catch(e){resolve(null)}
		})
	})

	return router;
}