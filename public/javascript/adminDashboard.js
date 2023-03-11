var strWindowFeatures = "location=yes,height=700,width=1080,scrollbars=yes,status=yes";
function newProductPage(){
    //TODO : Remove This Hard Codded Address
    window.open(window.location.toString()+"/addNewProduct/",'_black',strWindowFeatures);
}

function updateElementFromAdmin(id){
    window.open(window.location.toString()+`/updateProduct/${id}`,'_black',strWindowFeatures);

}

function deleteElementFromAdmin(id){
    var callback=(request)=>{
        switch(request.status){
            case 200:{
                window.location.reload();
            }
        }
    }

    createRequest('POST','/deleteProduct',id.toString(),callback);
    
}

//TODO: LOWER-PRIORITY:- If Possible use import function to import request code.

function createRequest(method,dest,data,callback){
    let request = new XMLHttpRequest;
    request.open(method,dest);
    request.setRequestHeader('Content-Type','text/plain');
    request.send(data);
    request.addEventListener('load',function(){
        callback(request);
    })
}

const form = document.getElementById('new-product-form');
// const submitBtn = document.getElementById('submit-btn');

// //form values
// const titleInput = document.getElementById('title');
// const tagInput  = document.getElementById('tags');
// const dateInput = document.getElementById('date');
// const statusProductInput = document.getElementById('status');
// const userReviewsInput = document.getElementById('userReviews');
// const priceInput = document.getElementById('price');
// const stockInput = document.getElementById('stock');
// const aboutInput = document.getElementById('about');
// const imgInput   = document.getElementById('product-img');
// let errMsg = document.getElementById('err');

// window.addEventListener('load',function(){
//     if(errMsg != null){
//         setTimeout(function(){
//             errMsg.remove();
//         },3000);
//     }
// })

// submitBtn.addEventListener('click',function(evt){
//     evt.preventDefault();
//     let title = titleInput.value.trim();
//     let tag = tagInput.value.trim();
//     let statusProduct = statusProductInput.value.trim();
//     let userReviews = userReviewsInput.value.trim();
//     let price = priceInput.value
//     let stock = stockInput.value
//     let about = aboutInput.value.trim();
//     let img = imgInput.value.trim();
//     let sizeOfImg = imgInput.files[0].size;
//     if(title == "" || tag == "" || date == "" || statusProduct == "" || userReviews == "" || price == "" || stock == "" || about == "" || img == ""){
//         alert("Please Enter All The Value");
//         return ;
//     } 
    
//     if(sizeOfImg > 256000){
//         alert("Image size should be below 250kb");
//         return ;
//     }

//     form.submit();
// })
