import {requestServerNoDelay} from '/javascript/general.js'
const showMore = document.getElementById('show-more');
console.log(showMore);

let nextData ;

window.addEventListener("load",function(){
    requestServerNoDelay('GET','/showMore',null,function(request){
        console.log(request);
    });
})

showMore.addEventListener('click',function(){
    requestServerNoDelay('GET','/showMore',null,function(request){
        console.log(request);
    });
})