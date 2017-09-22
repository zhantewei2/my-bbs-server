PROD_ENV=false;
config={method:{},strategy:{},adminStg:{}};
let mongo=require('./mongodb/main.js');
let test=mongo.testColle;
let mongoose=require('mongoose');
let Schema=mongoose.Schema;

let main=mongo.main;

//new test({id:Schema.Types.ObjectId,age:112}).save(err=>console.log(err))
/*
		{
				cgId:
				rgId:
				aId: plateId
				c:content,
				uId:
				auName:
				back:boolean=false;
				tId?: to userAccountName
			}
*/

main.initMain().then(()=>{
	const plates=main.plates;

	let len=20000; 
	const run=async ()=>{
		while(len--){
			await new Promise(resolve=>{
				plates.newReply({
					cgId:'6',
					rgId:'r13',
					aId:'59c4e9274a3f0607500a4a05',
					uId:'zhantewei',
					auName:'zhantewei',
					c:'content1'
				},(err,data)=>{
					resolve(err);	
				})
			})
		}
		console.log('end')
	}
	run();

	//main.addRg(1,'A');
})