export type LanguageCode =
  | "en"
  | "hi"
  | "as"
  | "bn"
  | "mni"
  | "kha"
  | "lus"
  | "nag";

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    region: "Standard",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    region: "National",
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    region: "Assam",
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    region: "Tripura / Assam",
  },
  {
    code: "mni",
    name: "Manipuri",
    nativeName: "মৈতৈলোন",
    region: "Manipur",
  },
  {
    code: "kha",
    name: "Khasi",
    nativeName: "Ka Ktien Khasi",
    region: "Meghalaya",
  },
  {
    code: "lus",
    name: "Mizo",
    nativeName: "Mizo ṭawng",
    region: "Mizoram",
  },
  {
    code: "nag",
    name: "Nagamese",
    nativeName: "Nagamese",
    region: "Nagaland",
  },
];
