import { URLEMAILTEMPLATES, URLENV, URLSIGNIN, firstImageURL, firstImageStyle, secondImageURL, secondImageStyle } from './a_constants';
import {addDoc,collection,db} from './a_firebaseConfig';
import toastr from 'toastr';

// ======== Resend Register email ==========
/*============================================================================================================================================================
  * Resends the registration email to the user. It retrieves the user's email and language preference from session storage, constructs the HTML content of the
  * email based on the language, and sends the email using Firebase's Firestore database. Displays success message upon successful email resend and error
  *  message in case of failure.
=============================================================================================================================================================*/

async function resendEmail() {
  const user_firstname = sessionStorage.getItem('user_firstname');
  const user_lastname = sessionStorage.getItem('user_lastname');
  const user_email = sessionStorage.getItem('user_email');
  const stored_userID = sessionStorage.getItem('userID');
  let fullNameDisplay = `${user_firstname} ${user_lastname}`;

  let storedLang = localStorage.getItem('language');
  let urlLang = '/en';
  // Subject for Register email - EN
  let register_email_subject = 'Thanks for your registration';
  // Template for Register email - EN
  let register_email_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLREGISTER_EN;

  if (storedLang && storedLang === 'de') {
    urlLang = '/de';
    // Subject for Register email - DE
    register_email_subject = 'Vielen Dank für Ihre Registrierung';
    // Template for Register email - DE
    register_email_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLREGISTER_DE;
  }

  try {
    let html;
    let subject;

    html = await fetch(register_email_url)
      .then(response => response.text())
      .then(html => html.replaceAll('${fullName}', fullNameDisplay))
      .then(html => html.replace('${firstImageURL}', firstImageURL))
      .then(html => html.replace('${firstImageStyle}', firstImageStyle))
      .then(html => html.replace('${secondImageURL}', secondImageURL))
      .then(html => html.replace('${secondImageStyle}', secondImageStyle))
      .then(html => html.replaceAll('${urlEN}', (URLENV + '/en' + URLSIGNIN)))
      .then(html => html.replaceAll('${urlDE}', (URLENV + '/de' + URLSIGNIN)))
      .then(html => html.replaceAll('${userID}', stored_userID));
    subject = register_email_subject;

    const docRef = await addDoc(collection(db, "mail"), {
      to: [user_email],
      message: {
        subject: subject,
        html: html,
      }
    });

    // Sucessfully resend email
    toastr.success('Email resent successfully!');
  } catch (error) {
    console.error(error);
    // Error resending email
    toastr.error('Failed to resend email. Please try again.');
  }
}

//Attaches the resendEmail function to the click event of the "resend_email_button" element, triggering the email resend process when the button is clicked.
const resend_button = document.getElementById('resend_email_button');
if (resend_button) {
  resend_button.addEventListener('click', resendEmail);
}