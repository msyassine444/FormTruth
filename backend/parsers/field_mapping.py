import re
from typing import Dict


# ---------------------------------------------
# Canonical field aliases
# ---------------------------------------------

FIELD_ALIASES: Dict[str, str] = {
    # --- name ---
    "name": "name",
    "fullname": "name",
    "full_name": "name",
    "full-name": "name",
    "your_name": "name",
    "yourname": "name",
    "custname": "name",
    "customer_name": "name",
    "customername": "name",
    "applicant_name": "name",
    "user_name": "name",
    "username": "name",
    "display_name": "name",

    # --- first/last name ---
    "firstname": "first_name",
    "first_name": "first_name",
    "fname": "first_name",
    "given_name": "first_name",
    "lastname": "last_name",
    "last_name": "last_name",
    "lname": "last_name",
    "family_name": "last_name",
    "surname": "last_name",

    # --- email ---
    "email": "email",
    "e-mail": "email",
    "e_mail": "email",
    "mail": "email",
    "your_email": "email",
    "custemail": "email",
    "customer_email": "email",
    "email_address": "email",
    "emailaddress": "email",

    # --- phone ---
    "phone": "phone",
    "tel": "phone",
    "telephone": "phone",
    "mobile": "phone",
    "cell": "phone",
    "cellphone": "phone",
    "mobile_number": "phone",
    "phone_number": "phone",
    "phonenumber": "phone",
    "custtel": "phone",
    "contact_number": "phone",
    "contact": "phone",
    "whatsapp": "phone",

    # --- date of birth ---
    "dob": "dob",
    "date_of_birth": "dob",
    "dateofbirth": "dob",
    "birth_date": "dob",
    "birthdate": "dob",
    "birthday": "dob",
    "bday": "dob",

    # --- address ---
    "address": "address",
    "addr": "address",
    "street": "address",
    "street_address": "address",
    "address_line1": "address",
    "address1": "address",
    "address_line_1": "address",
    "custaddress": "address",
    "home_address": "address",

    # --- city / country / zip ---
    "city": "city",
    "town": "city",
    "country": "country",
    "nation": "country",
    "zip": "postal_code",
    "zipcode": "postal_code",
    "zip_code": "postal_code",
    "postal": "postal_code",
    "postal_code": "postal_code",
    "postcode": "postal_code",

    # --- employment ---
    "company": "company",
    "employer": "company",
    "organization": "company",
    "organisation": "company",
    "org": "company",
    "job_title": "job_title",
    "jobtitle": "job_title",
    "position": "job_title",
    "role": "job_title",
    "job": "job_title",
    "title": "job_title",
    "employment_start": "employment_start",
    "start_date": "employment_start",
    "work_start": "employment_start",
    "employment_end": "employment_end",
    "end_date": "employment_end",
    "work_end": "employment_end",

    # --- education ---
    "university": "university",
    "college": "university",
    "school": "university",
    "institution": "university",
    "degree": "degree",
    "major": "degree",
    "field_of_study": "degree",
    "graduation": "graduation",
    "graduation_date": "graduation",
    "grad_date": "graduation",

    # --- identity ---
    "national_id": "national_id",
    "nationalid": "national_id",
    "id_number": "national_id",
    "idnumber": "national_id",
    "passport": "national_id",
    "passport_number": "national_id",
    "ssn": "national_id",
    "cin": "national_id",

    # --- web ---
    "website": "website",
    "url": "website",
    "portfolio": "website",
    "homepage": "website",
    "site": "website",
    "linkedin": "linkedin",
    "github": "github",
    "twitter": "twitter",

    # --- messaging ---
    "comments": "comments",
    "comment": "comments",
    "message": "comments",
    "notes": "comments",
    "note": "comments",
    "description": "comments",
    "details": "comments",
}


def _clean_key(key: str) -> str:
    """
    نظّف المفتاح:
      - lowercase
      - استبدل - و spaces بـ _
      - احذف [] للـ form arrays
    """
    key = key.strip().lower()
    key = re.sub(r"\[\]$", "", key)          # remove trailing []
    key = re.sub(r"\[\w+\]", "", key)         # remove [something]
    key = key.replace("-", "_")
    key = re.sub(r"\s+", "_", key)
    key = re.sub(r"__+", "_", key)
    return key


def normalize_field_name(key: str) -> str:
    """
    حوّل أي اسم حقل إلى اسم معياري.
    مثال: "custname" → "name"
    """
    if not key:
        return key
    cleaned = _clean_key(key)
    return FIELD_ALIASES.get(cleaned, cleaned)


def normalize_fields(data: dict) -> dict:
    """
    حوّل كل مفاتيح قاموس إلى أسماء معيارية.
    """
    result = {}
    for key, value in data.items():
        normalized = normalize_field_name(key)
        # إذا الاسم المعياري موجود مسبقًا، لا تستبدله
        if normalized not in result:
            result[normalized] = value
    return result