#!/usr/bin/python3

import base64

CERTS_DIR = "certs"
ENV_FILE = "supabase/functions/.env"


FILES = {
    "WWDR": "wwdr.pem",
    "SIGNER_CERT": "signerCert.pem",
    "SIGNER_KEY": "signerKey.plain.pem",
}


with open(ENV_FILE, "w") as env:
    for name, file in FILES.items():
        with open(f"{CERTS_DIR}/{file}", "rb") as f:
            encoded = base64.b64encode(f.read()).decode("ascii")
        env.write(f"{name}={encoded}\n")
