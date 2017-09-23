//global variable:
config={method:{},strategy:{},adminStg:{}};
const arg=process.argv.slice(2);
PROD_ENV=arg[0]==='prod';
console.log('\x1b[33m myBBSServer is run in ',PROD_ENV?'production models!':'development models!','\x1b[0m')

const koa=require('koa'),
	app=new koa(),
	bodyParser=require('koa-bodyparser'),
	session=require('koa-session'),
	convert=require('koa-convert'),
	Router=require('koa-router'),
	staticCache=require('koa-static-cache'),
	static=require('koa-static'),
	mount=require('koa-mount');
const tools=require('./tool/common.js');
const sendGzip=require('./util/ztw-static-gzip.js');
tools.useArrayAsyncForEach();
const
	myMongo=require('./mongodb/main.js'),
	RootRouter=require('./router/main.js'),
	myKey=require('./appkey.js'),
	filterObj=require('./tool/filterObj.js'),
	hook=require('./hook/hook.js'); 

app.keys=[myKey.cookieKey];

myMongo.main.initMain().then(mainObj=>{

	console.log('init')
	hook(mainObj);
	app.use(bodyParser());
	app.use(filterObj(app));
	if(!PROD_ENV){
		app.use(async(ctx,next)=>{
			//if(ctx.method=='OPTIONS')return ctx.status=202;

			ctx.set('Access-Control-Allow-Origin','http://155.155.1.101:4200');
			ctx.set('Access-Control-Allow-Method','POST,GET,PUT,DELETE');
			ctx.set('Access-Control-Allow-Headers','Content-Type');
			ctx.set('Access-COntrol-Allow-Credentials','true');
			await next();
		})
	}
	app.use(session({
		key:'myKey'
	},app))

	try{
		RootRouter(app,Router,myMongo);
	}catch(e){
		console.log(e)
	}
	app.use(mount('/gzip-static',sendGzip('gzip-static')))
	
	app.use(mount('/static',staticCache('static',{
		maxAge:60*60*24*7
	})));
	app.use(sendGzip('angular'));
	app.use(async(ctx,next)=>{
		ctx.body='error';
	});
	app.listen(!PROD_ENV?3001:80);	
	
})
