/*===================================================================================================================================
 * Dev constants
 ====================================================================================================================================*/

 const PSNAME = '-bto'; // Project slug name
 export const DEVEMAIL = ['juan.torres@dauherkert.de']; // Dev admin email ['juan.torres@dauherkert.de']

 /* Authorized event dates */
 export const EVENTDATES = {
  MINDATE_DAY: 11,
  MINDATE_MONTH: 6,
  MAXDATE_DAY: 22,
  MAXDATE_MONTH: 6
 }
 
 /* Environment Domain */
 /* needs to be changed manually on register_de_email.html & register_en_email.html & storage.cors.json */
 /* TODO: Check if it can be centralized also in the above mentioned pages. */
 export const URLENV = 'https://credential-berlin-tennis-open.webflow.io/'; //'https://credentials.porsche-tennis.com/';
 
 /* URL Pages */
 export const URLACCOUNT = '/account';
 export const URLADMIN = '/admin/users-table';
 export const URLSIGNIN = '/signin' + PSNAME;
 export const URLSIGNUP = '/signup' + PSNAME;

 /* Admin create user default dates */
 export const SUPPLIERSTARTDATE = '06-11-2025'; //'04-09-2025';
 export const SUPPLIERENDDATE = '06-22-2025'; //'04-21-2025';

 /**/
 export const DEFAULTCOMPANYID = 'vbIh3G2eLIOVEvXmKDKf'; // Not in Use
 export const PRESSCOMPANYID = 'JVhBWwwfdL03n4mh57rG';
 
 /* URL Webflow Assets for Images and Icons */
 /* must be changed manually in each email template, where the respective asset is used */
 /* TODO: Check if it can be centralized also in the above mentioned pages. */
 export const URLASSETS = 'https://cdn.prod.website-files.com/68010117e67f664fd33de186/';
 /* ASSETS - Icons */
 export const ICON_LOGOUT = '68010117e67f664fd33de194_logout_icon.svg';
 export const ICON_PENCIL = '68010117e67f664fd33de1c3_pencil-alt.png';
 export const ICON_TRASH = '68010117e67f664fd33de1d9_trash.png';
 export const ICON_SENDMAIL = '68010117e67f664fd33de228_Vector.png'; // Send Email icon
 /* ASSETS - Images */
 export const IMAGE_PROFILE = '68010117e67f664fd33de19e_profile%20picture.png'; // FallBack Profile Picture
 
 /* Email Templates */
 export const URLEMAILTEMPLATES = {
   URLEMAILFOLDER: 'https://raw.githubusercontent.com/dauHerkert/BTO-TMS/master/mails_templates/',
   URLREGISTER_EN: 'register_en_email.html',
   URLREGISTER_DE: 'register_de_email.html',
   URLREGISTRATIONLINK_EN: 'registration_link_en_email.html',
   URLREGISTRATIONLINK_DE: 'registration_link_de_email.html',
   
   /* Press */
   URLMRAPPLICATIONREJECT_EN: 'press_en_mr_application_rejected.html',
   URLMRAPPLICATIONREJECT_DE: 'press_de_mr_application_rejected.html',
   URLMSAPPLICATIONREJECT_EN: 'press_en_ms_application_rejected.html',
   URLMSAPPLICATIONREJECT_DE: 'press_de_ms_application_rejected.html',
   URLDIVERSEAPPLICATIONREJECT_EN: 'press_en_diverse_application_rejected.html',
   URLDIVERSEAPPLICATIONREJECT_DE: 'press_de_diverse_application_rejected.html',
   
   URLMRAPPLICATIONACCEPT_EN: 'press_en_mr_application_accepted.html',
   URLMRAPPLICATIONACCEPT_DE: 'press_de_mr_application_accepted.html',
   URLMSAPPLICATIONACCEPT_EN: 'press_en_ms_application_accepted.html',
   URLMSAPPLICATIONACCEPT_DE: 'press_de_ms_application_accepted.html',
   URLDIVERSEAPPLICATIONACCEPT_EN: 'press_en_diverse_application_accepted.html',
   URLDIVERSEAPPLICATIONACCEPT_DE: 'press_de_diverse_application_accepted.html',
   
   URLMRMSCONFIRMEMAIL_EN: 'form_en_mr_ms_confirmation_form_to_admin.html',
   URLMRCONFIRMEMAIL_DE: 'form_de_mr_confirmation_email_to_admin.html',
   URLMSCONFIRMEMAIL_DE: 'form_de_ms_confirmation_email_to_admin.html',
   URLDIVERSECONFIRMEMAIL_EN: 'form_en_diverse_confirmation_form_to_admin.html',
   URLDIVERSECONFIRMEMAIL_DE: 'form_de_diverse_confirmation_email_to_admin.html',
   
   URLMRMSAPPLICATIONRECEIVED_EN: 'press_en_mr_ms_application_received.html',
   URLMRAPPLICATIONRECEIVED_DE: 'press_de_mr_application_received.html',
   URLMSAPPLICATIONRECEIVED_DE: 'press_de_ms_application_received.html',
   URLDIVERSEAPPLICATIONRECEIVED_EN: 'press_en_diverse_application_received.html',
   URLDIVERSEAPPLICATIONRECEIVED_DE: 'press_de_diverse_application_received.html',
   
   /* Supplier */
   URLSUPPLIERAPPLICATIONREJECT_EN: 'supplier_en_application_rejected.html',
   URLSUPPLIERAPPLICATIONREJECT_DE: 'supplier_de_application_rejected.html',
   
   URLSUPPLIERAPPLICATIONACCEPT_EN: 'supplier_en_application_accepted.html',
   URLSUPPLIERAPPLICATIONACCEPT_DE: 'supplier_de_application_accepted.html',
   
   URLSUPPLIERFORMCONFIRM_EN: 'supplier_en_form_confirmation.html',
   URLSUPPLIERFORMCONFIRM_DE: 'supplier_de_form_confirmation.html',
   URLSUPPLIERFORMCHANGE_EN: 'supplier_en_form_changes.html',
   URLSUPPLIERFORMCHANGE_DE: 'supplier_de_form_changes.html'
  };

/*===================================================================================================================================
 * RESOURCES inside HTML Email templates
 ====================================================================================================================================*/
  /* ASSETS - Images - used in email templates */
  /* TODO: Check if it can be centralized also in the above mentioned pages. */
  //export const IMAGE_LOGO_1 = '646cfb757ce45f61d4ce8927_Color%3DDefault.png';
  //export const IMAGE_LOGO_2 = '646cfb750cadf08ca3047b91_Color%3DDefault%20(1).png';

 /* ASSETS - Images - used in email templates */
 export const firstImageURL = "https://cdn.prod.website-files.com/68010117e67f664fd33de186/68118591861fe7c407eebac3_BTO.png";
 export const firstImageStyle = "max-height: 90px;width: auto;max-width: 220px;";

 export const secondImageURL = "https://cdn.prod.website-files.com/68010117e67f664fd33de186/68010117e67f664fd33de297_WTA_Logo_WTA500_CMYK_Black.png";
 export const secondImageStyle = "max-height: 100px;width: 70%;max-width: 150px;";


/*===================================================================================================================================
 * CORS configuration to set on https://console.cloud.google.com/welcome?project=bho-copy&cloudshell=true
 * Documentation https://cloud.google.com/storage/docs/gsutil/commands/cors - https://stackoverflow.com/questions/71193348/firebase-storage-access-to-fetch-at-has-been-blocked-by-cors-policy-no-ac
 * Needed for storage image usage
 * Set the correct domain
 * Command to set CORS: gsutil cors set cors.json gs://<your-cloud-storage-bucket>
 * Command to get CORS: gsutil cors get gs://<your-cloud-storage-bucket>
 ====================================================================================================================================*/
 /*
 [
  {
    "origin": ["https://credential-berlin-tennis-open.webflow.io/", "https://credentials.berlintennisopen.com/"],
    "responseHeader": ["Content-Type", "Content-Length", "Content-Encoding", "Content-Disposition", "Access-Control-Allow-Origin"],
    "method": ["GET", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600
  }
 ]
 */
