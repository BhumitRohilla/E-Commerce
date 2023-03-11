const form = document.getElementsByTagName("form")[0];
const submitBtn = document.getElementById('submit-btn');

//form values
const titleInput = document.getElementById('title');
const tagInput  = document.getElementById('tags');
const dateInput = document.getElementById('date');
const statusProductInput = document.getElementById('status');
const userReviewsInput = document.getElementById('userReviews');
// const priceInput = document.getElementById('price');
const stockInput = document.getElementById('stock');
const aboutInput = document.getElementById('about');
const imgInput   = document.getElementById('product-img');
let errMsg = document.getElementById('err');


submitBtn.addEventListener('click',function(evt){
    evt.preventDefault();
    let title = titleInput.value.trim();
    let tag = tagInput.value.trim();
    let statusProduct = statusProductInput.value.trim();
    let userReviews = userReviewsInput.value.trim();
    // let price = priceInput.value
    let stock = stockInput.value
    let about = aboutInput.value.trim();
    let img = imgInput.value.trim();
    if(title == "" || tag == "" || date == "" || statusProduct == "" || userReviews == "" /*|| price == ""*/ || stock == "" || about == "" || img == ""){
        alert("Please Enter All The Value");
        return ;
    }else{
        let sizeOfImg = imgInput.files[0].size;
        if(sizeOfImg > 256000){
            alert("Image size should be below 250kb");
            return ;
        }
    }
    let data = new FormData(form);
    let request = new XMLHttpRequest;
    request.open('POST','/addNewProduct');
    request.send(data);
    request.addEventListener('load',function(){
        switch(request.status){
            case 200:{
                window.opener.location.reload();
                window.close();
                break;
            }
            case 403:{
                alert("File Size if larger");
                break;
            }
            case 404:{
                alert("Server Time Out");
            }
        }
    })
})