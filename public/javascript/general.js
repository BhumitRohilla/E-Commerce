export function requestServer(method,dest,data,callback){
    setTimeout(function(){
        let request =  new XMLHttpRequest;
        request.open(method,dest);
        if(data != null){
            request.setRequestHeader('Content-Type','application/JSON');
            request.send(JSON.stringify(data));
        }else{
            request.send();
        }
        request.addEventListener('load',function(){
            callback(request);
        });
    },1000);
}

export function requestServerNoDelay(method,dest,data,callback){
    let request =  new XMLHttpRequest;
    request.open(method,dest);
    if(data == null){
        request.send();
    }else{
        request.setRequestHeader('Content-Type','application/JSON');
        request.send(JSON.stringify(data));
    }
    request.addEventListener('load',function(){
        callback(request);
    });
}