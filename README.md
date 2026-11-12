# Martin Espresso Bar Loyalty Program

A loyalty rewards program for [Martin Espresso Bar](https://martinespressobar.ca/). Users can collect stamps in their Apple Wallet and redeem them for free coffee.

## Setup

### Pass Type ID

The [Pass Type ID](https://developer.apple.com/account/resources/identifiers/list/passTypeId) identifies this kind of pass to Apple. Ours is `pass.com.martinespressobar.rewards`, owned
by team `8HCVC4VFUN`.

- **Every card shares it.** All customers' cards have the same Pass Type
  ID.
- **The certificate is issued for it.** The signing certificate only
  allows signing passes of this type, so `passTypeIdentifier` and
  `teamIdentifier` in the pass must match the certificate.
- **Updates are addressed by it.** A phone asking for a newer card
  identifies it by Pass Type ID and serial number.
- **It never changes or expires.** The certificate is renewed each year,
  but the Pass Type ID stays the same.

### Pass signing certificates

Apple Wallet only accepts passes signed with a Pass Type ID certificate.
This section explains how to create the certificate files and load them
into the project. You need to do this once per machine, and again when the
certificate expires.

**Current certificate expires: Dec 10, 2027.**

#### Files this produces

Everything goes in `certs/`.

| File                  | What it is                                                             | Secret? |
| --------------------- | ---------------------------------------------------------------------- | ------- |
| `pass.p12`            | Certificate and private key, exported from Keychain. Keep as a backup. | Yes     |
| `signerCert.pem`      | The Pass Type ID certificate                                           | No      |
| `signerKey.pem`       | The private key, encrypted with a passphrase                           | Yes     |
| `signerKey.plain.pem` | The private key, unencrypted. This is what supabase uses.              | Yes     |
| `AppleWWDRCAG4.cer`   | Apple's intermediate certificate, as downloaded                        | No      |
| `wwdr.pem`            | Apple's intermediate certificate, converted                            | No      |

#### 1. Create a certificate signing request (CSR)

1. Open **Keychain Access**.
2. Menu bar: **Keychain Access → Certificate Assistant → Request a
   Certificate From a Certificate Authority**.
3. Enter your email and a name. Leave "CA Email" blank.
4. Save the `.certSigningRequest` file to disk.

#### 2. Create the certificate

1. Go to <https://developer.apple.com/account/resources/certificates/add>.
2. Choose **Pass Type ID Certificate**.
3. Select `pass.com.martinespressobar.rewards`.
4. Upload the CSR from step 1.
5. Download the resulting `pass.cer`.

#### 3. Install it and export a .p12

1. Double-click `pass.cer` and drag it to the **login** keychain.
2. In Keychain Access, select **login**, then the **My Certificates** tab.
3. Find "Pass Type ID: pass.com.martinespressobar.rewards".
4. Right-click the certificate → **Export** → save as `certs/pass.p12`
   and set an export password. If exporting to `.p12` fails, make sure it is in the **login** keychain.

#### 4. Download Apple's intermediate certificate

From <https://www.apple.com/certificateauthority/>, download
**Worldwide Developer Relations - G4** and save it as
`certs/AppleWWDRCAG4.cer`.

#### 5. Convert everything to PEM

```bash
cd certs

# Certificate (asks for the .p12 export password)
openssl pkcs12 -in pass.p12 -clcerts -nokeys -out signerCert.pem -legacy

# Private key (asks for the .p12 password, then a new PEM passphrase)
openssl pkcs12 -in pass.p12 -nocerts -out signerKey.pem -legacy

# Unencrypted key in the traditional format (asks for the PEM passphrase)
openssl rsa -in signerKey.pem -out signerKey.plain.pem -traditional

# Apple's intermediate certificate
openssl x509 -inform der -in AppleWWDRCAG4.cer -out wwdr.pem
```

The function uses `signerKey.plain.pem`. The signing library could not
decrypt the passphrase-protected key, so the unencrypted one is stored as
a Supabase secret instead.

#### 6. Load the certificates into the local environment

From the project root:

```bash
python3 scripts/make_env.py
```

This base64-encodes the three PEM files and writes them to
`supabase/functions/.env` as `WWDR`, `SIGNER_CERT` and `SIGNER_KEY`.

#### Renewing

Pass Type ID certificates last about a year and cannot be extended.
Before the expiry date:

1. Repeat steps 1 to 8. The Pass Type ID stays the same.
2. Confirm a newly issued pass opens in Wallet.
3. Revoke the old certificate on the developer site.

Cards already in customers' Wallets are not affected by a renewal.

#### If something goes wrong

| Error                                                   | Cause                                                                |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| `Could not add PKCS#7 signer; no private key specified` | The function was given the encrypted key. Use `signerKey.plain.pem`. |
| `Missing secret: ...`                                   | The `.env` line is missing, or the function was not restarted.       |

## Creating a Pass Manually

The `rewards.pass` folder contains an example pass that can be built
without the Edge Function.

```bash
./build.sh
```

The script does three things:

1. Generates `manifest.json`, which lists the SHA-1 hash of every file in
   the folder.
2. Signs the manifest with the certificates in `certs/` to create the
   `signature` file.
3. Zips the folder's contents into `rewards.pkpass`. A `.pkpass` file is a
   zip archive with a different extension.

## Deploy

### One-time Setup

```sh
supabase login
supabase link --project-ref <project-ref>
```

### Local

```sh
supabase start             # start local Postgres, API and dashboard
supabase db reset          # apply migrations to the local database
supabase functions serve   # run the functions with hot reload (optionally add --debug)
```

#### Database Types

To let code use the database schema types, run the below command and importing will be allowed from "../_shared/database.types.ts";

The functions import TypeScript types for the database schema from
`supabase/functions/_shared/database.types.ts`. Generate that file with:

```bash
supabase gen types typescript --local > supabase/functions/_shared/database.types.ts
```

### Remote (Prod)

```sh
supabase db push
supabase secrets set --env-file supabase/functions/.env
supabase functions deploy
```

## Usage

Generate a new pass by running:

```sh
curl -L -X POST 'https://lvapjgjhzqkkoswerbcc.supabase.co/functions/v1/issue-pass' \
  -H 'Authorization: Bearer sb_publishable_h7niXfsmgHZPRgZ2OxQq4w_CaYwJAxT' \
  -H 'apikey: sb_publishable_h7niXfsmgHZPRgZ2OxQq4w_CaYwJAxT' \
  -H 'Content-Type: application/json' \
  --data '{"name":"<your-name-here>", "email": "<your-email-here>"}'
  --output test.pkpass
```
