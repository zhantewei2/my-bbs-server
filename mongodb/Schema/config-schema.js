module.exports=function(mongoose){
	const Schema=mongoose.Schema;
	return new Schema({
		_id:String, //strategy name
		value:{},
		v:Date,
		v0:Date
	})
}