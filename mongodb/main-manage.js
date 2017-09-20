const common=require('../tool/common.js');
common.useArrayAsyncForEach();

const plateName=(id)=>{
	return 's'+id+'s';
}
const replyName=(id)=>{
	return 'r'+id+'s';
}
/*
	mainObj:{
		cgs:
		models:
		rcs: recommend 
	}
	rgObj=mainObj['cgs'][cgId]['rgs'][rgId];
	rgObj:{
		id:
		name:
		order:
		todayA:
		totalA:
		todayAc:
	}

*/
module.exports=function(schema,replySchema,ntfSchema,mongoose,mainColle,userColle,reply2Colle,aVote,aPay,aReply,configColle){

	let names=[];
	let models={};
	let replys={};
	let cgId=0;
	let rgId=0;
	let mainObj={cgs:{},sysV:0,rcs:{}}; //category count ,system notification version; 
	//append schema method:
	ntfSchema=require('./Schema/notification-schema-method.js')(ntfSchema,mainObj,mainColle,userColle);
	let ntfModel=mongoose.model('ntfs',ntfSchema);
	let plates=require('./plate-method.js')(mainObj,models,replys,mainColle,userColle,reply2Colle,ntfModel,aVote,aPay,aReply);
	let defaultConfig=require('../router/config/defualt-config.js')(configColle);//.then(v=>console.log('config:',v));

	let initRg=(rgName,cgId,rgId,order,cover,rc=[],obj={})=>{
		replys[rgId]=mongoose.model(replyName(rgId),replySchema);
		let cgObj=mainObj['cgs'][cgId];
		let rgObj=Object.assign({
			id:rgId,
			name:rgName,
			order:order,
			todayA:0,
			totalA:0,
			todayAc:0,
			cover:cover
		},obj);
		cgObj['rgSize']++;
		cgObj['rgs'][rgId]=rgObj;
		mainObj.rcs[rgId]=rc;
	};
	let initCg=(cgName,cgId)=>{
		mainObj['cgs'][cgId]={
			rgSize:0,
			name:cgName,
			id:cgId,
			rgs:{}
		}
	}
	this.mainObj=mainObj;
	let getArticle=(rgId)=>{

		return new Promise(resolve=>{
			if(!models[rgId])models[rgId]=mongoose.model(plateName(rgId),schema);
			let obj={}
			models[rgId].count({}).then(num=>{
				obj['totalA']=num;
				let data=new Date()
				let dateStart=new Date(data.getFullYear(),data.getMonth(),data.getDate(),0,0);
				models[rgId].count({cd:{$gt:dateStart}}).then(num=>{
					obj['todayA']=num;
					models[rgId].count({lrd:{$gt:dateStart}}).then(num=>{
						obj['todayAc']=num;
						resolve(obj);
					})
				})
			})
		})
	}
	this.initMain=()=>{
		return new Promise(resolve=>{
		mainColle.findOne(
			{cgs:{$exists:true}}
		).then(result=>{
			//init plate:
			if(!result){
				mainColle.create({cgs:[],rgIds:0,cgIds:0,ntf:{sysV:0}}).then(v=>{
					resolve(mainObj);
				})
			}else if(result.cgs.length>0){
				//init mainObj.cgs:
				let nowCgId=null,
					cgs=result.cgs;
				//init notification of system version:
				mainObj.sysV=result.ntf.sysV;
				let	everyRg=(rgObj,next)=>{
						let rgId=rgObj.rgId,
							rgName=rgObj.rgName,
							order=rgObj.order,
							rc=rgObj.rc, //recommand artilce list;
							cover=rgObj.cover
						getArticle(rgId).then(data=>{
							initRg(rgName,nowCgId,rgId,order,cover,rc,data);
							next();
						})
					};
		
				let endCg=()=>{resolve(mainObj)},
					everyCg=(cgObj,next)=>{
						nowCgId=cgObj.id,cgName=cgObj.name;

						initCg(cgName,nowCgId);

						mainColle.find({rgCg:cgObj.id},{_id:0}).sort({order:1}).then(v=>{
							if(!v||!v.length){
								next();
							}else{
								v.asyncForEach(everyRg,next);
							}
						})
					};
				cgs.asyncForEach(everyCg,endCg);
			}else{resolve(mainObj)}
		})
		})
	}
	/* mainObj={ 
			//cgId:number,
			//rgId:number,
			cgs:{cgId:object<cgObj>},
			};
	cgObj={ rgSize:number,rgs:{rgId:object<regionObj>},name:String,id:NumberId}
	/* regionObj= { 
		name:String,
		id:number Id,
		order:number , order to sort and change order;
		todayAc:number, today Active Article;
 		todayA:number, todayArticle
		totalA:number, totalArticle
		}  
	*/
	//initMain:
	
	this.addCg=(cgName)=>{
		return new Promise(resolve=>{

		mainColle.findOne({'cgs.name':cgName},{_id:1}).then(v=>{
			if(v)return resolve(false);
			//let newId=++mainObj.cgId;
			mainColle.findOneAndUpdate(
				{cgs:{$exists:true}},
				{$inc:{cgIds:1}},
				{
					new:true,
					select:{cgIds:1,_id:0}
				}
				).then(result=>{
					if(!result)return resolve(false);
					let cgId=result.cgIds;
					mainColle.update(
						{cgs:{$exists:true}},
						{$push:{cgs:{name:cgName,id:cgId}}}
					).then(result=>{
						initCg(cgName,cgId);
						resolve({id:cgId});
					})
			})
		})
		})
	}
	this.addRg=(cgId,rgName)=>{
		return new Promise(resolve=>{
			mainColle.findOne({rgName:rgName},{_id:1}).then(v=>{
				if(v)return resolve(false);
				//let newId=++mainObj.rgId;
				mainColle.findOneAndUpdate(
					{cgs:{$exists:true}},
					{$inc:{rgIds:1}},
					{new:true,select:{rgIds:1,_id:0}}
				).then(result=>{
					if(!result)return resolve(false);
					const order=result.rgIds,
					newId='r'+order;
					models[newId]=mongoose.model(plateName(newId),schema);
					//initRg:
					const cover={img:common.defaultCoverImg,c:''};
					new mainColle({
					rgId:newId,
					rgName:rgName,
					rgCg:cgId,
					order:order,
					cover:cover
					}).save((err,doc)=>{
						initRg(rgName,cgId,newId,order,cover);
						resolve(err?null:{id:newId});
					})
				})
				
			})
		})
	}
	this.removeRg=(cgId,rgId,removeCg)=>{
		return new Promise((resolve,reject)=>{
			try{		
				mainColle.remove({rgId:rgId}).then(v=>{
					if(!v.result.n)return resolve(false);
					models[rgId].collection.drop(()=>{
						delete models[rgId];
						if(!removeCg){
							let cgObj=mainObj['cgs'][cgId];
							delete cgObj['rgs'][rgId];
							cgObj.rgSize--;
						}
						replys[rgId].collection.drop(()=>{
							delete replys[rgId];
							reply2Colle.remove({pos:rgId},()=>{
								resolve(true);
							})
						})
					})
				})
			}catch(e){reject(e)}
		})
	}
	this.removeCg=(cgId)=>{
		return new Promise(resolve=>{
			try{
				mainColle.update({cgs:{$exists:true}},{$pull:{cgs: {id:cgId}  }}).then(v=>{
					if(!v.nModified)return resolve(false);
					mainColle.find({rgCg:cgId},{_id:0}).then(rgs=>{
						rgs.asyncForEach(
							(v,next)=>{
								this.removeRg(cgId,v.rgId,true).then(next).catch(e=>{throw e});
							},
							()=>{
								delete mainObj['cgs'][cgId];
								resolve(true);
							}
						);
					})
				})
			}catch(e){console.log(e);resolve(false)}
		})
	}
	this.sortRg=(cgId)=>{
		let rgsObj=mainObj['cgs'][cgId]['rgs'];
		let keys=Object.keys(rgsObj);
		let obj2=Object.assign({},rgsObj);
		for(let i in rgsObj){
			delete rgsObj[i];
		}
		for(let i=0,len=keys.length;i<len;i++){
			let j=i;
			while(j>0&&obj2[keys[j]].order<obj2[keys[j-1]].order){
				let temp=keys[j];
				keys[j]=keys[j-1];
				keys[j-1]=temp;
				j--;
			}
		}
		console.log(keys,rgsObj);
		keys.forEach(v=>{
			rgsObj[v]=obj2[v];
		})
		console.log(rgsObj);
	}
	this.getRg=(cgId,rgId)=>mainObj['cgs'][cgId]['rgs'][rgId];
	this.models=models; //rgs
	this.replys=replys;
	this.plates=plates;
	this.ntfModel=ntfModel;
}