import { URLENV, URLSIGNIN, URLASSETS, ICON_LOGOUT } from './a_constants';
import { collection, getDocs, sendPasswordResetEmail, db, auth, doc, getDoc, onAuthStateChanged, user, getAuth } from './a_firebaseConfig';
import { signInPage } from './signIn';
import { signUpPage } from './signUp';
import { pagePress } from './pressPage';
import { pageAccount } from './accountPage';
import { pageSupplier } from './supplierPage';
import { pageAdmin } from './adminPage';
import { pageCompaniesTable } from './companiesPage';
import toastr from 'toastr';

/*==================================================================================================================================================================
 * This function retrieves the user information from the Firestore database based on the provided user parameter, which is the user object. It queries the database
 * using the user's UID and returns the corresponding user data if it exists. Otherwise, it displays an error message using Toastr.
===================================================================================================================================================================*/

export async function getUserInfo(user) {
  const typeRef = doc(db, 'users', user.uid);
  const typeSnap = await getDoc(typeRef);
  if ( typeSnap.exists() ) {
    return typeSnap.data();
  } else {
    toastr.error('No user found with that ID');
  }
}

/*==================================================================================================================================================================
 * This function retrieves the admin information from the Firestore database based on the provided user parameter, which is the user object. It queries the database
 * using the user's UID and returns the corresponding admin data if it exists. Otherwise, it displays an error message using Toastr.
===================================================================================================================================================================*/

export async function getAdminInfo(user) {
  const typeRef = doc(db, 'admin', user.uid);
  const typeSnap = await getDoc(typeRef);
  if ( typeSnap.exists() ) {
    return typeSnap.data();
  } else {
    //toastr.error('No administrator permissions');
  }
}

export async function getAdminData(userID) {
  console.log("userID ", userID)
  const typeRef = doc(db, 'admin', userID);
  const typeSnap = await getDoc(typeRef);
  if ( typeSnap.exists() ) {
    console.log("typeSnap.data().basic_admin ", typeSnap.data().basic_admin)
    return [typeSnap.data().basic_admin, typeSnap.data().company_admin, typeSnap.data().super_admin];
  } else {
    return [false, false, false];
  }
}
/*=================================================================================================================================================================
* This function translates the navigation menu items based on the selected language (storedLang). It selects the navigation links on the page and iterates over
* each link, checking its text content. If the text matches specific labels (e.g., "Form," "Account," or "Sign Out"), it replaces the text with the corresponding
* translation. In the case of "Sign Out," it replaces the text with an image and the translated text "Ausloggen."
==================================================================================================================================================================*/

function translateNavigation() {
  if (storedLang && storedLang == 'de') {
    let navLinks = $('.nav-menu').find('.nav-link');
    navLinks.each(function(i, e) {
      let navLabel = $(e).text().trim();
      if (navLabel == 'Form') {
        $(e).text('Formular');
      } else if (navLabel == 'Account') {
        $(e).text('Profil');
      } else if (navLabel == 'Sign Out') {
        $(e).text('');
        $(e).prepend('<img id="signout_img" src="' + URLASSETS + ICON_LOGOUT + '"/>Ausloggen');
      }
    });
    let navDropdownLinks = $('#admin_drop').find('nav').find('a');
    navDropdownLinks.each(function(i, e) {
      let navLabel = $(e).text().trim();
      if ( navLabel == 'Users table' ) {
        $(e).text('Benutzerliste');
      } else if ( navLabel == 'Companies table' ) {
        $(e).text('Firmenliste');
      }
    });
  }
}

/*======================================================================================================================================================
 * This code snippet performs several tasks on the first page load. It handles a loading overlay by setting its display to "none" after a delay. It then
 * dispatches a request, checks URL parameters, and defines an asynchronous function called changeCompanyNameToID.
=======================================================================================================================================================*/

const loadingOverlay = document.querySelector(".loading-overlay");
if (loadingOverlay) {
  setTimeout(function() {
    loadingOverlay.style.display = "none";
  }, 2000);
}
dispatchRequest(false);
checkUrlParameter();

async function changeCompanyNameToID(user) {
  console.log("user.user_company:", user.user_company);
  const companiesRef = collection(db, "companies");
  const companiesSnapshot = await getDocs(companiesRef);
  let companyNames = [];
  for (const company of companiesSnapshot.docs) {
    if (user.user_company.includes(company.id)) {
      companyNames.push(company.data().company_name);
    }
  }
  if (companyNames.length > 0) {
    return companyNames.join(", ");
  } else {
    console.log("No company found with that ID");
  }
}

/*===============================================================================================================================================================
* This function populates the forms and sets the appropriate links and display based on the user's information and the selected language (storedLang). It
* retrieves the user information using the getUserInfo(user) function and updates the UI elements accordingly. It also handles specific scenarios for different
* account types and user roles.
================================================================================================================================================================*/

async function populateForms(user) {
  let userInfo = await getUserInfo(user);
  let adminInfo = await getAdminInfo(user);
  //const accountType_button = document.getElementById('account_user_profile');
  let navAdminDropdown = document.getElementById('admin_drop');
  let navAdminDropdownCompanyLink = document.getElementById('companies_table_link');
  let storedLang = localStorage.getItem('language');
  let urlLang = '/en';
  if (storedLang && storedLang === 'de') {
    urlLang = '/de';
  }

  if (userInfo) {
    // Use the changeCompanyNameToID(user) function to get the company name
    const companyNames = await changeCompanyNameToID(userInfo);
    userInfo.user_company_name = companyNames;

    if (adminInfo) {
      if (adminInfo.super_admin || adminInfo.company_admin || adminInfo.basic_admin) {
        if (navAdminDropdown) { navAdminDropdown.style.display = 'flex'; }
        if (adminInfo.super_admin) {
          if (navAdminDropdownCompanyLink) { navAdminDropdownCompanyLink.style.display = 'block'; }
        } else {
          if (navAdminDropdownCompanyLink) { navAdminDropdownCompanyLink.style.display = 'none'; }
          if (window.location.pathname.includes('companies-table')) {
            location.replace(urlLang + '/account');
          }
        }
      } else {
        if (window.location.pathname.includes('users-table') || window.location.pathname.includes('companies-table')) {
          location.replace(urlLang + '/account');
        }
        if (navAdminDropdown) { navAdminDropdown.style.display = 'none'; }
      }
    }
  }
}


/*============================================================================================================================================================
* This function is called when the user is signed in. It selects elements with the data-onlogin="show" attribute and sets their display style to "initial",
* making them visible. It also selects elements with the data-onlogin="hide" attribute and sets their display style to "none", hiding them from view.
=============================================================================================================================================================*/

function showPrivateElements() {
  // User is signed in
  let publicElements = document.querySelectorAll("[data-onlogin='hide']");
  let privateElements = document.querySelectorAll("[data-onlogin='show']");
  privateElements.forEach(function(element) {
    element.style.display = "initial";
  });
  publicElements.forEach(function(element) {
    element.style.display = "none";
  });
}

/*============================================================================================================================================================
* This function is called when the user is signed out. It selects elements with the data-onlogin="hide" attribute and sets their display style to "initial",
* making them visible. It selects elements with the data-onlogin="show" attribute and sets their display style to "none", hiding them from view.
=============================================================================================================================================================*/

function showPublicElements() {
  // User is signed out
  let publicElements = document.querySelectorAll("[data-onlogin='hide']");
  let privateElements = document.querySelectorAll("[data-onlogin='show']");
  publicElements.forEach(function(element) {
    element.style.display = "initial";
  });
  privateElements.forEach(function(element) {
    element.style.display = "none";
  });
}

/*=========================================================================================================================================================
 * Check if the company parameter exists in the URL, if it does then set a value in the local storage and pre-populate the text field in the sign up form
==========================================================================================================================================================*/

const zonesRef = collection(db, 'zones');
export function createOptions(select) {
  getDocs(zonesRef)
    .then((snapshot) => {
      snapshot.docs.forEach((doc) => {
        let zone = doc.data();

        var opt = document.createElement('option');
        opt.value = zone.zone;
        opt.textContent = zone.zone;
        select.appendChild(opt);
      });
    })
    .catch(err => {
      console.log('error fetching companies', err);
    });
}

/*===========================================================================================================================================================
 * This function checks the URL parameters and retrieves the value of the 'company' parameter. If the parameter exists, it stores it in the local storage
 * and sets the value of an input field. Otherwise, it sets the input field value to 'No company'.
============================================================================================================================================================*/

function checkUrlParameter() {
  let url = new URL(window.location.href);
  let company = url.searchParams.get('company');

  if (company) {
      localStorage.setItem('company', company);
      $('#sign-up-company').val(company);
  } else {
    $('#sign-up-company').val('No company');
  }
}

/*=========================================================================================================================================================
 * This function handles different actions based on the user's sign-in status and the current URL path, determining which page or functionality to display.
==========================================================================================================================================================*/

 function dispatchRequest(user) {
  let url = window.location.pathname;
  let signoutBtn = document.getElementById('signout-button');
  //console.log('url in dispatchRequest() - last segment', url.substring(url.lastIndexOf('/') + 1));

  // User is NOT signed in
  if (user == false) {
    if (signoutBtn) {signoutBtn.style.display = 'none';}
    if (url.substring(url.lastIndexOf('/') + 1) == 'signup-bto') {
      signUpPage();
    } else if (url.substring(url.lastIndexOf('/') + 1) == 'signin-bto') {
      signInPage();
    } else if (url.substring(url.lastIndexOf('/') + 1) == 'press-form') {
      pagePress();
    } else {
      // User does NOT have access to this page
      console.log('user does NOT have access to this page');
    }
  } else {
    if (signoutBtn) {signoutBtn.style.display = 'flex';}
    // User IS signed in
    if (url.substring(url.lastIndexOf('/') + 1) == 'account') {
      pageAccount(user);
    } else if (url.substring(url.lastIndexOf('/') + 1) == 'supplier') {
      pageSupplier(user);
    } else if (url.substring(url.lastIndexOf('/') + 1) == 'users-table') {
      pageAdmin(user);
    } else if (url.substring(url.lastIndexOf('/') + 1) == 'companies-table') {
      pageCompaniesTable(user);
    }
  }
}

/*=================================================================================================================================================
 * This code snippet handles the forgot password functionality, sends password reset emails, and displays success messages and email confirmation
 * messages based on the current URL path and stored language value.
===================================================================================================================================================*/

if(window.location.pathname == '/en/forgoten-password' || window.location.pathname == '/de/forgoten-password'){
  let email = document.getElementById('email_address');
  let resetPasword = document.getElementById('forgot_password');
  let storedLang = localStorage.getItem('language');
  let urlLang = '/en';
  if (storedLang && storedLang === 'de') {
    urlLang = '/de';
  }

  resetPasword.addEventListener('submit', function(e){
    e.preventDefault();
    e.stopPropagation();

    localStorage.setItem('email', JSON.stringify(email.value));

    sendPasswordResetEmail(auth, email.value)
    .then(() => {
      toastr.success('Email has been sent!');
      setTimeout(function() {

        window.location.pathname = urlLang + '/success-email-sent';

      }, 2000);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log('errorCode: errorMessage', errorCode, ': ', errorMessage);
      if (storedLang && storedLang === 'de') {
        if (errorCode == 'auth/user-not-found') {
          toastr.error('Für die eingegebene E-Mail-Adresse gibt es keinen Benutzer im System.');
        } else {
          toastr.error('Es ist ein Fehler aufgetreten');
        }
      } else {
        if (errorCode == 'auth/user-not-found') {
          toastr.error('The e-mail address entered does not have an existing user in the system.');
        } else {
          toastr.error('There was an error');
        }
      }
      // ..
    });
  })
};

if (window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1) == 'success-email-sent') {
  let forgot_password_email = localStorage.getItem('email');
  document.getElementById('email_confirmation_text').innerText = 'We sent a password reset link to ';
  let localEmail = document.createElement('strong');
  localEmail.innerText = forgot_password_email;
  document.getElementById('email_confirmation_text').appendChild(localEmail);
}

/*=====================================================================================================================================================
 *This code snippet listens for changes in the authentication state using the onAuthStateChanged function. When a user signs in, it logs the user's UID
 * to the console, replaces the URL, dispatches a request, populates forms, and shows private elements. When a user signs out, it replaces the URL, shows
 * public elements, and exits the function.
=======================================================================================================================================================*/

onAuthStateChanged(auth, (user) => {
  let url = window.location.pathname;
  let storedLang = localStorage.getItem('language');
  let urlLang = '/en';
  if (storedLang && storedLang === 'de') {
    urlLang = '/de';
  }

  if (user) {
    // user is signed in
    //console.log(`The current user's UID is equal to ${user.uid}`);
    dispatchRequest(user);
    populateForms(user);
    showPrivateElements();

  } else {
    if (url.substring(url.lastIndexOf('/') + 1) == 'account' || url.substring(url.lastIndexOf('/') + 1) == 'users-table' || url.substring(url.lastIndexOf('/') + 1) == 'companies-table') {
      window.location.pathname = urlLang + URLSIGNIN;
    }
    // user is signed out
    showPublicElements();
    return;
  }
});

/*===================================================================================================================================
 * These onClick events add/delete a class to the selected language and triggers the changeLanguage and updateLinks functions
 ====================================================================================================================================*/

let reloaded = false;

function changeLanguage(lang) {
  const currentPath = window.location.pathname;
  const isWelcomePage = currentPath.startsWith("/en/welcome") || currentPath.startsWith("/");
  const isSignupPage = currentPath.startsWith("/en/signup") || currentPath.startsWith("/de/signup");
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get("company");

  localStorage.setItem("language", lang);
  /*
  let newPath = currentPath.replace(/^\/[a-z]{2}/, `/${lang}`);

  if (companyId && (isWelcomePage || isSignupPage)) {
    newPath += `?company=${companyId}`;
  }
  window.history.pushState({}, null, newPath);

  if (!reloaded) {
    reloaded = true;
    location.reload();
  }
  */
}

let currentLang = 'en';

window.addEventListener('load', function(){
  var storedLang = localStorage.getItem("language");
  if(storedLang){
    currentLang = storedLang;
  }

  /*
  document.getElementById("langBtn").addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.lastChild.innerText == 'EN') {
      changeLanguage("de");
    } else if (this.lastChild.innerText == 'DE') {
      changeLanguage("en");
    }
    window.location.href = this.href; 
  });
  */
  
  updateLinks();
});

function updateLinks() {
  console.log("Updating linkss");
  var baseUrl = window.location.origin;
  var currentPath = window.location.pathname;
  var pathArray = currentPath.split("/");
  if (pathArray.length < 3 || (pathArray.length >= 3 && !/^[a-z]{2}$/.test(pathArray[1]))) {
    currentPath = '/'+currentLang+currentPath;
  }
  var links = document.querySelectorAll(".nav-link");
  if (links) {
    for (var i = 0; i < links.length; i++) {
      var link = links[i];
      if(!link.href.startsWith(baseUrl)){
        link.href = baseUrl + currentPath + link.getAttribute("href");
      }
    }
  }
}


/*===================================================================================================================================
 * This function adds a border bottom to the link on the navbar of the current page
 ====================================================================================================================================*/

let welcomeBanner = document.getElementById('welcomeBanner');
if (welcomeBanner) {
  if (location.search.indexOf('?company=') !== -1) {
    welcomeBanner.style.display = 'flex';
  } else {
    welcomeBanner.style.display = 'none';
  }
}

/*===============================================================================================================================================================
* This function changes the Admin type title on the tables to the correct one. If the user is a Basic Admin the code will print "Basic Admin" on the DOM element,
* if it's a "Company Admin" will print "Multi Company Admin" and if it's a Super Admin will print "Super Admin".
=================================================================================================================================================================*/

export async function changeAdminTypeTitle(user) {
  let adminInfo = await getAdminInfo(user);
  let storedLang = localStorage.getItem("language");
  let adminLabel = 'No Admin';

  if (adminInfo) {
    if (adminInfo.basic_admin) {
      adminLabel = 'Basic Admin';
    } else if (adminInfo.company_admin) {
      adminLabel = 'Multi Company Admin';
    } else if (adminInfo.super_admin) {
      adminLabel = 'Super Admin';
    }

    if (storedLang && storedLang === 'de') {
      if (adminInfo.basic_admin) {
        adminLabel = 'Grundlegender Administrator';
      } else if (adminInfo.company_admin) {
        adminLabel = 'MEHRFIRMENADMIN';
      } else if (adminInfo.super_admin) {
        adminLabel = 'Superadministrator';
      }
    }

    document.getElementById('user_admin_type').innerText = adminLabel;
  }
}

/*===================================================================================================================================
 * This function redirects from the "Home page" to the "Sign-in page"
 ====================================================================================================================================*/
/*
if(window.location.href == URLENV){
  window.location.href = URLENV + '/en/signin-bto' 
}
*/

/*===================================================================================================================================
 * This function sanitize and escape HTML on strings to use for inputs
 ====================================================================================================================================*/

var entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

var entityMapLess = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

export function escapeHtml(string) {
  return String(string).replace(/[&<>"'`=\/]/g, function (s) {
    return entityMap[s];
  });
}

export function escapeHtmlLess(string) {
  return String(string).replace(/[&<>"'`=]/g, function (s) {
    return entityMapLess[s];
  });
}