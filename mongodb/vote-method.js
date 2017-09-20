const storeVotes=require('../tool/common').storeVotes;
/*
voteQuery:
	article:articleId
	reply:articleId+'_'+replyId;
*/
/* Obj:
			aId:
			rId?:
			rgId:
			userId:
			//v:voteQuery,
			b:sup||op;
		*/
module.exports=function(main,voteColle){
		this.vote=(id,obj,cb)=>{ 
			let b=obj.b,
				select=obj,
				query={_id:id},
				aId=obj.aId,
				rId=obj.rId,
				inc;
			const val=rId?aId+'_'+rId:aId;	
			if(b=='sup'){
				query={_id:id,sup:val}
				inc={sup:1};
			}else if(b=='op'){
				query={_id:id,op:val};
				inc={op:1};
			}else{
				return cb(false,null);
			}	
			query[b]=val;
			voteColle.findOne(query,{_id:1},(err,data)=>{
				if(data) return cb(null,'exist');
				let pushObj={};
				pushObj[b]={$each:[val],$slice:storeVotes};
				voteColle.update(
					{_id:id},
					{$push:pushObj},
					{upsert:true},
					(err,data)=>{
						if(err)return cb(false,null);
						if(rId){
							main.replys[obj.rgId].update({aId:aId,rId:rId},{$inc:inc},cb)
						}else{
							main.models[obj.rgId].update({_id:aId},{$inc:inc},cb)
						}
					})
			})
		}
}