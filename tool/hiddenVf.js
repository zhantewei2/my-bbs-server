let crypto=require('crypto');
let encrypt=function(value,key){
	let cipher=crypto.createCipher('aes192',key);
	cipher.update(value,'utf8','hex');
	return cipher.final('hex');
}
let decrypt=function(value,key){
	let deCipher=crypto.createDecipher('aes192',key);
	deCipher.update(value,'hex','utf8');
	return deCipher.final('utf8')
}
module.exports=function(opts,app){
	/*
		opts:{key:key,maxAge:times,path:path}
	*/
	const addCall='cookies';//Symbol('addCall');
	app.context.ztw;
	Object.defineProperties(app.context,{
		vf:{
			set:function(val){
				let opts2={signed:false};
				if(opts.path)opts2.path=opts.path;
				if(val==null){
					opts2.expirts=new Date();
					return this[addCall].set('1k','',opts2);
				}
				const val2=encrypt(val.toString(),opts.key);
				opts2.maxAge=opts.maxAge;
				this[addCall].set('1k',val2,opts2);
			},
			get:function(){
				let result=this[addCall].get('1k');
				if(!result) return null;
				return decrypt(result,opts.key);
			}
		}
	})
};