/*
let epArr=[],totalLevel=9,base=200;
for (let i=1; i<=totalLevel;i++ ){
	epArr.push(i-1<1?base:epArr[i-2]+i*base);
}
*/

exports.epArr=[200,600,1200,2000,3000,4200,5600,7200,9000];
exports.maxLevel=9;
exports.stg={
	publish:{ep:10,g:0.5},
	reply1:{ep:2,g:0.2},
	reply2:{ep:1,g:0.1}
}