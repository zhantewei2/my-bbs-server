module.exports=function(mongoose){
	const Schema=mongoose.Schema;
	let container={};

	//hasVote:

	container.defaultSchema=require('./article-strategy-schema.js')(Schema);
	
	//reply2:
	container.reply2Schema=new Schema({
		auId:Schema.Types.Mixed,  //user._id
		auName:String,
		c:String, //content
		rId:Number,   //reply1 ID;
		aId:Schema.Types.ObjectId, //ancestor id ; PlateId; 
		pos:String, //reply Collection position rgId;removeRG need;
		cd:{type:Date,default:new Date()}
	},{autoIndex:!PROD_ENV});
	//index:
	container.reply2Schema.index({aId:1,rId:1,cd:1})

	container.replySchema=new Schema({
		rId:Number,   //auto sort id;
		auId:Schema.Types.Mixed ,//user._id
		fb:{type:Boolean}, //forbid;
		c:String, //content
		sup:{type:Number,default:0}, //support Number;
		op:{type:Number,default:0}, //oppose Number;
		cd:{type:Date,default:new Date().toJSON()}, //createDate;
		md:Date, //modifyDate;
		aId:Schema.Types.ObjectId, //article id
		rCache:{
			cs:{type:Number,default:0},  //reply2 count
			mbs:[] //reply2 members limit5.
		}
	},{autoIndex:!PROD_ENV})
	//index:
	container.reply2Schema.index({rId:1,aId:1})

	container.plateSchema=new Schema({
		t:String, //title 
		c:String, //content
		v2:Number,
		c2:String,
		s:String, //start
		au:{
			n:String,			  //user.info.nickN
			id:Schema.Types.Mixed //user._id, 
		},
		//addon msn
		or:{	
			lrn:String, //last reply user nickN;
			rc:Boolean //isRecommand;
		},
		sup:{type:Number,default:0}, //support Number;
		op:{type:Number,default:0}, //oppose Number;
		md:String, //ModifyDate;
		cd:{type:Date,default:new Date()}, //createDate;
		lrd:{type:Date,default:new Date()}, // last reply Date; 
		rps:{type:Number,default:0}, //reply count;
		rds:{type:Number,default:0}, //read count;
		__v:{type:Number,default:0},  //version number integer
		stg:{
			fb:Boolean,
			rv:Boolean,  //replyView
			p:{}, 
			/*
		 	pay:{
				t:user totals,
			 	g:gold,
			 	}
			*/
			v:{} 
			//storage vote msn; 
			/*
			vote:{
				t:user totals,
				n:vote theme name;
				v:vote value:
					{itemName:c,ItemName2:c2,....};
				}
			*/
		}
	},{autoIndex:!PROD_ENV});
	//index:
	container.plateSchema.index({lrd:1})
	container.plateSchema.index({'au.id':1,cd:1})

	container.userSchema=new Schema({
		_id:String,
		type:String,//'manager' ||'admin';
		info:{
			//name:{type:String,unique:true},
			pswd:String,
			email:String,
			nickN:{type:String,unique:true}
		}, //{ name , pswd, email};
		level:{type:Number,default:1},
		ntf:{
			self:{type:Number,default:0}, //private notification count
			sysV:Number  //system ntf version for self 
		},
		ep:{
			now:{type:Number,default:0},
			g:{type:Number,default:0}
				//g:gold
		}, 		// {n:number needEp,now:number nowEp};
		head:{
			name:{type:String,default:'_1.jpg'},
			custom:{type:Boolean,default:false}
			},   //head img url;
		st:{
			a:{tpye:Number,default:0},
			r:{type:Number,default:0},
			b:{type:Date,default:new Date()} //birthDay
		},	
		
		fb:{type:Boolean,default:false} //forbid;
	},{autoIndex:!PROD_ENV})
	//index:
	container.mainSchema=new Schema({
		//recombination collection:
		/*
			collection main;	
		*/
		rgIds:Number,//auto generate rgsObj id;
		cgIds:Number,//  //auto generate cgsObj id;  
		//rgSize:Number, // rg total size.
		cgs:Schema.Types.Mixed, // Array <cg>  cg: {name: .. id: .. };
		ntf:{sysV:Number},
		/*
			regions collection:
		*/
		regions:String,
		rgId:String, // rg Id.
		rgName:String, //regionName;
		rgCg:Number, //relate cgId.
		order:Number,
		rc:Schema.Types.Mixed,  //recommend list:Array<aId>;
		brief:Schema.Types.Mixed,//{c:String,imgs:Array},
		imgs:Array,
		cover:Schema.Types.Mixed //{c:  , img: coverImg}
		//c:{type:Number,default:0}  //child count;
		/*
		region:
		{name:String,_id:Number,category:String}
		*/
	},{autoIndex:!PROD_ENV});
	container.ntfSchema=new Schema({
		//just return relative massage count;
		tId:String,
		p:{cg:Number,rg:String,now:Number},
		f:String, //f?
		thId:String,
		c:Number,
		ab:String, //abstract;
		cd:Date
	});
	container.ntfSchema.index({tId:1,cd:1});


	container.voteSchema=new Schema({
		_id:Schema.Types.Mixed,
		/*
			voteQuery:
				article:articleId
				reply:articleId+'_'+replyId;
		*/
		sup:[],//Array<voteQuery>
		op:[]//Array<voteQuery>
	},{autoIndex:!PROD_ENV});
	return container;
}