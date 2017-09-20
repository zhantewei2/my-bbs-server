let mongo=require('./mongodb/main.js');
let test=mongo.testColle;
let mongoose=require('mongoose');
let Schema=mongoose.Schema;

let main=mongo.main;

//new test({id:Schema.Types.ObjectId,age:112}).save(err=>console.log(err))




main.initMain().then(()=>{
	const plates=main.plates;
	console.log(main.mainObj)

	//main.addRg(1,'A');
}).catch(e=>{
	console.log(e)
})