import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";
import { PKPass } from "passkit-generator";
import { Buffer } from "node:buffer";

import type { PassJSON } from "./passTypes.ts";
import type { Database, Tables } from "../_shared/database.types.ts";

type Customer = Tables<"customers">;

type PassFile =
  | "icon.png"
  | "icon@2x.png"
  | "icon@3x.png"
  | "logo.png"
  | "logo@2x.png"
  | "logo@3x.png"
  | "pass.json";

type PassFiles = Record<PassFile, Buffer>;

async function readAsset(name: string): Promise<Buffer> {
  return Buffer.from(
    await Deno.readFile(new URL(`./assets/${name}`, import.meta.url)),
  );
}

const images = {
  "icon.png": await readAsset("icon.png"),
  "icon@2x.png": await readAsset("icon@2x.png"),
  "icon@3x.png": await readAsset("icon@3x.png"),
  "logo.png": await readAsset("logo.png"),
  "logo@2x.png": await readAsset("logo@2x.png"),
  "logo@3x.png": await readAsset("logo@3x.png"),
};

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing secret: ${name}`);
  }
  return value;
}

function buildPassSecrets() {
  return {
    wwdr: atob(requireEnv("WWDR")),
    signerCert: atob(requireEnv("SIGNER_CERT")),
    signerKey: atob(requireEnv("SIGNER_KEY")),
  };
}

const secrets = buildPassSecrets();

function buildPassFiles(customer: Customer): PassFiles {
  return {
    ...images,
    "pass.json": Buffer.from(JSON.stringify(buildPassJSON(customer))),
  };
}

function buildPassJSON(customer: Customer): PassJSON {
  return {
    formatVersion: 1,
    passTypeIdentifier: "pass.com.martinespressobar.rewards",
    teamIdentifier: "8HCVC4VFUN", // Contained in pass.com.martinespressobar.rewards
    serialNumber: customer.id,
    organizationName: "Martin Espresso Bar",
    description: "Loyalty card for Martin Espresso Bar",
    logoText: "Martin Espresso Bar",
    backgroundColor: "rgb(255, 198, 0)",
    foregroundColor: "rgb(0, 0, 0)",
    labelColor: "rgb(60, 60, 60)",
    storeCard: {
      primaryFields: [
        { key: "stamps", label: "STAMPS", value: customer.stamps },
      ],
      secondaryFields: [
        { key: "name", label: "NAME", value: customer.name },
      ],
    },
    locations: [
      {
        "latitude": 0,
        "longitude": 0,
        "relevantText": "Welcome to Martin Espresso Bar!",
      },
    ],
    barcodes: [
      {
        format: "PKBarcodeFormatQR",
        message: "https://google.ca",
        messageEncoding: "iso-8859-1",
      },
    ],
  };
}

export default {
  fetch: withSupabase<Database>({ auth: ["publishable"] }, async (req, ctx) => {
    const { name, rawEmail } = await req.json();
    const email = String(rawEmail).trim().toLowerCase();

    if (name === undefined || email === undefined) {
      throw new Error("Invalid input: name and email are required");
    }

    const { data: customer, error } = await ctx.supabaseAdmin
      .from("customers")
      .upsert({ name, email }, { onConflict: "email" })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    const pass = new PKPass(
      buildPassFiles(customer),
      secrets,
    );

    return new Response(new Uint8Array(pass.getAsBuffer()), {
      headers: { "Content-Type": "application/vnd.apple.pkpass" },
    });
  }),
};
