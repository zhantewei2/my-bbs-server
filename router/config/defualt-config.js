const fs=require('fs');
const zlib=require('zlib');
const userStgOriginal='router/config/init-config/strategy.js';
const userStrategy=JSON.parse(fs.readFileSync(userStgOriginal,'utf8'));
module.exports=function(configColle){
	//publish strategy:
	const url='gzip-static/';
	const userStrategyPath=url+'strategy.json';
	const userQuery={_id:'userStrategy'};
	//user modify total=true;
	const writeConfigFile=(strategyValue,total,mtime0)=>{
		return new Promise((resolve,reject)=>{
			const json=JSON.stringify(strategyValue)
			zlib.gzip(json,(err,buffer)=>{
				fs.writeFile(userStrategyPath,buffer,(err)=>{
					let next=(m0)=>{
						fs.stat(userStrategyPath,(err,stats)=>{
							let data={
								value:strategyValue,
								v:new Date(stats.mtime)
								};
							if(m0)data.v0=m0;
							if(mtime0)data.v0=mtime0;	
							configColle.update(userQuery,{$set:data},{upsert:true},(err,data)=>{
								console.log('has chenge strategy.json!');
								resolve(!err);
							})	
						})
					}
					if(total){
						fs.writeFile(userStgOriginal,json,'utf8',()=>{
							fs.stat(userStgOriginal,(err,stats0)=>{
								next(stats0.mtime);
							})
						})
					}else{next()}
				})
			})
		})
	};
	const run=()=>{
		return new Promise(resolve=>{
			configColle.findOne(userQuery).then(v=>{
				if(v&&v.value)Object.assign(config.strategy,v.value);
				fs.stat(userStrategyPath,(err,stats)=>{
					fs.stat(userStgOriginal,(err,stats0)=>{
						const mv=v&&Date.parse(v.v);
						const mv0=v&&Date.parse(v.v0);
						const m0=stats0&&Date.parse(stats0.mtime);
						let opts,isNext,mtime0;
						if(!v){
							Object.assign(config.strategy,userStrategy);
							isNext=m0;
						}else{
							if(!m0||mv0>m0){
								opts=true;
								isNext=true;
							}else if((!mv0&&m0)||mv0<m0){
								Object.assign(config.strategy,userStrategy);
								isNext=true;
								mtime0=m0;
							}
							if(!stats||mv!=Date.parse(stats.mtime)){
								isNext=true;
							}
						}
						isNext?writeConfigFile(config.strategy,opts,mtime0).then(pass=>resolve(pass)):resolve(true);
					})
				})
			})
		})
	}
	config.method.modify=(key,valueObj)=>{
		/*
			key=publish; valueObj={useVote:3};
		*/
		Object.assign(config.strategy[key],valueObj);
		return writeConfigFile(config.strategy,true);
	}
	return run().then(v=>config);
}