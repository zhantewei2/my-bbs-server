const ntPgSize=require('../../tool/common.js').ntPgSize;
module.exports=function(schema,mainObj,mainColle,userColle){
	schema.statics.public=function(msn,cb){
		this.create(
			{	type:'sys',
				c:{c:msn},
				__v:mainObj.sysV++
			},
			(err,data)=>{
				mainColle.update(
					{cgs:{$exists:true}},
					{$inc:{'ntf.sysV':1}},
					cb)
			})
	}
	schema.statics.reply=function(obj,cb){
		/*{
			tId:  ;
			thId: themeId: aId || aId+'_'rId;
			p:params;{cg:,rg:}
			f?:fragment;
		}
		*/
		let query={
			tId:obj.tId,
			thId:obj.thId
		};
		obj.cd=new Date();
		this.update(
			query,
			{
				$inc:{c:1},
				$set:obj
			},
			{upsert:true},
			(err,data)=>{
				if(err)return cb(err,null);
				userColle.update(
					{_id:obj.tId},
					{$inc:{'ntf.self':1}},
					cb)
			})
	}
	schema.statics.checkNtf=function(userId,cb){
		/*obj:{
			id:user account name	
		}
		*/
		this.findOne({_id:userId},{'ntf.self':1,_id:0},(err,data)=>{cb(err,data.ntf.self)})
	};
	schema.statics.getNtf=function(tId,cb){
		/*
		just return lasted 10 list;if be read,all will be remove;
		obj:{
			tId:auName,
			// s:startTime; now not need;
		}
		return -1:noexists
		 */
		const pj={_id:0,tId:0,__v:0};
		this.find({tId:tId},pj).sort({cd:-1}).limit(ntPgSize).exec((err,data)=>{
			if(!data)return cb(null,-1);
			this.collection.deleteMany(
				{tId:tId},
				{w:0},
				(err)=>userColle.update({_id:tId},{$set:{'ntf.self':0}},err=>cb(err,data))
				)
		});

	};

	return schema;
}