const aPageSize=10;
module.exports=function(Router,myMongo){
    const router=new Router();
    const users=myMongo.userColle;
    const main=myMongo.main;
    const models=main.models;
    router.use('',async(ctx,next)=>{
    	ctx.set('Cache-Control','max-age=3600')
    	await next();
    })
    router.get('/msn',async(ctx)=>{
    	/*
        i: user._id;
        p?: get part msn;
    	*/
    	try{
    		const id=decodeURIComponent(ctx.query.i);
            const pj=ctx.query.p?{'info.email':1,st:1,_id:0}:{ntf:0,'info.pswd':0,_id:0};
    		ctx.body=await users.findOne({_id:id},pj);
    	}catch(e){}
    });
    router.get('/articles',async(ctx)=>{
    	/*
    		needC:need totals count;
    		uI:userId;
    		rg:rgId
    		t:cd (default)|| lrd
    		dr: direction : null || next || pre ||end;
    		sort?:default null sort by cd ? sort by lrd;
    	*/

    	try{
    		const obj=ctx.query,model=models[obj.rg];
    		let id=obj.uI,
    			t=obj.t,
    			dr=obj.dr,
    			pj={c:0,op:0,sup:0,lrd:0}; 
    		ctx.body=await new Promise(resolve=>{

    			const next=(count)=>{
    				let query;
    				if(!dr){
    					model.find({'au.id':id},pj).sort({cd:-1}).limit(aPageSize).exec((err,v)=>{resolve(count?{d:v,c:count}:{d:v})});
    				}else if(dr=='next'){
    					model.find({'au.id':id,cd:{$lt:t}},pj).sort({cd:-1}).limit(aPageSize).exec((err,v)=>{resolve({d:v})});
    				}else if(dr=='pre'){
                        t=new Date(t);
    					model.find({'au.id':id,cd:{$gt:t}},pj).sort({cd:1}).limit(aPageSize).exec((err,v)=>resolve({d:v}));
    					
    				}else{
    					const next2=(count)=>{
    						let limit=Math.ceil(count%aPageSize)||aPageSize;
    						model.find({'au.id':id},pj).sort({cd:1}).limit(limit).exec((err,v)=>resolve({d:v,c:count}));
    					}
    					!count?model.count({'au.id':id}).then(count=>next2(count)):next(count);
    				}
    			};
    			if(obj.needC){
    				model.count({'au.id':id},(err,data)=>{
    					next(data);
    				})
    			}else{next()}
    		})
    	}catch(e){}

    })
    return router;
};