module.exports=function(mainObj){
	let cg,rg;
	for(let cgKey in mainObj.cgs){
		cg=mainObj.cgs[cgKey];
		for(let rgKey in cg.rgs){
			rg=cg.rgs[rgKey];
			rg.todayA=0;
			rg.todayAc=0;
		}
	}
}