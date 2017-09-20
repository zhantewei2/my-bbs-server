let uniqueNum=function(){
	let date=new Date().getTime();
	if(date<=uniqueNum.previouse){
		date=++uniqueNum.previouse;
	}else{
		uniqueNum.previouse=date;
	}
	return date;
}
uniqueNum.previouse=0;

let returnCallBack=(method,...args)=>{
	return new Promise(resolve=>{
		method(...args,(...args2)=>{resolve(args2)})
	})
}
let clearObj=(obj)=>{
	for(let i in obj){
		delete obj[i];
	}
}

/*

let converUserList={
	nickN:'info.nickN',
	name:'info.name',
	pswd:'info.pswd',
	ep:'ep.now',
	needEp:'ep.n',
	ntfs:'msnN.totalMsn',
	ntfn:'msnN.new'
}

*/


exports.useArrayAsyncForEach=()=>{
	Array.prototype.asyncForEach=function(fn,endFn){
		this.length?fn(this[0],()=>{this.slice(1).asyncForEach(fn,endFn)}):endFn();
	}
}
exports.defaultCoverImg='default/cover.jpg';
exports.reply2CacheNum=2;
exports.returnCallBack=returnCallBack;
exports.pageSize=12;
exports.replyPs=10;
exports.reply2Ps=5;
exports.uniqueNum=uniqueNum;
exports.headerPath='static/header/';
exports.storeVotes=-10;
exports.ntPgSize=10;
exports.recommandACount=6;
exports.imgMaxSize=500000; //(bytes)
exports.hookRestoreInterval=5;