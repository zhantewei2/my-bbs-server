let isEmptyObj=require('../util/Object.js').isEmptyObj;


module.exports=function(app){
	return async(ctx,next)=>{
		ctx.filterObj=(opts,callback)=>{
			return new Promise(resolve=>{
				let j1,obj=ctx.request.body;
				if(opts.useVf)j1=!obj.vf||ctx.vf!==obj.vf;
				if(typeof obj!='object'||isEmptyObj(obj)||j1)return resolve(null);
				callback(obj,resolve);
			})
		};
		await next();
	}
}