const {imgMaxSize,headerPath} =require('./common.js');
const genImg=require('./genImg.js');
const fs=require('fs');
exports.storeImg=async(ctx,maxSize=imgMaxSize)=>{
		let imgName=await genImg();
		let imgPath=headerPath+imgName;
		let ws=fs.createWriteStream(imgPath);
		let size=0;
		return await new Promise(resolve=>{
			ctx.req.on('data',(chunk)=>{
				size+=chunk.length;
				if(size>maxSize){
					ctx.req.unpipe(ws);
					fs.unlink(imgPath,()=>{});
					resolve('over');
					}
			})
			ctx.req.on('error',()=>{
				resolve(null);
				ctx.req.destroy();
				ws.destroy();
			})
			ws.on('finish',()=>{
				resolve(imgName);
			})
			ctx.req.pipe(ws);
		})
}
exports.delImg=(path,cb)=>{
	fs.unlink(headerPath+path,cb);
}