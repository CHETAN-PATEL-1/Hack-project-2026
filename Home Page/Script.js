let x = document.querySelector("#temp1");
x.style.backgroundColor = "rgb(45, 142, 0)";
x.style.color = "white";
x.addEventListener("mouseenter",function(){
    x.style.backgroundColor = "rgb(72, 163, 20)";
    x.style.color = "black";
})
x.addEventListener("mouseleave",function(){
    x.style.backgroundColor = "rgb(42, 142, 0)";
    x.style.color = "white";
})

let y = document.querySelector("#temp2");
y.style.backgroundColor = "rgb(15, 142, 0)";
y.style.color = "white";
y.addEventListener("mouseenter",function(){
    y.style.backgroundColor = "rgb(72, 163, 20)";
    y.style.color = "black";
})
y.addEventListener("mouseleave",function(){
    y.style.backgroundColor = "rgb(15, 142, 0)";
    y.style.color = "white";
})