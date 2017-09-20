module.exports=function(mainColle,articles,mainObj){
	const methods={};
	const platesPj={t:1,'au.n':1,cd:1,lrd:1,rps:1,rds:1,__v:1,_id:1,s:1,v2:1,or:1}
	methods.viewPlateBrief=(rgId,needImgs,cb)=>{
		const pj={_id:0};
			needImgs?(pj.brief=1):(pj['brief.c']=1);
			mainColle.findOne({rgId:rgId},pj,(err,data)=>{
				cb(data);
			})
	}
	methods.getRecommend=(rgId,cb)=>{
		try{
		let lists=mainObj.rcs[rgId];
		if(!lists||!lists.length)return cb(null,'empty');
		articles[rgId].find({_id:{$in:lists}},platesPj,cb)
		}catch(e){cb(true,null)}
	}
	methods.addonPlates=(addon,rgId,bf,cb)=>{
		try{
			const next=()=>{
				methods.getRecommend(rgId,(err,data)=>{
					addon.rc=data;
					cb(err,addon);
				})
			}
			if(bf){
				methods.viewPlateBrief(rgId,false,(data)=>{
					addon.brief=data.brief;
					next();
				})
			}else{next();}
		}catch(e){cb(true,null)};
	}
	return methods;
}