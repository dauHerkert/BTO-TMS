import { URLEMAILTEMPLATES, URLENV, URLSIGNIN, firstImageURL, firstImageStyle, secondImageURL, secondImageStyle } from './a_constants';
import {addDoc,collection,db,getDoc} from './a_firebaseConfig';
import toastr from 'toastr';

// ======== Resend Register email ==========
/*============================================================================================================================================================
  * Resends the registration email to the user. It retrieves the user's email and language preference from session storage, constructs the HTML content of the
  * email based on the language, and sends the email using Firebase's Firestore database. Displays success message upon successful email resend and error
  *  message in case of failure.
=============================================================================================================================================================*/

const RESEND_DEBUG_PANEL_ID = 'resend_email_debug_panel';

function showResendDebug(message, data) {
  let panel = document.getElementById(RESEND_DEBUG_PANEL_ID);
  if (!panel) {
    panel = document.createElement('div');
    panel.id = RESEND_DEBUG_PANEL_ID;
    panel.style.cssText = [
      'margin-top:16px',
      'padding:12px',
      'border:1px solid #d8d8d8',
      'border-radius:8px',
      'background:#ffffff',
      'color:#111111',
      'font:12px/1.45 monospace',
      'white-space:pre-wrap',
      'overflow:auto',
    ].join(';');

    const resendButton = document.getElementById('resend_email_button');
    if (resendButton && resendButton.parentNode) {
      resendButton.parentNode.insertBefore(panel, resendButton.nextSibling);
    } else {
      document.body.appendChild(panel);
    }
  }

  const output = data ? `${message}\n${JSON.stringify(data, null, 2)}` : message;
  panel.textContent = output;
  console.log('[resend email]', message, data || '');
}

function sanitizeMailDocForDebug(data) {
  if (!data) {
    return null;
  }

  return {
    ...data,
    message: data.message
      ? {
          ...data.message,
          html: data.message.html ? `[html length: ${data.message.html.length}]` : data.message.html,
        }
      : data.message,
  };
}

async function resendEmail() {
  const user_firstname = sessionStorage.getItem('user_firstname');
  const user_lastname = sessionStorage.getItem('user_lastname');
  const user_email = sessionStorage.getItem('user_email');
  const stored_userID = sessionStorage.getItem('userID');
  let fullNameDisplay = `${user_firstname} ${user_lastname}`;

  showResendDebug('Starting resend email...', {
    user_firstname,
    user_lastname,
    user_email,
    stored_userID,
  });

  if (!user_email || !stored_userID) {
    toastr.error('Missing user data to resend the email.');
    showResendDebug('Missing user data in sessionStorage.', {
      user_email,
      stored_userID,
    });
    return;
  }

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
    showResendDebug('Mail document created. Waiting for extension status...', {
      mailDocId: docRef.id,
      to: [user_email],
      subject,
      templateUrl: register_email_url,
      htmlLength: html.length,
    });

    setTimeout(async () => {
      try {
        const mailDocSnapshot = await getDoc(docRef);
        showResendDebug('Mail document after extension processing window.', {
          mailDocId: docRef.id,
          exists: mailDocSnapshot.exists(),
          data: sanitizeMailDocForDebug(mailDocSnapshot.data()),
        });
      } catch (error) {
        showResendDebug('Could not read mail document after creating it.', {
          mailDocId: docRef.id,
          message: error.message,
          code: error.code,
        });
      }
    }, 5000);

    // Sucessfully resend email
    toastr.success('Email resent successfully!');
  } catch (error) {
    console.error(error);
    showResendDebug('Failed to create mail document.', {
      message: error.message,
      code: error.code,
    });
    // Error resending email
    toastr.error('Failed to resend email. Please try again.');
  }
}

//Attaches the resendEmail function to the click event of the "resend_email_button" element, triggering the email resend process when the button is clicked.
const resend_button = document.getElementById('resend_email_button');
if (resend_button) {
  resend_button.addEventListener('click', resendEmail);
}
