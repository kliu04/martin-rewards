#!/bin/bash
set -e
cd "$(dirname "$0")"

python3 -m json.tool rewards.pass/pass.json > /dev/null   # catch JSON mistakes
python3 manifest-generator.py

cd rewards.pass
openssl smime -binary -sign \
  -certfile ../certs/wwdr.pem \
  -signer ../certs/signerCert.pem \
  -inkey ../certs/signerKey.pem \
  -in manifest.json -out signature \
  -outform DER -passin pass:12345678

rm -f ../rewards.pkpass
zip -qr ../rewards.pkpass . -x '.*'
echo "Built rewards.pkpass"
