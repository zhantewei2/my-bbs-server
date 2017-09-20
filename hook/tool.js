exports.nextDayTime=function(){
	const now=new Date();
	const pureNow=new Date(`${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`);
	pureNow.setDate(now.getDate()+1);
	return pureNow.getTime()-now.getTime();
}