let getEp=()=>config.strategy.ep;

module.exports=function(schema,stg){
	schema.statics.addExp=function(userId,method,cb){
		//upgrade judge throw to client ,we don't have to judge every time;
		const epStg=getEp();
		const incObj={'ep.now':epStg[method].ep,'ep.g':epStg[method].g};
		method=='publish'?incObj['st.a']=1:incObj['st.r']=1;
		this.update({_id:userId},{$inc:incObj},cb);
	}
	schema.statics.gold=function(userId,coins,cb){
		const query={_id:userId};
		if(coins>0){
			this.update(query,{$inc:{'ep.g':coins}},cb);
		}else{
		this.findOneAndUpdate(
			{_id:userId},
			{$inc:{'ep.g':coins}},
			{select:{'ep.g':1,'_id':0},new:true},
			(err,data)=>{
				if(err)return cb(true,null);
				if(data.ep.g<0){
					this.update({_id:userId},{$inc:{'ep.g':0-coins}},(err)=>cb(true,null))
				}else{cb(null,true)}
			});
		}
	}
	/*
	schema.statics.redExp=function(uesrId,exp,cb){
		this.update({_id:userId},{$inc:{'ep.now':exp}},cb);
	}
	*/
	schema.statics.upgrade=function(userId,cb){
		const query={_id:userId};
		this.findOne(query,{_id:0,level:1,ep:1},(err,data)=>{
			const epStg=getEp();
			const epArr=epStg.epArr,maxLevel=epStg.maxLevel;
			let level=data.level,
				now=data.ep.now,
				disEp=now-epArr[level-1];
			if(disEp<0||level>=maxLevel){
				cb(true,null);
			}else{
				this.update(
					query,
					{
						$set:{'ep.now':disEp},
						$inc:{level:1}
					},
					cb
				)
			}
		})
	}

	return schema;
}