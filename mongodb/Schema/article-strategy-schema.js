module.exports=function(Schema){
	const defaultSchema=new Schema({
		aId:Schema.Types.ObjectId,  //articleId;
		uId:String //user Id;
	},{autoIndex:!PROD_ENV})
	//hasVoteSchema=default;
	//hasPaySchema=default;
	//hasReplySchema=default;
	defaultSchema.index({aId:1,uId:1},{unique:true});
	return defaultSchema;
}
