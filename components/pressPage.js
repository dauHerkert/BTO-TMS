import { PRESSCOMPANYID, PRESSCOMPANYPROFILE, PRESSCOMPANYZONES, DEVEMAIL, URLEMAILTEMPLATES, firstImageURL, firstImageStyle, secondImageURL, secondImageStyle } from './a_constants';
import { addDoc, collection, ref, uploadBytes, db, storage, user } from './a_firebaseConfig';
import { escapeHtml } from './ab_base';
import Cropper from 'cropperjs';
import toastr from 'toastr';

/*==========================================================================================================================================================
 * The code defines functions related to adding press information. It updates the press's start date, end date, special request, user zones, and form
 * submission status. It also triggers email notifications based on the language selected and reloads the page after a successful form submission.
===========================================================================================================================================================*/

function pressFormSubmit(e) {
  e.preventDefault();
  e.stopPropagation();

  const submit_button = document.getElementById('submit_button');
  const submit_loader = document.getElementById('submit_loader');
  if (submit_button && submit_loader) {
    submit_button.disabled = true;
    submit_button.classList.add("disabled");
    submit_loader.style.display = "block";
  }

  const pressFormRef = collection(db, 'users');
  let press_title = document.getElementById('press_title');
  let press_lastname = document.getElementById('press_lastname');
  let press_firstname = document.getElementById('press_firstname');
  let user_fullname = '';
  let press_nationality = document.getElementById('press_nationality');
  let press_media_type = document.getElementById('press_media_type');
  let press_media = document.getElementById('press_media');
  let press_email = document.getElementById('press_email');
  let press_confirm_email = document.getElementById('press_confirm_email');
  let press_address = document.getElementById('press_address');
  let press_city = document.getElementById('press_city');
  let press_zip_code = document.getElementById('press_zip_code');
  let press_country = document.getElementById('country');
  let press_phone = document.getElementById('press_phone');
  let press_itwa = document.getElementById('press_itwa');
  let press_workspace = document.getElementById('press_workspace');
  //let press_locker = document.getElementById('press_locker');
  //let press_hotel_info = document.getElementById('press_hotel_info');
  let language = localStorage.getItem('language');
  let press_card_number = document.getElementById('press_card_number')
  let press_issuing_institution = document.getElementById('press_issuing_institution');

  if (press_firstname.value && press_lastname.value) {
    user_fullname = (press_firstname.value + press_lastname.value).toLowerCase().replace(/\s/g, '');
  }
  if (press_email.value !== press_confirm_email.value) {
    toastr.error("The emails don't match");
  } else {
    const docRef = addDoc(pressFormRef, {
      user_title: press_title.value,
      user_lastname: escapeHtml(press_lastname.value),
      user_firstname: escapeHtml(press_firstname.value),
      user_fullname: escapeHtml(user_fullname),
      user_nationality: press_nationality.value,
      press_media_type: press_media_type.value,
      press_media: escapeHtml(press_media.value),
      user_email: escapeHtml(press_email.value),
      user_address: escapeHtml(press_address.value),
      user_city: escapeHtml(press_city.value),
      user_zip_code: escapeHtml(press_zip_code.value),
      user_country: press_country.value,
      user_phone: escapeHtml(press_phone.value),
      user_itwa: press_itwa.value,
      press_workspot: press_workspace.value,
      //press_locker: press_locker.value,
      //press_hotel_info: press_hotel_info.value,
      press_card_number: escapeHtml(press_card_number.value),
      press_issuing_institution: escapeHtml(press_issuing_institution.value),
      press_user_created: new Date(),
      press_form_user: true,
      user_company: PRESSCOMPANYID,
      user_firstcompany: PRESSCOMPANYID,
      account_type: 'Press',
      user_type: PRESSCOMPANYPROFILE,
      user_zones: PRESSCOMPANYZONES,
      user_status: 'Pending',
      confirmed_email: true,
      language: language,
      user_deleted: false
    }, { merge: true })
      .then((docRef) => {
      const press_image = document.getElementById('press_image');
      if (press_image.files.length > 0) {
        const storageRef = ref(storage, `profiles/${docRef.id}`);
        pressUploadImage(docRef.id, storageRef, press_image);
      } else {
        toastr.error('Please upload your press ID');
        if (submit_button && submit_loader) {
          submit_button.disabled = false;
          submit_button.classList.remove("disabled");
          submit_loader.style.display = "none";
        }
      }
    })
    .catch((err) => {
      console.log('there was a problem updating the data', err);
      toastr.error('There was an error updating your info');
      if (submit_button && submit_loader) {
        submit_button.disabled = false;
        submit_button.classList.remove("disabled");
        submit_loader.style.display = "none";
      }
    });
  }
}

/*================================================================================================================================================
* The code handles the selection and cropping of a press image. It listens for changes in the press image input field, initializes the cropper,
* and allows the user to crop the image. It also performs validation to ensure that only image files are selected.
=================================================================================================================================================*/

const press_image = document.getElementById('press_image');
const hiddenPressInput = document.getElementById('hidden_press_img');
const press_crop_modal = document.getElementById("crop_modal");
let press_cropper;
let imageLoaded = false;

function handlePressPic(e) {
  e.preventDefault();
  e.stopPropagation();

  let fileItem = press_image.files[0];

  if (press_image.files.length === 0 || !fileItem) {
    console.error('Please upload your profile picture');
    return;
  }
  if (/^image\/\w+/.test(fileItem.type)) {
    // Get the original file type (jpeg or png)
    let originalType = 'image/jpeg';
    if (fileItem.type === 'image/png') {
      originalType = 'image/png';
    }

    // Open the modal
    press_crop_modal.style.display = "flex";

    if (press_cropper) {
      press_cropper.destroy();
    }

    // Initialize the cropper
    const image = document.getElementById('press_image_cropper');
    image.src = URL.createObjectURL(fileItem);
    image.onload = function () {
      imageLoaded = true;
      press_cropper = new Cropper(image, {
        aspectRatio: 3 / 4,
        width: 256,
        height: 341,
        viewMode: 1,
        autoCropArea: 0.7,
        responsive: true,
        crop(event) {
          const canvas = press_cropper.getCroppedCanvas();
          canvas.toBlob((blob) => {
            const file = new File([blob], "recortedImage." + originalType.split('/')[1], { type: originalType });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            press_image.files = dataTransfer.files;

            // Destroy the cropper after getting the canvas and toBlob
          }, originalType);
        },
      });
    };

    // Auto close the cropper
    const isMobile = window.innerWidth <= 800;
    if (isMobile) {
      //press_crop_modal.style.display = "none";
    }
  } else {
    toastr.error('Please choose an image file.');
  }
}

if (press_image) {
  press_image.addEventListener('change', handlePressPic);
}

/*============================================================================================================================================================
* The code handles the upload and processing of a press image. It checks if the image is loaded and the cropper is initialized, retrieves the necessary
* information (such as file, metadata, and user details), and performs the upload to the storage. It also sends confirmation emails and redirects the user
*  to the appropriate page based on the language and title selected.
=============================================================================================================================================================*/

async function pressUploadImage(docId, storageRef) {
  if (!imageLoaded || !press_cropper) {
    console.error('Image is not loaded or cropper is not initialized.');
    return;
  }
  const fullName = `${press_firstname.value} ${press_lastname.value}`;
  const file = press_image.files[0];
  const contentType = file.type;
  const metadata = {
    contentType: contentType
  };


  let storedLang = localStorage.getItem('language');
  let urlLang = '/en';

  let press_application_received_subject_admin = 'New Press Form Submited';
  // Subject for press - EN - application received
  let press_application_received_subject = 'Application received';
  let form_mr_confirmation_email_to_admin_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLMRMSCONFIRMEMAIL_EN;
  let form_ms_confirmation_email_to_admin_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLMRMSCONFIRMEMAIL_EN;
  let form_diverse_confirmation_email_to_admin_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLDIVERSECONFIRMEMAIL_EN;
  let press_mr_application_received_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLMRMSAPPLICATIONRECEIVED_EN;
  let press_ms_application_received_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLMRMSAPPLICATIONRECEIVED_EN;
  let press_diverse_application_received_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLDIVERSEAPPLICATIONRECEIVED_EN;

  if (storedLang && storedLang === 'de') {
    urlLang = '/de';
    // Subject for press - DE - application received
    press_application_received_subject = 'Antrag eingegangen';
    form_mr_confirmation_email_to_admin_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLMRCONFIRMEMAIL_DE;
    form_ms_confirmation_email_to_admin_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLMSCONFIRMEMAIL_DE;
    form_diverse_confirmation_email_to_admin_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLDIVERSECONFIRMEMAIL_DE;
    press_mr_application_received_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLMRAPPLICATIONRECEIVED_DE;
    press_ms_application_received_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLMSAPPLICATIONRECEIVED_DE;
    press_diverse_application_received_url = URLEMAILTEMPLATES.URLEMAILFOLDER + URLEMAILTEMPLATES.URLDIVERSEAPPLICATIONRECEIVED_DE;
  }

  let genderAdminURL = form_mr_confirmation_email_to_admin_url;
  let genderURL = press_mr_application_received_url;
  let fullNameDisplay = `${press_firstname.value} ${press_lastname.value}`;
  let lastNameDisplay = `${press_lastname.value}`;

  if (press_title.value == 'Ms') {
    genderAdminURL = form_ms_confirmation_email_to_admin_url;
    genderURL = press_ms_application_received_url;
  } else if (press_title.value == 'Diverse') {
    genderAdminURL = form_diverse_confirmation_email_to_admin_url;
    genderURL = press_diverse_application_received_url;
  }


  if (press_cropper && press_cropper.getCroppedCanvas()) {
    const canvas = press_cropper.getCroppedCanvas();
    canvas.toBlob((blob) => {
      let fileToUpload;
      if (!blob) {
        console.error('Failed to generate Blob object.');
        console.log('Using raw file instead');
        fileToUpload = file;
      } else {
        fileToUpload = blob;
        console.log('Using blob to upload');
      }

      console.log('fileToUpload', fileToUpload);

      //const imageSize = blob.size; // Size of the image in bytes
      //console.log('Image Size:', imageSize);

      uploadBytes(storageRef, fileToUpload, metadata)
        .then((snapshot) => {

          if (storedLang && storedLang === 'de') {
            toastr.success('Sie haben das Formular erfolgreich übermittelt');
          } else {
            toastr.success('You have submitted the form successfully');
          }

          // Form confirmation email to admin
          (async () => {
            try {
              const html = await fetch(genderAdminURL)
                .then(response => response.text())
                .then(html => html.replace('${fullName}', fullNameDisplay))
                .then(html => html.replace('${firstImageURL}', firstImageURL))
                .then(html => html.replace('${firstImageStyle}', firstImageStyle))
                .then(html => html.replace('${secondImageURL}', secondImageURL))
                .then(html => html.replace('${secondImageStyle}', secondImageStyle));
              const docRef = addDoc(collection(db, "mail"), {
                to: DEVEMAIL,
                message: {
                  subject: press_application_received_subject_admin,
                  html: html,
                }
              });
            } catch (error) {
              console.error(error);
            }
          })();
          // Press - Application received - MR - MS - DIVERSE
          (async () => {
            try {
              const html = await fetch(genderURL)
                .then(response => response.text())
                .then(html => html.replace('${fullName}', lastNameDisplay))
                .then(html => html.replace('${firstImageURL}', firstImageURL))
                .then(html => html.replace('${firstImageStyle}', firstImageStyle))
                .then(html => html.replace('${secondImageURL}', secondImageURL))
                .then(html => html.replace('${secondImageStyle}', secondImageStyle));
              const docRef = addDoc(collection(db, "mail"), {
                to: `${press_email.value}`,
                message: {
                  subject: press_application_received_subject,
                  html: html,
                }
              });
            } catch (error) {
              console.error(error);
            }
            setTimeout(function () {
              window.location.pathname = urlLang + '/press-form-submitted';
            }, 1500);
          })();
      })
      .catch((error) => {
        console.error(error);
      });
    }, contentType);
  } else {
    console.error('Canvas is not available. The cropper might not be initialized properly or the image is not loaded.');
  }
}

/*==============================================================================================================================================================
* The code is responsible for handling the press page functionality. It performs various validations on the required fields, checks if checkboxes are checked,
* validates the press image file input, checks for identical emails, and submits the press form if there are no errors. It also displays appropriate error
* messages based on the selected language.
===============================================================================================================================================================*/

export async function pagePress() {
  const press_form = document.getElementById('logout_press_form');
  const submit_button = document.getElementById('submit_button');
  const requiredFields = document.querySelectorAll("[required]");
  const press_image = document.getElementById('press_image');
  const storedLang = localStorage.getItem("language");
  let checkboxesChecked = false;

  requiredFields.forEach(field => {
    field.addEventListener('change', function() {
      if (!this.value) {
        this.style.border = "2px solid red";
      } else {
        this.style.border = "none";
        this.style.borderBottom = "1px solid #cccccc";
      }
    });
  });

  submit_button.addEventListener('click', function(ev) {
    ev.preventDefault();

    let hasErrors = false;
    let uncheckedCheckboxesCount = 0;

    // Validate the required fields
    for (let i = 0; i < requiredFields.length; i++) {
      if (!requiredFields[i].value) {
        requiredFields[i].style.border = "2px solid red";
        hasErrors = true;
      } else if (requiredFields[i].type === "email") {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(requiredFields[i].value)) {
          requiredFields[i].style.border = "2px solid red";
          hasErrors = true;
        }
      } else if (requiredFields[i].type === "checkbox") {
        if (!requiredFields[i].checked) {
          uncheckedCheckboxesCount++;
          requiredFields[i].parentNode.style.border = "2px solid red";

          requiredFields[i].addEventListener("change", function() {
            if (requiredFields[i].checked) {
              // Remove the red border if the checkbox is checked
              requiredFields[i].parentNode.style.border = "none";
            }
          });

        } else {
          requiredFields[i].parentNode.style.border = "none";
        }
      } else if (requiredFields[i].id === "press_phone") {
        // Validate phone number if needed
      } else if (requiredFields[i].id === "press_zip_code") {
        // Validate zip code if needed
      }
    }

    // Display the error message only once for all unchecked checkboxes
    if (uncheckedCheckboxesCount > 0) {
      hasErrors = true;
      if (storedLang && storedLang === 'de') {
        toastr.error('Bitte stellen Sie sicher, dass alle rechtlichen Hinweise vor dem Absenden des Formulars angekreuzt sind.');
      } else {
        toastr.error('Please ensure that all legal notices are checked before submitting the form.');
      }
    }

    // Validate the press image file input
    if (press_image.files.length === 0) {
      hasErrors = true;
      if (storedLang && storedLang === 'de') {
        toastr.error('Bitte laden Sie Ihr Profilbild hoch');
      } else {
        toastr.error('Please upload your profile image');
      }
    }

    // Check for identical emails
    if ($('#press_email').length && $('#press_confirm_email').length) {
      if ($('#press_email').val() != $('#press_confirm_email').val()) {
        hasErrors = true;
        if (storedLang && storedLang === 'de') {
          toastr.error('Bitte verwenden Sie die gleiche E-mail');
        } else {
          toastr.error('Please make sure to use the same E-mail');
        }
      }
    }

    if (!hasErrors) {
      checkboxesChecked = true;
    }

    if (!hasErrors && checkboxesChecked) {
      pressFormSubmit(ev);
    }
  });
}