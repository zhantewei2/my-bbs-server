module.exports=function verify(){
	this.genVerify=()=>{
		let randomOne=()=>{
			return [random(48,57),random(65,90),random(97,122)][Math.floor(Math.random()*3)];
		}
		return String.fromCharCode(randomOne(),randomOne(),randomOne(),randomOne());
		function random(start,end){
			let len=end-start;
			return Math.round(Math.random()*len)+start;
		}
	};
	this.decrypt=(str,key)=>{
		let ring=(str.charCodeAt(4)-65).toString(2),
		len=4,
		i,
		i2,
		temp,
		str2='';
		while(len--){
			i=key.charCodeAt(3-len);
			i2=str.charCodeAt(len)-48;
			temp=ring[len+1]==='1'?i-i2:i+i2;
			str2+=String.fromCharCode(temp);
		}
		return str2;
	}
	this.encrypt=(str,key)=>{
		let len=4,
		tag='1',
		str2='',
		temp,
		i,i2;
		let totalSum=i,totalReduce=i;	
		while(len--){
			i=key.charCodeAt(len);
			i2=str.charCodeAt(len);
			temp=i-i2;
			tag+=temp>=0?'1':'0';
			str2+=String.fromCharCode(48+Math.abs(temp));
		};
		str2+=String.fromCharCode(parseInt(tag,2)+65);
		return str2;
	}
}