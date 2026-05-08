let isHindi = false;
let isSignup = false;

/* LOGIN TAB */

function showLogin(){

  isSignup = false;

  document.getElementById("formTitle").innerText =
  isHindi ? "कस्टमर लॉगिन" : "Customer Login";

  document.getElementById("mainBtn").innerText =
  isHindi ? "लॉगिन" : "Login";

  document.getElementById("nameField").style.display =
  "none";

  document.getElementById("loginTab")
  .classList.add("active");

  document.getElementById("signupTab")
  .classList.remove("active");
}

/* SIGNUP TAB */

function showSignup(){

  isSignup = true;

  document.getElementById("formTitle").innerText =
  isHindi ? "साइन अप करें" : "Create Account";

  document.getElementById("mainBtn").innerText =
  isHindi ? "साइन अप" : "Sign Up";

  document.getElementById("nameField").style.display =
  "block";

  document.getElementById("signupTab")
  .classList.add("active");

  document.getElementById("loginTab")
  .classList.remove("active");
}

/* SUBMIT */

function submitForm(){

  const email =
  document.getElementById("email").value;

  const password =
  document.getElementById("password").value;

  if(isSignup){

    const name =
    document.getElementById("name").value;

    if(name === "" || email === "" || password === ""){
      alert("Please fill all fields");
    }
    else{
      alert("Account Created Successfully 🌱");
    }

  }

  else{

    if(email === "" || password === ""){
      alert("Please fill all fields");
    }
    else{
      alert("Login Successful 🌱");
    }
  }
}

/* LANGUAGE TOGGLE */

function toggleLanguage(){

  isHindi = !isHindi;

  document.getElementById("welcomeText").innerText =
  isHindi ?
  "स्वागत है किसान 👨‍🌾" :
  "Welcome Farmer 👨‍🌾";

  document.getElementById("subText").innerText =
  isHindi ?
  "अपनी फसल, ऑर्डर और खेती के व्यवसाय को आसानी से संभालें।"
  :
  "Manage your crops, orders and farming business easily.";

  document.getElementById("langBtn").innerText =
  isHindi ? "English" : "हिंदी";

  document.getElementById("email").placeholder =
  isHindi ? "ईमेल पता" : "Email Address";

  document.getElementById("password").placeholder =
  isHindi ? "पासवर्ड" : "Password";

  document.getElementById("name").placeholder =
  isHindi ? "पूरा नाम" : "Full Name";

  if(isSignup){
    showSignup();
  }
  else{
    showLogin();
  }
}

/* DEFAULT */

showLogin();