const {imgMaxSize,headerPath} =require('./common.js');
const genImg=require('./genImg.js');
const fs=require('fs');
model.exports=async(ctx)=>{
		console.log(11)
		let imgPath=headerPath+genImg();
		let ws=fs.createWriteStream(imgPath);
		let size=0;
		return await new Promise(resolve=>{
			ctx.req.on('data',(chunk)=>{
				size+=chunk.length;
				if(size>imgMaxSize){
					ctx.req.unpipe(ws);
					fs.unlink(imgPath,()=>{});
					resolve(false);
					}
			})
			ctx.req.on('error',()=>{
				resolve(false);
				ctx.req.destroy();
				ws.destroy();
			})
			ws.on('finish',()=>{
				resolve(imgPath);
			})
			ctx.req.pipe(ws);
		})
}