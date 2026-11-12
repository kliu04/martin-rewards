export type RgbColor = `rgb(${number}, ${number}, ${number})`;

export type PassField = {
  key: string;
  value: string | number;
  label?: string;
};

export type PassBarcode = {
  format: "PKBarcodeFormatQR";
  message: string;
  messageEncoding: "iso-8859-1";
};

export type PassLocation = {
  latitude: number;
  longitude: number;
  relevantText: string;
};

export type StoreCard = {
  primaryFields: PassField[];
  secondaryFields?: PassField[];
  auxiliaryFields?: PassField[];
};

export type PassJSON = {
  formatVersion: 1;
  passTypeIdentifier: string;
  teamIdentifier: string;
  serialNumber: string;
  organizationName: string;
  description: string;
  logoText: string;
  backgroundColor: RgbColor;
  foregroundColor: RgbColor;
  labelColor: RgbColor;
  storeCard: StoreCard;
  barcodes: PassBarcode[];
  locations?: PassLocation[];
};
