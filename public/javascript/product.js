import {requestServerNoDelay} from '/javascript/general.js'
const showMore = document.getElementById('show-more');
const itemList = document.getElementById('item-container');
console.log(showMore);


showMore.addEventListener('click',function(){
    console.log(itemList);
    
    requestServerNoDelay('GET','/showMore',null,function(request){
        console.log(request.response);
        if(request.status == 403){
            showMore.style.visibility = "hidden";
        }else{    
            let data = request.response;
            showMore.insertAdjacentHTML("beforebegin",data);
        }
    });
})