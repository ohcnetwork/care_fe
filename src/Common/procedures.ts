interface Procedure {
  code: string;
  name?: string;
  price: number;
}

const PROCEDURES: Procedure[] = [
  { code: "D0140", name: "Extraction", price: 100 },
  { code: "D0150", name: "Crown", price: 200 },
  { code: "D0160", name: "Bridge", price: 300 },
  { code: "D0170", name: "Denture", price: 400 },
  { code: "D0180", name: "Root Canal", price: 500 },
  { code: "D0210", name: "Sealant", price: 600 },
  { code: "D0220", name: "Fluoride", price: 700 },
  { code: "D0230", name: "Space Maintainer", price: 800 },
  { code: "D0240", name: "Extraction", price: 900 },
  { code: "D0274", name: "Pit and Fissure Sealant", price: 1000 },
  { code: "D0330", name: "Bite Wing X-Ray", price: 1100 },
  { code: "D0332", name: "Periapical X-Ray", price: 1200 },
  { code: "D0334", name: "Occlusal X-Ray", price: 1300 },
  { code: "D0336", name: "Panoramic X-Ray", price: 1400 },
  { code: "D1110", name: "Prophylaxis", price: 1500 },
  { code: "D1120", name: "Periodontal Maintenance", price: 1600 },
  { code: "D1206", name: "Periodontal Scaling", price: 1700 },
  { code: "D1207", name: "Root Planing", price: 1800 },
  { code: "D4341", name: "Amalgam", price: 1900 },
  { code: "D4342", name: "Composite", price: 2000 },
  { code: "D4343", name: "Glass Ionomer", price: 2100 },
  { code: "D4346", name: "Resin", price: 2200 },
  { code: "D4347", name: "Sealant", price: 2300 },
  { code: "D4348", name: "Sealant", price: 2400 },
  { code: "D4349", name: "Sealant", price: 2500 },
  { code: "D4910", name: "Oral Surgery", price: 2600 },
  { code: "D6010", name: "Endodontics", price: 2700 },
];

export default PROCEDURES;
