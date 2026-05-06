// et x = document.querySelector("#one");
// x.addEventListener("click",function(){
//     x.style.backgroundColor ="red";
//     x.style.fontFamily = "Gill Sans";
// });

// let y = document.querySelector("#two");
// y.style.textAlign = "center";
// y.style.color = "blue";
// setTimeout(() => {y.innerHTML = "Changed"},2000)


let x = document.querySelector("#button1");
x.style.backgroundColor = "white";
x.style.color ="black";
x.addEventListener("mouseenter",function(){
    x.style.backgroundColor = "black";
    x.style.color ="white";
})
x.addEventListener("mouseleave",function(){
    x.style.backgroundColor = "white";
    x.style.color ="black";
})

