
const files=[0,1,2,3,4,5,6,7,8,9,10,11];
const fs=require('fs');
const common=require('./common.js');
const uniqueNum=common.uniqueNum;
const headerPath=common.headerPath;
const genDir=function(path){

	return new Promise(resolve=>{
		fs.mkdir(path,()=>{
			files.asyncForEach(
				(v,next)=>{
					fs.mkdir(path+v,next);
				},
				()=>{resolve()}
			)	
		})
	})
}
module.exports=function(){
	const date=new Date(),
		y=date.getFullYear(),
		m=date.getMonth(),
		name=uniqueNum()+'.jpg',
		prefix=y+'/'+m+'/',
		reltPath=y+'/'+m+'/'+name;
	return new Promise(resolve=>{
		fs.access(headerPath+prefix,(err)=>{
			if(err){
				genDir(headerPath+y+'/').then(()=>{resolve(reltPath)})
			}else{
				resolve(reltPath);
			}
		})
	})
}