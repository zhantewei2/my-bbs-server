exports.isEmptyObj=function(obj){
	for(let i in obj){
		return false;
	}
	return true;
}