import { DEFAULTCOMPANYID, EVENTDATES, URLEMAILTEMPLATES, URLENV, URLSIGNIN, firstImageURL, firstImageStyle, secondImageURL, secondImageStyle } from './a_constants';
import {doc,getDoc,setDoc,updateDoc,addDoc,collection,getDocs,ref,getDownloadURL,uploadBytes,deleteObject,createUserWithEmailAndPassword,auth,storage,db, user} from './a_firebaseConfig';
import Cropper from 'cropperjs';
import toastr from 'toastr';
import { getUserInfo, escapeHtml } from './ab_base';
import 'select2';
import 'select2/dist/css/select2.min.css';

//placeholder: 'Firma auswählen',
$('#user_company').select2({
  placeholder: 'Select a company',
});

// This is a list of the default values
// as well as of all the possible fields that a user doc can have
const userDefaultValues = {
  // Supplier fields
  supplier_start_date:'',
  supplier_end_date:'',
  supplier_special_request:'',
  supplier_access_zone:'',
  company_admin_petition:'',
  // Boolean: false | true
  supplier_has_form_submitted: false,

  // Press fields
  press_workspot: false,
  press_locker: false,
  press_hotel_info: false,
  press_publisher:'',
  press_media_type:'',
  press_visit_dates:'',
  press_special_request:'',
  // Boolean: false | true
  press_has_uploaded_id: false,
  press_has_form_submitted: false,
  press_form_user: false,
  //Press form info
  press_media:'',
  user_itwa: false,
  press_issued_by:'',
  press_card_number:'',

  // User fields
  user_company:'',// DEFAULTCOMPANYID,
  user_firstcompany:'',
  user_email:'',
  user_id:'',
  user_title:'',
  user_city:'',
  user_country:'',
  user_nationality:'',
  user_zones:'',
  // account_type: supplier | press |
  account_type:'Supplier',
  //User profile
  user_type:'',
  // user_status: pending | ok
  user_status:'Pending',
  // Boolean: false | true
  confirmed_email: false,
  user_deleted: false,
};

/*========================================================================================================================================================
 * This asynchronous function retrieves user information and performs a database query to fetch company data. It checks if the user's company ID matches
 * any company in the database, and if so, it assigns the corresponding company type and company zones to variables. If no matching company is found,
 * default values are used.
=========================================================================================================================================================*/

async function getCompanyType(user) {
  let userInfo = await getUserInfo(user);
  console.log('userInfo:', userInfo);
  const companiesRef = collection(db, "companies");
  const companiesSnapshot = await getDocs(companiesRef);
  let companyProfile = 'No company';
  let companyZones = [];

  for (const company of companiesSnapshot.docs) {
    if (company.id === userInfo.user_company) {
      companyProfile = company.data().company_profile;
      companyZones = company.data().company_zones || [];
      break;
    }
  }

  // Return the object with the default values for companyProfile and companyZones
  return { companyProfile, companyZones };
}

/*====================================================================================================================================================
  *  Sets default fields for a user during sign-up process. It retrieves user information such as first name, last name, user ID, and profile image.
  * The function updates the Firestore document with the user's default values and uploads the profile image to Firebase Storage. It also triggers the
  * * sending of a registration confirmation email to the user based on their language preference. Displays success messages for default value setting
  * * and email sending. Finally, redirects the user to the appropriate sign-up confirmation page based on language and account type.
=====================================================================================================================================================*/

const fileName = document.getElementById("fileName");
if (fileName) {
  fileName.style.display = 'none';
}

const uploading_image = document.getElementById('uploading_image');
const SIGNUP_OVERLAY_ID = 'signup_registration_overlay';
const SIGNUP_OVERLAY_STYLE_ID = 'signup_registration_overlay_styles';
const signupOverlayMessages = {
  en: 'Registering your account. Please wait...',
  de: 'Ihre Registrierung wird verarbeitet. Bitte warten...',
};
const SIGNUP_DEBUG_VERSION = 'signup-mail-debug-2026-04-27-2';
const SIGNUP_DEBUG_STORAGE_KEY = 'signup_debug_trace';

function signupDebugLog(message, data = null) {
  const payload = {
    at: new Date().toISOString(),
    message,
    data,
  };

  console.log(`[signup] ${message}`, data || '');

  try {
    const currentTrace = JSON.parse(sessionStorage.getItem(SIGNUP_DEBUG_STORAGE_KEY) || '[]');
    currentTrace.push(payload);
    sessionStorage.setItem(SIGNUP_DEBUG_STORAGE_KEY, JSON.stringify(currentTrace.slice(-30)));
  } catch (error) {
    console.log('[signup] Could not write debug trace', error);
  }
}

function printStoredSignupDebugTrace() {
  try {
    const currentTrace = JSON.parse(sessionStorage.getItem(SIGNUP_DEBUG_STORAGE_KEY) || '[]');
    if (!currentTrace.length) {
      return;
    }

    console.group('[signup] Previous registration trace');
    currentTrace.forEach((entry) => {
      console.log(`${entry.at} - ${entry.message}`, entry.data || '');
    });
    console.groupEnd();
  } catch (error) {
    console.log('[signup] Could not read debug trace', error);
  }
}

printStoredSignupDebugTrace();

function getSignupOverlayMessage() {
  const storedLang = localStorage.getItem("language");
  return storedLang === 'de' ? signupOverlayMessages.de : signupOverlayMessages.en;
}

function ensureSignupOverlayStyles() {
  if (document.getElementById(SIGNUP_OVERLAY_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = SIGNUP_OVERLAY_STYLE_ID;
  style.textContent = `
    #${SIGNUP_OVERLAY_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: rgba(255, 255, 255, 0.86);
      cursor: wait;
    }

    #${SIGNUP_OVERLAY_ID}.is-visible {
      display: flex;
    }

    #${SIGNUP_OVERLAY_ID} .signup-registration-overlay__message {
      max-width: 420px;
      width: 100%;
      padding: 24px;
      border-radius: 8px;
      background: #ffffff;
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.18);
      color: #1f1f1f;
      font-family: inherit;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.4;
      text-align: center;
    }

    body.signup-registration-is-blocked {
      overflow: hidden;
    }
  `;
  document.head.appendChild(style);
}

function getSignupOverlay() {
  let overlay = document.getElementById(SIGNUP_OVERLAY_ID);
  if (overlay) {
    return overlay;
  }

  ensureSignupOverlayStyles();
  overlay = document.createElement('div');
  overlay.id = SIGNUP_OVERLAY_ID;
  overlay.setAttribute('role', 'alert');
  overlay.setAttribute('aria-live', 'assertive');
  overlay.setAttribute('aria-busy', 'true');
  overlay.innerHTML = '<div class="signup-registration-overlay__message"></div>';
  document.body.appendChild(overlay);
  return overlay;
}

function showSignupOverlay() {
  const overlay = getSignupOverlay();
  const message = overlay.querySelector('.signup-registration-overlay__message');
  const signupButton = document.getElementById('signup_button');

  if (message) {
    message.textContent = getSignupOverlayMessage();
  }
  overlay.classList.add('is-visible');
  document.body.classList.add('signup-registration-is-blocked');

  if (signupButton) {
    signupButton.disabled = true;
    signupButton.setAttribute('aria-busy', 'true');
  }
}

function hideSignupOverlay() {
  const overlay = document.getElementById(SIGNUP_OVERLAY_ID);
  const signupButton = document.getElementById('signup_button');

  if (overlay) {
    overlay.classList.remove('is-visible');
  }
  document.body.classList.remove('signup-registration-is-blocked');

  if (signupButton) {
    signupButton.disabled = false;
    signupButton.removeAttribute('aria-busy');
  }
}

function generateTempId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function setDefaultFields(user) {
  signupDebugLog('setDefaultFields started', {
    version: SIGNUP_DEBUG_VERSION,
    userId: user.uid,
    email: user.email,
  });
  const userRef = doc(db, 'users', user.uid);
  ///await updateDoc(userRef, { user_company: newUserCompaniesString });
  // Use the `getCompanyType` function to get the company type and zones
  const { companyProfile, companyZones } = await getCompanyType(user);
  const userDoc = await getDoc(userRef);
  const user_firstname = document.getElementById('first-name');
  const user_lastname = document.getElementById('last-name');
  const start_date = document.getElementById('Select-dates');
  const end_date = document.getElementById('Select-dates-2');
  const userID = sessionStorage.getItem('userID');
  const tempImageId = sessionStorage.getItem("tempImageId");
  const profile_img = document.getElementById('profile_img');
  let fileItem = profile_img.files[0];
  let storedLang = localStorage.getItem("language");
  const special_requests = document.getElementById('special_requests');

  if (user_firstname.value && user_lastname.value) {
    userDefaultValues.user_fullname = (escapeHtml(user_firstname.value) + escapeHtml(user_lastname.value)).toLowerCase().replace(/\s/g, '');
  }
  userDefaultValues.supplier_start_date = escapeHtml(start_date.value);
  userDefaultValues.supplier_end_date = escapeHtml(end_date.value);
  userDefaultValues.language = storedLang;
  userDefaultValues.supplier_special_request = escapeHtml(special_requests.value);
  // Use the companyProfile variable to set the user_type field
  userDefaultValues.user_type = companyProfile;
  userDefaultValues.user_email = escapeHtml(user.email);
  userDefaultValues.user_id = user.uid;
  // Use the companyZones variable to set the user_zones field
  userDefaultValues.user_zones = companyZones;
  const admin_checkbox = jQuery('#admin_checkbox').val();
  var company_admin_petition;
  if ( $("#admin_checkbox").is( ":checked" ) ){
    company_admin_petition = admin_checkbox;
  } else {
    company_admin_petition = "No admin";
  }
  console.log("company admin: ", company_admin_petition)
  
  userDefaultValues.company_admin_petition = company_admin_petition;


  let urlLang = '/en';
  //Subject for Register email - EN
  let register_email_subject = 'Thanks for your registration';
  let register_email_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLREGISTER_EN;
  
  if (storedLang && storedLang === 'de') {
    urlLang = '/de';
    //Subject for Register email - DE
    register_email_subject = 'Vielen Dank für Ihre Registrierung';
    register_email_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLREGISTER_DE;
  }

  let fullNameDisplay = `${user_firstname.value} ${user_lastname.value}`;
  let urlCompany = new URL(window.location.href);
  if (urlCompany.searchParams.has('company')){
    userDefaultValues.user_company = currentUrl.searchParams.get('company');
    userDefaultValues.user_firstcompany = currentUrl.searchParams.get('company');
  }


  //Save the user info in case he wants to resend the email
  sessionStorage.setItem('user_firstname', user_firstname.value);
  sessionStorage.setItem('user_lastname', user_lastname.value);
  sessionStorage.setItem('user_email', user.email);
  sessionStorage.setItem('userID', user.uid);
  // Use the setDoc function to set the userDefaultValues object
  return setDoc(userRef, userDefaultValues, { merge: true })
    .then(async () => {
    await userUploadImage(user, tempImageId, hiddenProfileInput, fileItem);
    const oldImagePath = `profiles/${tempImageId}`;
    const newImagePath = `profiles/${user.uid}`;

    // Download the old image
    const oldImageRef = ref(storage, oldImagePath);
    const oldImageUrl = await getDownloadURL(oldImageRef);
    console.log('oldImageUrl >>>', oldImageUrl);

    
    // Upload the image with the new name
    const response = await fetch(oldImageUrl);
    const blob = await response.blob();
    const newImageRef = ref(storage, newImagePath);
    await uploadBytes(newImageRef, blob, { contentType: 'image/png' });

    // Delete the old image
    await deleteObject(oldImageRef);

    // Update the user's profile image path in Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { profileImagePath: newImagePath });
    

    // Sign up email
    signupDebugLog('Register email enqueue started', {
      email: user.email,
      templateUrl: register_email_url,
    });
    const stored_userID = `${userID}`;
    const html = await fetch(register_email_url)
      .then(response => response.text())
      .then(html => html.replaceAll('${fullName}', fullNameDisplay))
      .then(html => html.replace('${firstImageURL}', firstImageURL))
      .then(html => html.replace('${firstImageStyle}', firstImageStyle))
      .then(html => html.replace('${secondImageURL}', secondImageURL))
      .then(html => html.replace('${secondImageStyle}', secondImageStyle))
      .then(html => html.replaceAll('${urlEN}', (URLENV + '/en' + URLSIGNIN)))
      .then(html => html.replaceAll('${urlDE}', (URLENV + '/de' + URLSIGNIN)))
      .then(html => html.replaceAll('${userID}', stored_userID));
    const mailDocRef = await addDoc(collection(db, "mail"), {
      to: [`${user.email}`],
      message: {
        subject: register_email_subject,
        html: html,
      }
    });
    signupDebugLog('Register email queued', {
      mailDocId: mailDocRef.id,
      email: user.email,
    });

    if (companyProfile == 'No company') {
      toastr.success('You are signing up with no company set');
    } else {
      toastr.success('Default values successfully set');
    }

    setTimeout(function(user) {
      window.location = urlLang + "/signup-form-submitted";
    }, 1000);
  })
  .catch((err) => {
      hideSignupOverlay();
      signupDebugLog('Registration data or email step failed', {
        message: err.message,
        code: err.code,
      });
      toastr.error('There was an error updating your info');
  });
};


// Sign Up
/*============================================================================================================================================================
  * Handles the sign-up process by creating a new user with the provided email, password, and profile image. It sets default fields for the user and collects
  * additional information.
=============================================================================================================================================================*/
function handleSignUp(e) {
  e.preventDefault();
  e.stopPropagation();
  sessionStorage.removeItem(SIGNUP_DEBUG_STORAGE_KEY);
  signupDebugLog('signup submit handled', {
    version: SIGNUP_DEBUG_VERSION,
  });
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  var confirm_password = document.getElementById("password-confirm").value;
  const profile_img = document.getElementById('profile_img');
  let storedLang = localStorage.getItem("language");

  if (profile_img.files.length === 0) {
    toastr.error('Please upload your profile picture')
  } else {
    if (password == confirm_password) {
      showSignupOverlay();
      createUserWithEmailAndPassword(auth, escapeHtml(email), password)
        .then(async userCredential => {
          // Signed in
          const user = userCredential.user;
          sessionStorage.setItem('userID', user.uid);
          await setDefaultFields(user);
          console.log('Go to userExtraInfo()');
          userExtraInfo(e, user);
          toastr.success('user successfully created: ' + user.email);
        })
        .catch((error) => {
          hideSignupOverlay();
          const errorCode = error.code;
          const errorMessage = error.message;
          signupDebugLog('signup catch triggered', {
            code: errorCode,
            message: errorMessage,
          });
          if (!errorCode || !errorCode.startsWith('auth/')) {
            if (storedLang && storedLang === 'de') {
              toastr.error('Die Registrierung wurde erstellt, aber es gab ein Problem beim Speichern oder Versenden der E-Mail.');
            } else {
              toastr.error('The account was created, but there was a problem saving the data or sending the email.');
            }
            return;
          }
          if (storedLang && storedLang === 'de') {
            if (errorCode == 'auth/invalid-email') {
              toastr.error('Ungültiges E-Mail-Format, bitte überprüfen Sie, ob es ein @ und eine gültige Domänenerweiterung (z. B. .com, .net) enthält.'); 
            } else if (errorCode == 'auth/weak-password') {
              toastr.error('Das Passwort muss mindestens 6 Zeichen enthalten');
            } else {
              toastr.error('Die email wurde bereits benutzt. Bitte wählen Sie eine andere email.');
            }
          } else {
            if (errorCode == 'auth/invalid-email') {
              toastr.error('Invalid email format, please verify that it contains an @ and a valid domain extension (e.g., .com, .net).'); 
            } else if (errorCode == 'auth/weak-password') {
              toastr.error('The password must contain at least 6 characters.');
            } else {
              toastr.error('The email has already been used. Please choose another email.');
            }
          }
        });
    } else {
      hideSignupOverlay();
      toastr.error('Password confirmation does not match');
    }
  }
};

/*=============================================================================================================================================================
 * The code handles the user's selection of a company. If the "company" parameter is present in the URL, it sets the value of the user_company field and hides
 *  the company_select_cont element. If the "company" parameter is not present, it displays the available company options and captures the user's selection
 *  in the newUserCompaniesString variable.
==============================================================================================================================================================*/

const select_company = document.getElementById('user_company');
const currentUrl = new URL(window.location.href);
const company_select_cont = document.getElementById('company_select_cont');
const company_colRef = collection(db, 'companies');

if (select_company) {
  if (currentUrl.searchParams.has('company') && currentUrl.searchParams.get('company') != "null") {
    // Use the user_company value when the URL has the ?company parameter
    const companyName = currentUrl.searchParams.get('company');
    user_company.value = companyName;
    // Hide the select_company element
    document.getElementById('company_select_wrapper').style.display = 'none';
  } else {
    //Print companies select
    getDocs(company_colRef)
      .then((snapshot) => {
        const companies = snapshot.docs.map((doc) => doc.data());
        const sortedCompanies = companies.sort((a, b) => a.company_name.localeCompare(b.company_name));

        sortedCompanies.forEach((company) => {
          var opt = document.createElement('option');
          opt.value = company.company_id;
          opt.textContent = company.company_name;
          select_company.appendChild(opt);
        });
      })
      .catch((err) => {
        console.log('error fetching companies', err);
      });

    // Use the select_company value when the URL doesn't have the ?company parameter
    select_company.value = select_company.value;
    let newUserCompaniesString = '';
    // Show the select_company element
    document.getElementById('company_select_cont').style.display = 'block';
    $('#user_company').on('change', function () {
      var selectedNewUserCompanies = $(this).val();
      //newUserCompaniesString = selectedNewUserCompanies.join(', ');
      newUserCompaniesString = selectedNewUserCompanies;
      userDefaultValues.user_company = newUserCompaniesString;
      userDefaultValues.user_firstcompany = newUserCompaniesString;
      console.log("Company(s) ID ->> ", newUserCompaniesString);
    });
  }
}

// Add user's extra info to Firestore
/*================================================================================================================================================================
 * The function userExtraInfo captures the user's extra information, such as first name, last name, address, company, language, start date, end date, and special
 *  requests. It then updates the corresponding fields in Firestore for the user.
================================================================================================================================================================*/

function userExtraInfo(e, user) {
  console.log('Staring userExtraInfo()');
  e.preventDefault();
  e.stopPropagation();
  const userRef = doc(db, 'users', user.uid);
  const user_firstname = document.getElementById('first-name');
  const user_lastname = document.getElementById('last-name');
  let user_fullname = '';
  const user_address = document.getElementById('user_address');
  const user_company = document.getElementById('sign-up-company');
  let language = localStorage.getItem("language");
  const start_date = document.getElementById('Select-dates');
  const end_date = document.getElementById('Select-dates-2');
  const special_requests = document.getElementById('special_requests');

  if (user_firstname.value && user_lastname.value) {
    user_fullname = (user_firstname.value + user_lastname.value).toLowerCase().replace(/\s/g, '');
  }
  const userCompanyValue = (currentUrl.searchParams.has('company') && currentUrl.searchParams.get('company') != "null") ? currentUrl.searchParams.get('company') : select_company.value;
  console.log('user_firstname.value ', user_firstname.value);
  console.log('user_lastname.value ', user_lastname.value);
  console.log('HAS COMPANY? ', (currentUrl.searchParams.has('company') && currentUrl.searchParams.get('company') != "null"));
  console.log('userCompanyValue ', userCompanyValue);
  console.log('start_date.value ', start_date.value);
  console.log('end_date.value ', end_date.value);
  console.log('special_requests.value ', special_requests.value);

  setDoc(userRef, {
    user_firstname: escapeHtml(user_firstname.value),
    user_lastname: escapeHtml(user_lastname.value),
    user_fullname: escapeHtml(user_fullname),
    user_company: userCompanyValue,
    user_firstcompany: userCompanyValue,
    last_signin_date: new Date(),
    supplier_start_date: escapeHtml(start_date.value),
    supplier_end_date: escapeHtml(end_date.value),
    supplier_special_request: escapeHtml(special_requests.value),
    language: language,
  }, { merge: true })
  .then((e) => {
    console.log('User data successfully added ', e);
  })
  .catch((err) => {
    console.log('there was a problem updating the data', err);
    toastr.error('There was an error updating your info');
  });
}

//Upload user's profile image

/*=========================================================================================================================================================
 * The code provided handles the uploading of a user's profile image. When the profile_img element changes, it checks if the selected file is an image and
 *  initializes a cropper instance for image cropping. The cropped image data is then stored in a hidden input field. The userUploadImage function is
 *  responsible for uploading the image to Firebase Storage. It converts the data URL to a blob and uploads it to the specified storage path. The function
 *  also handles different cases for mobile and desktop devices.
==========================================================================================================================================================*/

const profile_img = document.getElementById('profile_img');
const hiddenProfileInput = document.getElementById('hidden_profile_img');
var modal4 = document.getElementById("cropper_modal");

let profile_cropper;

if (profile_img) {
  profile_img.addEventListener("change", function handleProfilePic(e) {
    e.preventDefault();
    e.stopPropagation();

    let fileItem = profile_img.files[0];

    if (profile_img.files.length === 0) {
      /*
      toastr.error('Please upload your profile picture')
      if (storedLang && storedLang === 'de') {
        toastr.error('Die Datei ist zu umfangreich');
      } else {
        toastr.error('The file size is too large');
      }
      */
    } else {
      // Check if the file is an image
      if (/^image\/\w+/.test(fileItem.type)) {
        // Destroy the current cropper instance if it exists
        if (profile_cropper) {
          profile_cropper.destroy();
        }
        // Open the modal
        modal4.style.display = "flex";
        // Initialize the cropper
        const image = document.getElementById('profile_image_cropper');
        image.src = URL.createObjectURL(fileItem);
        profile_cropper = new Cropper(image, {
          aspectRatio: 3 / 4,
          width: 256,
          height: 341,
          viewMode: 1,
          autoCropArea: 0.7,
          responsive: true,
          crop(event) {
            // Get the cropped canvas data as a data URL
            const canvas = profile_cropper.getCroppedCanvas();
            const dataURL = canvas.toDataURL();

            // Set the data URL as the value of the hidden input field
            hiddenProfileInput.value = dataURL;
          },
        });

        const isMobile = window.innerWidth <= 800;
        if (isMobile) {
        const saveButton = document.getElementById("close_button");
          if (saveButton) {
            saveButton.click();
          }
        }
      } else {
        toastr.error('Please choose an image file.');
        profile_img.value = null;
        if (profile_cropper) {
          profile_cropper.destroy();
        }
      }
    }
  });
}

async function userUploadImage(user, imageId, hiddenProfileInput, fileItem) {

  // Check if it's a mobile device by screen width
  const isMobile = window.innerWidth <= 800;

  if (isMobile) {
    // For mobile, use the original file
    let fileToUpload = fileItem;
    const metadata = {
      contentType: 'image/png',
    };
    const storageRef = ref(storage, 'profiles/' + imageId);
    return uploadBytes(storageRef, fileToUpload, metadata)
      .then((snapshot) => {
        toastr.success('You have updated the profile picture successfully');
        //signup_button.disabled = false;
        //signup_button.style.backgroundColor = '#2b2b2b';
        uploading_image.style.display = 'none';
        fileName.style.display = 'block';
        return `profiles/${imageId}`;
      })
      .catch((err) => {
        console.log('error uploading file', err);
        toastr.error('There was an error uploading the file');
      });
  } else {
    // For desktop, continue with original code
    const dataURL = hiddenProfileInput.value;
    if (!dataURL) {
      toastr.error('There was an error processing the profile picture');
      return;
    }
    // Convert data URL to blob
    return fetch(dataURL)
      .then((res) => res.blob())
      .then((blob) => {
        let fileToUpload;
        if (!blob) {
          console.log('using raw file instead');
          fileToUpload = fileItem;
        } else {
          fileToUpload = blob;
          console.log('Using blob to upload');
        }

        const metadata = {
          contentType: 'image/png',
        };
        const storageRef = ref(storage, 'profiles/' + imageId);
        return uploadBytes(storageRef, fileToUpload, metadata)
          .then((snapshot) => {
            toastr.success('You have updated the profile picture successfully');
            //signup_button.disabled = false;
            //signup_button.style.backgroundColor = '#2b2b2b';
            uploading_image.style.display = 'none';
            fileName.style.display = 'block';
            return `profiles/${imageId}`;
          })
          .catch((err) => {
            console.log('error uploading file', err);
            toastr.error('There was an error uploading the file');
          });
      })
      .catch((err) => {
        console.log('error converting dataURL to blob', err);
        toastr.error('There was an error processing the profile picture');
      });
  }
}

/*============================================================================================================================================================
 * This code adds an event listener to the "close_button" element. When the button is clicked, it generates a temporary ID using the generateTempId function.
 *  It then displays the "uploading_image" element, sets the temporary ID in the session storage, retrieves the file item from the "profile_img" element,
 *  and calls the userUploadImage function to upload the image with the temporary ID.
============================================================================================================================================================*/

const saveButton = document.getElementById("close_button");
if (saveButton) {
  saveButton.addEventListener("click", async function () {
    const tempId = generateTempId();
    uploading_image.style.display = 'block';
    sessionStorage.setItem("tempImageId", tempId);
    const hiddenProfileInput = document.getElementById('hidden_profile_img');
    let fileItem = profile_img.files[0];
    console.log(fileItem);
    await userUploadImage(null, tempId, hiddenProfileInput, fileItem);
  });
}

/*================================================================================================================================================================
 * This function is called on the home page. It identifies the sign-up form (wf-form-signup-form) and assigns an event listener to it. The event listener listens
 * for the form's submission and calls the handleSignUp function.
=================================================================================================================================================================*/

export function signUpPage() {
  //identify auth action forms
  let signUpForm = document.getElementById('wf-form-signup-form');
  //assign event listeners
  if (signUpForm) {
    signUpForm.addEventListener('submit', handleSignUp, true);
  }
  //getDateSignUp()
}
