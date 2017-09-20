const mongoose=require('mongoose');
mongoose.connect('mongodb://localhost:27017/test');
const schemas=require('./Schema/schema.js')(mongoose);
const configSchema=require('./Schema/config-schema')(mongoose);
let configModel=mongoose.model('configs',configSchema);
schemas.userSchema.statics.login=function(params){
	return this.findOne(
		params,
		{_id:1,ntf:1,'head.name':1,ep:1,level:1,'info.nickN':1,type:1});
}

const userSchema=require('./Schema/user-schema-method.js')(schemas.userSchema)
let reply2Model=mongoose.model('reply2s',schemas.reply2Schema);
let mainModel=mongoose.model('mains',schemas.mainSchema);
let userModel=mongoose.model('users',userSchema);
let voteModel=mongoose.model('votes',schemas.voteSchema);

//addon strategy model:
let aVoteModel=mongoose.model('aVotes',schemas.defaultSchema);
let aPayModel=mongoose.model('aPays',schemas.defaultSchema);
let aReplyModel=mongoose.model('aReplys',schemas.defaultSchema)
exports.aVoteColle;
exports.aPayColle;
exports.aReplyColle;
//...addon
let testModel=mongoose.model('tests',new mongoose.Schema({name:String,id:mongoose.Schema.Types.ObjectId,age:Number}));
exports.testColle=testModel;
/*
let InitMain=()=>{
	return new Promise(resolve=>{
	mainModel.find({},(err,v)=>{
		if(v.length==0){
			new mainModel({
				categorys:['default'],
				regions:[
					{
						name:'secondary-region',
						_id:1,
						category:'default'
					},{
						name:'primary-region',
						_id:2,
						category:'default'
					},
					{
						name:'info-region',
						_id:3,
						category:'default'

					},
					{
						name:'success-region',
						_id:4,
						category:'default'
					}
				]
			}).save((err)=>console.log(err));
		}
	})
	})	
}
// init main:
*/
//InitMain();
let Main=require('./main-manage.js');

let main=new Main(
	schemas.plateSchema,
	schemas.replySchema,
	schemas.ntfSchema,
	mongoose,
	mainModel,
	userModel,
	reply2Model,
	aVoteModel,
	aPayModel,
	aReplyModel,
	configModel
	);
exports.reply2Colle=reply2Model;
exports.testColle=testModel;
exports.voteMethod=new (require('./vote-method'))(main,voteModel);
exports.ntfColle=main.ntfModel;
exports.main=main;
exports.userColle=userModel;
exports.mainColle=mainModel;