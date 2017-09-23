const refreshArticleCount=require('./refresh-article-count.js');
const {nextDayTime}=require('./tool.js');
const {hookRestoreInterval} =require('../tool/common.js');

module.exports=function(mainObj){
	const 
	now=new Date(),
	perTime=1000*60*60*24,
	compareTime=1000*60*60*12,
	run=()=>{
		refreshArticleCount(mainObj);
	};
	let check,reCheck,interval,rTime,restoreCount=0;
	check=(time)=>{
		setTimeout(()=>{
			run();
			reCheck();
			interval=setInterval(()=>run(),perTime);
		},time)
	}
	reCheck=()=>{
		if(restoreCount==hookRestoreInterval){
			restoreCount=0;
			clearInterval(interval);
			rTime=nextDayTime();
			rTime=rTime>compareTime?rTime:rTime+perTime;
			check(rTime);
		}
		restoreCount++;
	}
	check(nextDayTime()||1);
}