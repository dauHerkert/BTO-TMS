import { URLSIGNIN } from './a_constants';
import {signOut,auth, user} from './a_firebaseConfig';
import toastr from 'toastr'; 

// Handle signOut
/*=======================================================================================================================================================
  * Manages the user sign-out action. It uses the signOut function from Firebase Authentication to sign out the current user. Redirects the user to the
  * "/en/signin-bto" page after signing out.
========================================================================================================================================================*/

function handleSignOut() {
  let storedLang = localStorage.getItem('language');
  let urlLang = '/en';
  if (storedLang && storedLang === 'de') {
    urlLang = '/de';
  }

  signOut(auth).then(() => {
    setTimeout(() => {
      if (urlLang == '/de') {
        toastr.error('Benutzer abgemeldet');
      } else {
        toastr.error('User signed out');
      }
  }, 1000);
  setTimeout(() => {
    window.location = urlLang + URLSIGNIN;

  }, 1500);
  }).catch((error) => {
      const errorMessage = error.message;
      console.log(errorMessage);
  });
}

/*================================================================================================================================================================
* These event listeners listen for clicks on the sign-out buttons (signout-button and signout-button2). When clicked, they call the handleSignOut function.
================================================================================================================================================================*/
let signOutButton = document.getElementById('signout-button');
let signOutButton2 = document.getElementById('signout-button2');

if (signOutButton) {
  signOutButton.addEventListener('click', handleSignOut);
}
if (signOutButton2) {
  signOutButton2.addEventListener('click', handleSignOut);
}