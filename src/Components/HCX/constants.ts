interface ItemCategory {
  code: string;
  system: string;
  display: string;
}

export const ITEM_CATEGORIES: ItemCategory[] = [
  {
    code: "100000",
    system: "https://irdai.gov.in/benefit-billing-group-code",
    display: "Room & Nursing Charges",
  },
  {
    code: "200000",
    system: "https://irdai.gov.in/benefit-billing-group-code",
    display: "ICU Charges",
  },
  {
    code: "300000",
    system: "https://irdai.gov.in/benefit-billing-group-code",
    display: "OT Charges",
  },
  {
    code: "400000",
    system: "https://irdai.gov.in/benefit-billing-group-code",
    display: "Medicine & Consumables Charges",
  },
  {
    code: "500000",
    system: "https://irdai.gov.in/benefit-billing-group-code",
    display: "Professional Fees Charges",
  },
  {
    code: "600000",
    system: "https://irdai.gov.in/benefit-billing-group-code",
    display: "Investigation Charges",
  },
  {
    code: "700000",
    system: "https://irdai.gov.in/benefit-billing-group-code",
    display: "Ambulance Charges",
  },
  {
    code: "800000",
    system: "https://irdai.gov.in/benefit-billing-group-code",
    display: "Miscellaneous Charges",
  },
  {
    code: "900000",
    system: "https://irdai.gov.in/benefit-billing-group-code",
    display: "Provider Package Charges",
  },
  {
    code: "HBP",
    system: "https://pmjay.gov.in/benefit-billing-group-code",
    display: "NHA Package Charges",
  },
];
