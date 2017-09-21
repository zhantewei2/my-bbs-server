let epStg=require('../tool/experience.js').epStg;
let mongoose=require('mongoose');
let common=require('../tool/common.js');
const cacheCount=common.reply2CacheNum;
const pageSize=common.pageSize;
const replyPs=common.replyPs;  //reply pageSize;
const reply2Ps=common.reply2Ps;

module.exports=function(mainObj,models,replys,mainColle,userColle,reply2Colle,ntfColle,aVote,aPay,aReply){

	let methods={}
	let getRgObj=(cgId,rgId)=>{
		return mainObj['cgs'][cgId]['rgs'][rgId];
	}
	const hostMethod=require('./method/plate-host-method.js')(mainColle,models,mainObj);
	methods.dealPlate=function(method,obj,cb){
		/*obj:
		{	aId:
			cgId:
			rgId
			auId:  author user._id;
			auN:   author user.info.nickN
			t:title,
			s:start,
			c:content;
			c2:content;
			stg?:
		}*/
		let rgId=obj.rgId,
			id=obj.aId;
		let model=models[rgId];
		if(method=='insert'){
			const insertD={
				t:obj.t,
				c:obj.c,
				s:obj.s,
				au:{
					n:obj.auN,
					id:obj.auId
				},
				lrd:new Date(),
				cd:new Date()
			}
			if(obj.stg)insertD.stg=obj.stg;
			if(obj.c2){
				insertD.c2=obj.c2;
				insertD.v2=1;
			}
			model.create(insertD,(err,data)=>{
				//add rgObj.attr;
				if(obj.stg){
					const aId=data._id;
					obj.stg.p&&aPay.create({aId:aId,uId:obj.auId});
					obj.stg.rv&&aReply.create({aId:aId,uId:obj.auId});
				}
				if(err)return cb(err,null);
				let rgObj=getRgObj(obj.cgId,rgId);
				rgObj.todayA++;
				rgObj.totalA++;
				rgObj.todayAc++;
				// add user exp:
				userColle.addExp(obj.auId,'publish',cb);
			})
		}else if(method=='modify'){
		/*obj:
			aId:ObjectId.,
			c?:content;
			t?:title;
			s?:start
			rgId:
		*/
			let mfObj={},uq={__v:1};
			mfObj['md']=new Date().toJSON();
			if(obj.c)mfObj.c=obj.c;
			if(obj.t)mfObj.t=obj.t;
			if(obj.s)mfObj.s=obj.s;
			if(obj.stg)mfObj.stg=obj.stg;
			let opts={$set:mfObj,$inc:uq};
			if(obj.c2){
				mfObj.c2=obj.c2,
				uq.v2=1
			}else if(obj.stg&&obj.stg.v){
				opts.$unset={v2:''};
			}
			model.update({_id:id},opts,cb);
		}else if(method=='remove'){
		/*obj:
			aId:ObjectId,
			auId:
			rgId:
			cgId:
		*/	

			model.remove({_id:id},(err,data)=>{
				if(err)return cb(err,null);
				let rgObj=getRgObj(obj.cgId,rgId);
				rgObj.totalA--;
				replys[rgId].remove({aId:id},(err,data)=>{
					reply2Colle.remove({aId:id},cb)
				})
			})
		}
	}
	methods.newPay=function(obj,cb){
		/*obj:
			uId:
			aId:
			p:number;
			rgId:
		*/
		try{
		userColle.gold(obj.uId,0-obj.p,(err)=>{
			if(err)return cb(err,null);
			models[obj.rgId].findOneAndUpdate(
				{_id:obj.aId},
				{$inc:{'stg.p.t':1}},
				{select:{'au.id':1}},
				(err,data)=>{
					if(err)return cb(true,null);
					aPay.create({aId:obj.aId,uId:obj.uId},()=>{
						userColle.gold(data.au.id,obj.p,cb);
					})
				}
			)
		})	
		}catch(e){cb(true,null)}
	}
	methods.newVote=function(obj,cb){
		/*obj:
			uId:
			aId:
			i: vote Item name;
			rgId:
		*/
		const setObj={};
		setObj['stg.v.v.'+obj.i]=1
		
		models[obj.rgId].update(
			{_id:obj.aId},
			{$inc:setObj},
			(err,data)=>{
				if(err)return cb(true,null);
				aVote.create({aId:obj.aId,uId:obj.uId},cb)
			}	
		);
	}
	methods.newReply=function(obj,cb){
		/*obj:
			{
				cgId:
				rgId:
				aId: plateId
				c:content,
				uId:
				auName:
				back:boolean=false;
				tId?: to userAccountName
			}
		*/
		const rgId=obj.rgId,
			  cgId=obj.cgId;
		let replyModel=replys[rgId];
		let setObj={lrd:new Date()};
		setObj['or.lrn']=obj.auName;
		models[rgId].findOneAndUpdate(
			{_id:obj.aId},
			{	
				$inc:{rps:1},
				$set:setObj
			},
			{	
				new:true,
				select:{rps:1,t:1,stg:1}
			},
			(err,aData)=>{
				if(err)return cb(err,null);
				let id=aData.rps;
				//save reply

				replyModel.create({
					aId:obj.aId,
					rId:id,
					c:obj.c,
					auId:obj.uId
				},(err,data)=>{
					if(err)return cb(err,null);
					let rgObj=getRgObj(cgId,rgId),
						next=(err,data)=>{
							userColle.addExp(obj.uId,'reply1',cb);
						};			
					((goNext)=>{
						if(aData.stg){
							let aQuery={aId:obj.aId,uId:obj.uId};
							if(aData.stg.rv){
								aReply.create(aQuery,goNext)
							}else if (aData.stg.p){
								aPay.create(aQuery,goNext)
							}else{goNext()}
						}else{goNext()}
					})(()=>{	
						rgObj.todayAc++;
						if(obj.tId){
							//send ntf:
							ntfColle.reply(
							{
								tId:obj.tId,
								thId:obj.aId,
	                        	p:{cg:cgId,rg:rgId},
								ab:aData.t.slice(0,12)
							},next)
						}else{next()}
					})
				})
			}
		)
	}
	methods.newReply2=function(obj,cb){
		/*
		obj:{
			rgId:,   rgId
			aId ,    ArticleId
			rId:,    replyArticleId
			tId:,    toId;
			auId:uId;
			auName:author Name,  //nickName;
			c:
			ab: abstract;
		}
		*/
		let rId=obj.rId,
			aId=obj.aId,
			auId=obj.uId;
			rgId=obj.rgId;
		let replyModel=replys[rgId];
		let end=(err,data)=>{
			if(err)return cb(err,null);
			//send ntf:
			ntfColle.reply(
			{
				tId:obj.tId,
				thId:aId+'_'+rId,
				p:{cg:obj.cgId,rg:rgId,now:Math.ceil(rId/replyPs)},
				f:rId,
				ab:obj.ab
			},
			()=>{
				userColle.addExp(auId,'reply2',cb);
			})
		};
		replyModel.findOneAndUpdate(
			{rId:rId,aId:aId},             // -----find 
			{$inc:{'rCache.cs':1}},
			{select:{_id:1,'rCache.cs':1}},
			(err,result)=>{
			if(err||!result)return cb(err,null);	
			if(result.rCache.cs<cacheCount){
				replyModel.update(
					{_id:result._id},
					{$push:{'rCache.mbs':{
						auId:auId,
						c:obj.c,
						auName:obj.auName,
						cd:new Date().getTime()
					}}},
					end
				)
			}else{
				//append relate msn;
				new reply2Colle({
					c:obj.c,
					auId:auId,
					auName:obj.auName,
					pos:rgId,
					rId:rId,
					aId:aId,
					cd:new Date()
				}).save(end);
			}
		})
	};
	const platesPj={t:1,'au.n':1,cd:1,lrd:1,rps:1,rds:1,__v:1,_id:1,s:1,v2:1,or:1}
	methods.getPlates=(obj,cb)=>{
		/*obj:{
			t?:   time
			rgId:
			cgId:,
			bf?: if noexist no return brief;
		}*/
		try{
		const rgObj=getRgObj(obj.cgId,obj.rgId);
		const dr=obj.dr;
		const totals=rgObj.totalA;		
		const end=(err,data)=>{
			if(err){
				cb(true,null)
			}else{
				let result={d:data,c:totals};
				if(!dr){
					hostMethod.addonPlates(result,obj.rgId,!obj.bf,cb);
				}else{
					cb(null,result);
				}
			}
		}
			let model=models[obj.rgId],
				time=obj.t;
			if(dr=='pre'){
				model.find({lrd:{$gt:time}},platesPj).sort({lrd:1}).limit(pageSize).exec(end);
				//client will reverse arr;
			}else if(dr=='next'){
				model.find({lrd:{$lt:time}},platesPj).sort({lrd:-1}).limit(pageSize).exec(end);
			}else{
				model.find({},platesPj).sort({lrd:-1}).limit(pageSize).exec(end)
			}
		}catch(e){cb(true,null)}
	}


	let readReply=(rgId,aId,start)=>{
		let end=start+replyPs;
		let pj={aId:0,_id:0};
		return new Promise(resolve=>{replys[rgId].collection.find(
			{ aId:mongoose.Types.ObjectId(aId),
			  rId:{$gte:start,$lt:end}},pj).toArray((err,data)=>{resolve(data)})
		})
	};
	let getUserMsn=(id)=>{
		let pj={_id:1,'info.nickN':1,level:1,ep:1,'head.name':1};
		return new Promise((resolve,reject)=>{
			userColle.collection.findOne({_id:id},pj,(err,data)=>{
				if(err)reject(err);
				resolve(data);
			});
		})
	}
	let addonUser=(replys)=>{
		return new Promise((resolve,reject)=>{
			replys.asyncForEach(
				(reply,next)=>{
					getUserMsn(reply.auId).then(v=>{
						//addition  user to reply Obj;
						reply.user=v;
						next();
					}).catch(e=>reject(e))
				},
				()=>{resolve()}
			)
		})
	}
	const readPlate=(rgId,id,pj,cb)=>{
			models[rgId].collection.findOneAndUpdate(
				{_id:mongoose.Types.ObjectId(id)},
				{$inc:{rds:1}},
				{ projection:pj},cb
			)
		};
	const dealContent2=(obj,doc,cb)=>{
		try{
				if(doc.v2&&doc.v2===obj.v2){
					doc.c2=undefined;
					doc.v2=undefined;
					if(doc.stg.rv)doc.stg=undefined;
					return cb(doc);	
				}

				if(doc.stg){
					let uId=obj.uId;
					const prevent=(n)=>{
						doc.c2=undefined;
						doc.nStg=n;
						cb(doc);
					},
					query={aId:obj.aId,uId:uId},
					pj={_id:1};
					if(doc.stg.rv){
						if(!uId){
							prevent('rv');
						}else{
							aReply.findOne(query,pj,(err,data)=>{
								if(data){
									doc.stg=undefined;
									cb(doc);
								}else{prevent('rv')};
							})	
						}	
					}else if(doc.stg.p){
						if(!uId){
							prevent('p');
						}else{
							aPay.findOne(query,pj,(err,data)=>{
								data?cb(doc):prevent('p');
							})
						}
					}else{
						cb(doc)
					}
				}else{cb(doc)}
			}catch(e){cb(false)}
		}
	const vpCleanPj={au:1,sup:1,op:1,rps:1,rds:1,_id:0,stg:1};
	methods.viewPlate=(obj,cb)=>{
		/*
	return {d:mainData,r:replys};
		obj:{
			rgId:
			aId:ObjectId,
			s?:  start=1
			__v?:
			stg----:
			uId?:read user Id; stg required;
			stg false return {nStg:'r'|'p'};	
		}
		__v==-1;   only replys and sup op;
		__v==-2;   visit replys;return rps,t,s;
		__v==-3;   __v==-1++return content2;
		__v===undefined; return all;
		__v==other number; compare version;
		v?
		*/
			let aId=obj.aId,
				rgId=obj.rgId,
				__v=obj.__v;
			try{
			((next)=>{
			 if(__v==-1){
			 	//justy return replys and sup op;version had be compared by angular;
			 	readPlate(rgId,aId,vpCleanPj,(err,data)=>{
			 		if(err||!data.value)return cb(true);
			 		const doc=data.value;
			 		if(doc.stg&&doc.stg.rv)doc.stg=undefined;
			 		next(doc,1);
			 	})
			 }else if(__v==-2){
			 	readPlate(rgId,aId,{rps:1,_id:0,t:1,s:1,'au.id':1},(err,data)=>{
			 		if(err||!data.value)return cb(true);
			 		next(data.value,obj.s);
				})

			 }else if(__v==-3){
			 	vpCleanPj.v2=1;
			 	vpCleanPj.c2=1;
			 	readPlate(rgId,aId,vpCleanPj,(err,data)=>{
			 		if(err||!data.value)return cb(true);
			 		dealContent2(obj,data.value,(doc)=>next(doc,1))
			 	})
			 }else{
			 	readPlate(rgId,aId,{_id:0},(err,data)=>{
			 		try{
			 			if(err||!data.value)throw true;
				 		let doc=data.value;
				 		dealContent2(obj,doc,(doc)=>{
				 			if(doc.__v==__v){
					 			doc.t=undefined;
					 			doc.c=undefined;
					 			doc.s=undefined;
					 			doc.lrd=undefined;
					 			doc.cd=undefined;
					 			doc.__v=undefined;
					 			doc.md=undefined;
				 			}
				 			next(doc,obj.s||1);
				 		}) 				 		
				 	}catch(e){cb(true)}	
			 	})
			 }
			})((doc,start)=>{
			 	getUserMsn(doc.au.id).then(v=>{

				doc.au=undefined;
				//addition user to doc obj;
				doc.user=v;
				if(doc.rps>0){
				readReply(rgId,aId,start).then(replys=>{
					addonUser(replys).then(()=>{
					 cb(null,{d:doc,r:replys});
					}).catch(e=>cb(true))
				})
				}else{cb(null,{d:doc,r:[]})}
				})	
			 })
		}catch(e){cb(true)}
	}
	methods.viewReplys=(obj,cb)=>{
		/*obj:{
		rgId:,
		aId:ArticleId,
		s:
		}
		*/
			readReply(obj.rgId,obj.aId,obj.s).then(replys=>{
				addonUser(replys).then(()=>{
					cb(null,{d:null,r:replys});
				}).catch(()=>cb(true,null));
			})	
		
	}
	methods.viewReplys2=(obj,cb)=>{
		/*
			aId:, articleId;
			rId:
			rgId?: dr=='end';
			t?:
			dr?:direction;undefined==startPage||next||pre||end
			re?:reverse ==false; defualt;

			return [];

			if(dr=='end')return {data:[],count:number}
		*/
		try{
		let pj={auName:1,c:1,cd:1,_id:0,auId:1};
		let query={'rId':obj.rId,'aId':obj.aId},
		dr=obj.dr;
		let time=obj.t&&new Date(obj.t);
		if(!dr){
			reply2Colle.find(query,pj).sort({cd:1}).limit(reply2Ps).exec(cb);
		}else if(dr=='next'){
			query.cd={$gt:time};
			reply2Colle.find(query,pj).sort({cd:1}).limit(reply2Ps).exec(cb);
		}else if(dr=='pre'){
			query.cd={$lt:time};
			reply2Colle.find(query,pj).sort({cd:-1}).limit(reply2Ps).exec(cb);//client reverse;
		}else{
			replys[obj.rgId].findOne({aId:obj.aId,rId:obj.rId},{_id:0,'rCache.cs':1},(err,data)=>{
				if(err)return cb(true);
				let totals=data.rCache.cs-cacheCount;
				let limit=totals%reply2Ps,count=limit||reply2Ps;
				reply2Colle.find(query,pj).sort({cd:-1}).limit(count).exec((err,data)=>{
					cb(err,{data:data,colles:totals})
				});
			})
		}}catch(e){cb(true)}
	};
	methods.removeReply2=(obj,cb)=>{
		//the five lists in the first cannot be removed ;
		/*obj:{	pos:rgId
				rId:
				aId:
				auId:
				cd:,
				In?://is embedded reply; value: 1 ||-1 ;Array $pop; 
				}
				*/
		const time=new Date(obj.cd);
		const replysQuery={
			aId:obj.aId,
			rId:obj.rId
		}
		const reply2Query={
			aId:obj.aId,
			rId:obj.rId,
			cd:time
		}
		if(obj.In){
			replys[obj.pos].findOneAndUpdate(
				replysQuery,
				{$inc:{'rCache.cs':-1},$pop:{'rCache.mbs':obj.In}},
				{select:{'rCache.cs':1}},
				(err,data)=>{
					if(err)return cb(true,null);
					if(data.rCache.cs>2){
						reply2Colle.collection.findOneAndDelete(
							{aId:mongoose.Types.ObjectId(obj.aId),rId:obj.rId},
							{sort:{cd:1},projection:{_id:0}},
							(err,data)=>{
								if(err)return cb(true,null);
								replys[obj.pos].update(
									replysQuery,
									{$push:{'rCache.mbs':data.value}},
									cb
								)
							}
						)
					}else{cb(null,true)}
				})
		}else{
			reply2Colle.remove(reply2Query,(err,data)=>{
				replys[obj.pos].update(
					replysQuery,
					{$inc:{'rCache.cs':-1}},
					cb
				)
			})
		}			
	}
	methods.removeAllReply2=(obj,cb)=>{
		/*
		pos:rgId
		rId:
		aId:
		*/
		const query={
			aId:obj.aId,
			rId:obj.rId
		}
		reply2Colle.remove(query,(err)=>{
			if(err)return cb(err,null);
			replys[obj.pos].update(query,{$set:{'rCache':{mbs:[],cs:0}}},cb)
		})

	}

	return methods;
}