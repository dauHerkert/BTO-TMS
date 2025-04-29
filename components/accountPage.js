import { doc, setDoc, deleteDoc, auth, updateEmail, updatePassword, deleteUser, ref, getDownloadURL, uploadBytes, storage, db, getDocs, user, collection } from './a_firebaseConfig';
import { getUserInfo, escapeHtml } from './ab_base';
import Cropper from 'cropperjs';
import toastr from 'toastr';

/*============================================================================================================================================================
 * This function updates the user's first name, last name, and address in the Firestore database. It uses the provided user object to identify the user, and
 * the newUsername, newUserLastname, and newUserAddress parameters contain the updated values for each field. The function uses the setDoc function to update
 * the document in the database.
=============================================================================================================================================================*/

// Update user info
function updateUsername(user, newUsername, newUserLastname, newUserAddress) {
  const userRef = doc(db, 'users', user.uid);
  let user_fullname = '';
  if (newUsername.value && newUserLastname.value) {
    user_fullname = (newUsername.value + newUserLastname.value).toLowerCase().replace(/\s/g, '');
  }

  setDoc(userRef, {
    user_firstname: escapeHtml(newUsername.value),
    user_lastname: escapeHtml(newUserLastname.value),
    user_fullname: escapeHtml(user_fullname),
    user_address: escapeHtml(newUserAddress.value)
  }, { merge: true })
    .then(() => {
      toastr.success('Username has been successfully updated');
    })
    .catch((error) => {
      toastr.error('There was a problem updating the username');
    });
}

async function changeCompanyNameToID(user) {
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

async function changefirstCompanyNameToID(user) {
  const companiesRef = collection(db, "companies");
  const companiesSnapshot = await getDocs(companiesRef);
  let companyNames = [];
  for (const company of companiesSnapshot.docs) {
    if (user.user_firstcompany.includes(company.id)) {
      companyNames.push(company.data().company_name);
    }
  }
  if (companyNames.length > 0) {
    return companyNames.join(", ");
  } else {
    console.log("No company found with that ID");
  }
}
  
/*=================================================================================================================================================================
  * This function updates the user's email address. It uses the provided user object and the newEmail parameter, which contains the new email address. It uses the
  * updateEmail function to update the email address.
==================================================================================================================================================================*/

    // Update email
function updateUserEmail(user, newEmail, promises) {
  updateEmail(user, newEmail)
    .then(() => {
      toastr.success('Email has been successfully updated');
    })
    .catch((error) => {
      toastr.error('There was a problem updating the email');
    });
}
  
/*============================================================================================================================================================
  * This function updates the user's password. It uses the provided user object and the newPassword parameter, which contains the new password. It uses the
  * updatePassword function to update the password.
=============================================================================================================================================================*/

// Update password
function updateUserPassword(user, newPassword) {
  updatePassword(user, newPassword)
    .then(() => {
      toastr.success('Password has been successfully updated');
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log('errorCode: errorMessage', errorCode, ': ', errorMessage);

      if (errorCode == 'auth/requires-recent-login') {
        toastr.error('Please Sign Out and Sign back in to update your password.');
      } else if (errorCode == 'auth/weak-password') {
        toastr.error('The password must contain at least 6 characters.');
      } else {
        toastr.error('There was a problem updating the password');
        console.error('An error occurred while deleting the user account', error);
      }
    });
}
  
/*==================================================================================================================================================================
  * This function displays the user's profile picture. It uses the getDownloadURL function to retrieve the download URL of the profile picture from Firebase Storage.
  * It then sets the src attribute of the img element with the user_profile_pic ID to the obtained URL.
===================================================================================================================================================================*/

//Display profile picture
function showProfilePic(user){
  getDownloadURL(ref(storage, 'profiles/' + user.uid))
    .then((url) => {
      const img = document.getElementById('user_profile_pic');
      img.setAttribute('src', url);
    })
    .catch((error) => {
      console.log('Error showing the profile picture: ', error);
      toastr.error('There was a problem showing the profile picture');
    });
}
  
/*===================================================================================================================================================================
  * This event listener listens for changes in the updatedPicture input element, which represents the updated profile picture file. When a change occurs, it checks
  * if the selected file is an image. If it is, it initializes the cropper and sets up the cropping functionality using the Cropper library.
====================================================================================================================================================================*/

//Update profile picture
const updatedPicture = document.getElementById('updated_picture');
const hidden_input = document.getElementById('hidden_input2');
const update_picture_modal = document.getElementById('update_picture_modal');
let cropper = null;

if(updatedPicture){
  updatedPicture.addEventListener("change", function handleProfilePic(e) {
    e.preventDefault();
    e.stopPropagation();

    let fileItem = updatedPicture.files[0];

    if (updatedPicture.files.length === 0) {
      toastr.error('Please upload your profile picture');
    } else {
      // Check if the file is an image
      if (/^image\/\w+/.test(fileItem.type)) {
        // Destroy the current cropper instance if it exists
        if (cropper) {
          cropper.destroy();
          cropper = null;
        }
        // Initialize the cropper
        const image = document.getElementById('image_cropper2');
        image.src = URL.createObjectURL(fileItem);
        cropper = new Cropper(image, {
          aspectRatio: 3 / 4,
          width: 200,
          height: 200,
          viewMode: 1,
          autoCropArea: 0.7,
          responsive: true,
          crop(event) {
            // Get the cropped canvas data as a data URL
            const canvas = cropper.getCroppedCanvas();
            const dataURL = canvas.toDataURL();
            // Set the data URL as the value of the hidden input field
            hidden_input.value = dataURL;
          },
        });
      } else {
        toastr.error('Please choose an image file.');
      }
    }
  });
}
  
/*====================================================================================================================================================================
  * This function is triggered when the user submits the form to update their profile picture. It prevents the default form submission behavior, retrieves the cropped
  * canvas from the cropper, converts it to a blob, and uploads it to the Firebase Storage using the uploadBytes function. The updated profile picture is stored
  *  under the profiles directory with the user's ID as the filename. Once the upload is complete, a success message is displayed, and the modal is closed.
=====================================================================================================================================================================*/

function updateProfilePic(e, user) {
  e.preventDefault();
  e.stopPropagation();

  if (cropper) {
    const canvas = cropper.getCroppedCanvas();
    const metadata = {
      contentType: 'image/png'
    };
    canvas.toBlob((blob) => {
      const storageRef = ref(storage, 'profiles/' + update_img_user_id.value);
      uploadBytes(storageRef, blob, metadata)
        .then((snapshot) => {
          toastr.success('You have updated the profile picture successfully');
          setTimeout(function() {
            update_picture_modal.style.display = 'none';
          }, 1000);
        })
        .catch(err => {
          console.log('error uploading file', err);
          toastr.error('There was an error uploading the file');
        });
    });
  } else {
    //toastr.error('Please upload your profile picture');
  }
}

function updateFileLabel() {
  const fileName = document.getElementById("fileName");
  fileName.innerText = updatedPicture.files[0].name;
}

if (update_picture_modal !== null) {
  update_picture_modal.addEventListener('submit', function(ev) {
    updateProfilePic(ev, user);
  }, true);
}
  
/*================================================================================================================================================================
 * This event listener listens for clicks on the deleteButton element. When clicked, it retrieves the currently signed-in user, deletes the user's account using
 * the deleteUser function, and deletes the user's data from Firestore using the deleteDoc function. Depending on the user's selected language (storedLang),
 *  the page is redirected to the appropriate sign-in page after a brief delay. A success message is displayed if the account deletion is successful.
=================================================================================================================================================================*/

let deleteButton = document.getElementById('delete_user');
let storedLang = localStorage.getItem('language');
let urlLang = '/en';
if (storedLang && storedLang === 'de') {
  urlLang = '/de';
}

if (deleteButton) {
  deleteButton.addEventListener("click", async function(user ){
    try {
      // Get the currently signed-in user
      var user = auth.currentUser;
      // Delete the user's account
      deleteUser(user).then(() => {
        setTimeout(function() {
          window.location.pathname = urlLang + "/signin-bto";
        }, 1500);

        toastr.success('User account deleted');
        return deleteDoc(doc(db, "users", user.uid));
      }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log('errorCode: errorMessage', errorCode, ': ', errorMessage);

        if (errorCode == 'auth/requires-recent-login') {
          toastr.error('Please Sign Out and Sign back in to delete your user.');
        } else {
          toastr.error('An error occurred while deleting the user account');
          console.error('An error occurred while deleting the user account', error);
        }
      });
      console.log("User's data deleted from Firestore");
    } catch (error) {
      toastr.error('An error occurred while deleting the user account');
      console.error('An error occurred while deleting the user account', error);
    }
  });
}

/*================================================================================================================================================================
 * This event listener listens for clicks on the deleteButton element. When clicked, it retrieves the currently signed-in user, deletes the user's account
 * using the deleteUser function, and deletes the user's data from Firestore using the deleteDoc function. Depending on the user's selected language (storedLang),
 * the page is redirected to the appropriate sign-in page after a brief delay. A success message is displayed if the account deletion is successful.
=================================================================================================================================================================*/

export async function pageAccount(user) {
  let userInfo = await getUserInfo(user);
  const companyNames = await changefirstCompanyNameToID(userInfo);
  userInfo.user_company_name = companyNames;
  const userRef = doc(db, 'users', user.uid);
  // Populate form fields with values
  document.getElementById("change_email").value = `${user.email}`;
  document.getElementById("new_user_name").value = `${userInfo.user_firstname}`;
  document.getElementById("new_user_lastname").value = `${userInfo.user_lastname}`;
  document.getElementById("new_user_address").value = `${userInfo.user_address}`;
  if (userInfo.user_company_name == undefined) {
    document.getElementById("company_name").innerText = 'No company';
  } else {
    const companies = userInfo.user_company_name.split(",");
    const firstCompany = companies[0];
    document.getElementById("company_name").innerText = `${firstCompany}`;
  }
  if (userInfo.user_address == undefined) {
    document.getElementById("new_user_address").value = "No Address"
  }
  setDoc(userRef, {
    last_signin_date: new Date()
  }, { merge: true })
  .then(() => {
    console.log('login date successfully updated');
  })
  .catch((err) => {
    console.log('there was a problem signin user', err);
    toastr.error('There was an error signin user');
  })

  let update_picture_modal = document.getElementById("picture_form_modal");
  let update_img_user_id = document.getElementById('update_img_user_id');

  // Update info form
  var updateInfoForm = document.getElementById('update_info_form');
    if (updateInfoForm) {
      updateInfoForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var newUsername = document.getElementById('new_user_name');
        var newUserLastname = document.getElementById('new_user_lastname');
        var newUserAddress = document.getElementById('new_user_address');
        var newEmail = document.getElementById('change_email');
        var newPassword = document.getElementById('change_password');
        var confirmPassword = document.getElementById('confirm_password');

        // Promesas de actualización
        var promises = [];

        console.log('firstname ', userInfo.user_firstname !== newUsername.value, ' userInfo ', userInfo.user_firstname, ' new ', newUsername.value);
        console.log('lastname ', userInfo.user_lastname !== newUserLastname.value, ' userInfo ', userInfo.user_lastname, ' new ', newUserLastname.value);

        if (userInfo.user_firstname !== newUsername.value || userInfo.user_lastname !== newUserLastname.value) {
          updateUsername(user, newUsername, newUserLastname, newUserAddress);
        }

        // Esperar a que todas las promesas se resuelvan
        Promise.all(promises)
          .then(() => {
            //toastr.success('Update completed successfully');
            //location.reload();
            if (newPassword.value !== '') {
              if (newPassword.value === confirmPassword.value) {
                promises.push(updateUserPassword(user, newPassword.value));
              } else {
                toastr.error('Password confirmation does not match');
              }
            }
            if (newEmail.value !== user.email) {
              updateUserEmail(user, newEmail.value, promises);
            }
          })
          .catch((error) => {
            toastr.error('There was an error during the update', error);
          });
      }, true);
    }

  if (update_img_user_id) {
    update_img_user_id.value = user.uid;
  }

  if (update_picture_modal) {
    update_picture_modal.addEventListener('submit', function(ev) {
      updateProfilePic(ev, user);
    }, true);
  }
  showProfilePic(user);
  console.log(`Your ID: ${user.uid}`);
}