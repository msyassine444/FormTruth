// AUTO-GENERATED FILE - DO NOT EDIT BY HAND.
// Source of truth: backend/parsers/fields.json
// Regenerate with: python tools/sync_fields.py

export const FIELD_VOCABULARY = {
  "version": 1,
  "groups": [
    "identity",
    "contact",
    "address",
    "work",
    "education",
    "employment",
    "other"
  ],
  "fields": {
    "name": {
      "aliases": [
        "name",
        "fullname",
        "full_name",
        "full-name",
        "your_name",
        "yourname",
        "custname",
        "customer_name",
        "customername",
        "applicant_name",
        "display_name",
        "الاسم",
        "الإسم"
      ],
      "group": "identity",
      "type": "text",
      "label": "Full name",
      "placeholder": "Sara El Idrissi",
      "in_profile": true
    },
    "first_name": {
      "aliases": [
        "firstname",
        "first_name",
        "fname",
        "given_name",
        "prénom",
        "prenom",
        "الاسم الأول",
        "الإسم الأول",
        "الاسم_الأول",
        "الإسم_الأول"
      ],
      "group": "identity",
      "type": "text",
      "label": "First name",
      "placeholder": "Sara",
      "in_profile": true
    },
    "last_name": {
      "aliases": [
        "lastname",
        "last_name",
        "lname",
        "family_name",
        "surname",
        "nom_de_famille",
        "الاسم الأخير",
        "الإسم الأخير",
        "الاسم_الأخير",
        "الإسم_الأخير",
        "اسم العائلة",
        "اسم_العائلة",
        "النسب"
      ],
      "group": "identity",
      "type": "text",
      "label": "Last name",
      "placeholder": "El Idrissi",
      "in_profile": true
    },
    "email": {
      "aliases": [
        "email",
        "e-mail",
        "e_mail",
        "mail",
        "your_email",
        "custemail",
        "customer_email",
        "email_address",
        "emailaddress",
        "البريد الإلكتروني",
        "البريد_الإلكتروني",
        "الايميل",
        "الإيميل",
        "البريد",
        "courriel"
      ],
      "group": "contact",
      "type": "email",
      "label": "Email",
      "placeholder": "sara@example.com",
      "in_profile": true
    },
    "phone": {
      "aliases": [
        "phone",
        "tel",
        "telephone",
        "mobile",
        "cell",
        "cellphone",
        "mobile_number",
        "phone_number",
        "phonenumber",
        "custtel",
        "contact_number",
        "contact",
        "whatsapp",
        "رقم الهاتف",
        "رقم_الهاتف",
        "الهاتف",
        "الجوال",
        "رقم الجوال",
        "رقم_الجوال",
        "téléphone",
        "numéro_téléphone"
      ],
      "group": "contact",
      "type": "phone",
      "label": "Phone",
      "placeholder": "+212 600 000 000",
      "in_profile": true
    },
    "dob": {
      "aliases": [
        "dob",
        "date_of_birth",
        "dateofbirth",
        "birth_date",
        "birthdate",
        "birthday",
        "bday",
        "تاريخ الميلاد",
        "تاريخ_الميلاد",
        "date_de_naissance"
      ],
      "group": "identity",
      "type": "date",
      "label": "Date of birth",
      "placeholder": "1995-04-23",
      "in_profile": true
    },
    "address": {
      "aliases": [
        "address",
        "addr",
        "street",
        "street_address",
        "address_line1",
        "address1",
        "address_line_1",
        "custaddress",
        "home_address",
        "العنوان",
        "adresse"
      ],
      "group": "address",
      "type": "text",
      "label": "Street address",
      "placeholder": "12 Rue Example",
      "in_profile": true
    },
    "city": {
      "aliases": [
        "city",
        "town",
        "المدينة",
        "ville"
      ],
      "group": "address",
      "type": "text",
      "label": "City",
      "placeholder": "Marrakesh",
      "in_profile": true
    },
    "country": {
      "aliases": [
        "country",
        "nation",
        "الدولة",
        "البلد",
        "pays"
      ],
      "group": "address",
      "type": "text",
      "label": "Country",
      "placeholder": "Morocco",
      "in_profile": true
    },
    "postal_code": {
      "aliases": [
        "zip",
        "zipcode",
        "zip_code",
        "postal",
        "postal_code",
        "postcode",
        "الرمز البريدي",
        "الرمز_البريدي",
        "code_postal"
      ],
      "group": "address",
      "type": "text",
      "label": "Postal code",
      "placeholder": "40000",
      "in_profile": true
    },
    "company": {
      "aliases": [
        "company",
        "employer",
        "organization",
        "organisation",
        "org",
        "الشركة",
        "entreprise",
        "société"
      ],
      "group": "work",
      "type": "text",
      "label": "Company",
      "placeholder": "Acme Ltd",
      "in_profile": true
    },
    "job_title": {
      "aliases": [
        "job_title",
        "jobtitle",
        "position",
        "role",
        "job",
        "title"
      ],
      "group": "work",
      "type": "text",
      "label": "Job title",
      "placeholder": "Designer",
      "in_profile": true
    },
    "employment_start": {
      "aliases": [
        "employment_start",
        "start_date",
        "work_start"
      ],
      "group": "employment",
      "type": "date",
      "label": "Employment start",
      "placeholder": "2022-09-01",
      "in_profile": true
    },
    "employment_end": {
      "aliases": [
        "employment_end",
        "end_date",
        "work_end"
      ],
      "group": "employment",
      "type": "date",
      "label": "Employment end",
      "placeholder": "2024-06-30",
      "in_profile": true
    },
    "university": {
      "aliases": [
        "university",
        "college",
        "school",
        "institution"
      ],
      "group": "education",
      "type": "text",
      "label": "University",
      "placeholder": "Mohammed V University",
      "in_profile": true
    },
    "degree": {
      "aliases": [
        "degree",
        "major",
        "field_of_study"
      ],
      "group": "education",
      "type": "text",
      "label": "Degree / major",
      "placeholder": "Computer Science",
      "in_profile": true
    },
    "graduation": {
      "aliases": [
        "graduation",
        "graduation_date",
        "grad_date"
      ],
      "group": "education",
      "type": "date",
      "label": "Graduation date",
      "placeholder": "2027-06-15",
      "in_profile": true
    },
    "national_id": {
      "aliases": [
        "national_id",
        "nationalid",
        "id_number",
        "idnumber",
        "passport",
        "passport_number",
        "ssn",
        "cin"
      ],
      "group": "identity",
      "type": "text",
      "label": "ID / passport no.",
      "placeholder": "AB123456",
      "in_profile": true
    },
    "website": {
      "aliases": [
        "website",
        "url",
        "portfolio",
        "homepage",
        "site",
        "الموقع الإلكتروني",
        "الموقع_الإلكتروني",
        "الموقع",
        "site_web",
        "siteweb"
      ],
      "group": "contact",
      "type": "url",
      "label": "Website",
      "placeholder": "https://example.com",
      "in_profile": true
    },
    "linkedin": {
      "aliases": [
        "linkedin"
      ],
      "group": "other",
      "type": "text",
      "label": "Linkedin",
      "placeholder": "",
      "in_profile": false
    },
    "github": {
      "aliases": [
        "github"
      ],
      "group": "other",
      "type": "text",
      "label": "Github",
      "placeholder": "",
      "in_profile": false
    },
    "twitter": {
      "aliases": [
        "twitter"
      ],
      "group": "other",
      "type": "text",
      "label": "Twitter",
      "placeholder": "",
      "in_profile": false
    },
    "comments": {
      "aliases": [
        "comments",
        "comment",
        "message",
        "notes",
        "note",
        "description",
        "details"
      ],
      "group": "other",
      "type": "text",
      "label": "Comments",
      "placeholder": "",
      "in_profile": false
    }
  }
};

export const FIELD_CANONICALS = Object.keys(FIELD_VOCABULARY.fields);

export default FIELD_VOCABULARY;
