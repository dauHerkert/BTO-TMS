import { URLACCOUNT, URLADMIN } from './a_constants';
import {signInWithEmailAndPassword,auth,doc,db,getDoc,updateDoc, user} from './a_firebaseConfig';
import toastr from 'toastr'; 

// ============ Handle singin ===============
  /*=========================================================================================================================================================
   * Manages the user sign-in action. It retrieves the email and password from the sign-in form, uses the signInWithEmailAndPassword function from Firebase
   * Authentication to authenticate the user, and redirects the user to the appropriate page based on their account type and language preference. Displays
   *  success messages upon successful sign-in and error messages for various scenarios such as invalid credentials, deleted accounts, or unconfirmed emails.
  ==========================================================================================================================================================*/

  async function handleSignIn(e) {
    e.preventDefault();
    e.stopPropagation();

    let storedLang = localStorage.getItem('language');
    let urlLang = '/en';
    if (storedLang && storedLang === 'de') {
      urlLang = '/de';
    }

    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userRef = doc(db, 'users', user.uid);
      const adminRef = doc(db, 'admin', user.uid);
      const adminDocSnap = await getDoc(adminRef);
      const docSnap = await getDoc(userRef);
      const params = new URLSearchParams(window.location.search);
      const userID = params.get('user_id');
      const userData = docSnap.data();
      const adminData = adminDocSnap.data();
      let locationURL = urlLang + URLACCOUNT;

      if (userID || userData.confirmed_email) {
        
        if (docSnap.exists) {
          toastr.success('user logged in: ' + user.email);

          if (!userData.confirmed_email) {
            await updateDoc(userRef, { confirmed_email: true });
          }

          if (userData.user_status === 'OldData') {
            await updateDoc(userRef, { user_status: 'Pending' });
          }

          if (adminDocSnap.exists()) {
            if (adminData.super_admin || adminData.company_admin || adminData.basic_admin) {
              locationURL = urlLang + URLADMIN;
            }
          }
          setTimeout(() => {
            window.location = locationURL;
          }, 1000);
        } else {
          toastr.error('user does not exist');
        }
      } else if (userData.user_deleted) {
        if (urlLang == '/de') {
          toastr.error('Ihr Konto wurde gelöscht.');
        } else {
          toastr.error('Your account has been deleted.');
        }
      } else {
        if (urlLang == '/de') {
          toastr.error('Bitte klicken Sie zuerst auf den Link den sie per email erhalten haben.')
        } else {
          toastr.error('Please click on the link in your email first in order to sign in.');
        }
      }
    } catch (error) {
      const errorMessage = error.message;
      toastr.error(errorMessage);
    }
  }

  /*================================================================================================================================================================
 * This function is called on the sign-in page. It identifies the sign-in form (wf-form-signin-form) and assigns an event listener to it. The event listener
 * listens for the form's submission and calls the handleSignIn function.
=================================================================================================================================================================*/

export function signInPage(){
  let signInForm = document.getElementById('wf-form-signin-form');

  //assign event listeners
  if(typeof(signInForm) !== null) {
    signInForm.addEventListener('submit', handleSignIn, true)
  }
}