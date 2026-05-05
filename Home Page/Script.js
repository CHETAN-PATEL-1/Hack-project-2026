let arr = [1,2,3,4,5,6];

let newArr = arr.filter((val) => {
    return val%2 === 0;
});

console.log(newArr);