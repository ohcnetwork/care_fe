export const groups = [
  {
    id: 1,
    name: "Test Group 1"
  },
  {
    id: 2,
    name: "Test Group 2"
  },
  {
    id: 3,
    name: "Test Group 3"
  },
]


export const tests = [
  {
    name: 'Blood Group',
    unit: '',
    ideal: '',
    min: '',
    max: '',
    group: 2,
    id: 1
  },
  {
    name: 'Total Count',
    unit: 'cell/cumm',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 3,
    id: 2
  },
  {
    name: 'Neutrophil count',
    unit: 'cell/cumm',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 1,
    id: 3
  },
  {
    name: 'Lymphocyte count Eosinophil count',
    unit: 'cell/cumm',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 3,
    id: 4
  },
  {
    name: 'Eosinophil count',
    unit: 'cell/cumm',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 2,
    id: 5
  },
  {
    name: 'Basophil count',
    unit: 'cell/cumm',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 3,
    id: 6
  },
  {
    name: 'Monocyte count',
    unit: 'cell/cumm',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 1,
    id: 7
  },
  {
    name: 'neutrophil',
    unit: '%',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 3,
    id: 8
  },
  {
    name: 'lymphocyte',
    unit: '%',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 1,
    id: 9
  },
  {
    name: 'eosinophil',
    unit: '%',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 1,
    id: 10
  },
  {
    name: 'basophile',
    unit: '%',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 1,
    id: 11
  },
  {
    name: 'monocyte',
    unit: '%',
    ideal: '4500-11000 cells/cumm',
    min: 4500,
    max: 11000,
    group: 1,
    id: 12
  },
  {
    name: 'Hb',
    unit: 'gm%',
    ideal: 'men 14-17 gm% , woman 12-16 gm% ,children 12-14 gm%',
    min: '',
    max: '',
    group: 2,
    id: 13
  },
  {
    name: 'PCV',
    unit: '%',
    ideal: 'Men 38-51 gm% , Woman 36-47%',
    min: '',
    max: '',
    group: 1,
    id: 14
  },
  {
    name: 'RBC count',
    unit: 'million/cumm',
    ideal: '4.5-6.0 million/cumm',
    min: '',
    max: '',
    group: 3,
    id: 15
  },
  {
    name: 'RDW',
    unit: '%',
    ideal: '11.8 - 16.1%',
    min: 11.8,
    max: 16.1,
    group: 3,
    id: 16
  },
  {
    name: 'Platelets',
    unit: 'lakhs/cumm',
    ideal: '1.5-4.5 lakhs/cumm',
    min: 1.5,
    max: 4.5,
    group: 1,
    id: 17
  },
  {
    name: 'MCV',
    unit: 'Fl',
    ideal: '80-96 Fl',
    min: 80,
    max: 96,
    group: 1,
    id: 18
  },
  {
    name: 'MCH',
    unit: 'pg',
    ideal: '27-33 pg',
    min: 27,
    max: 33,
    group: 1,
    id: 19
  },
  {
    name: 'MCHC',
    unit: 'g/dl',
    ideal: '33.4-35.5 g/dl',
    min: 33.4,
    max: 35.5,
    group: 1,
    id: 20
  },
  {
    name: 'ESR',
    unit: 'mm/hr',
    ideal: '0-20 mm/hr',
    min: 0,
    max: 20,
    group: 3,
    id: 21
  },
  {
    name: 'Peripheral blood smear',
    unit: '',
    ideal: '',
    min: '',
    max: '',
    group: 3,
    id: 22
  },
  {
    name: 'Reticulocyte count',
    unit: '%',
    ideal: 'adults 0.5-1.5%, newborns 3-6%',
    min: '',
    max: '',
    group: 2,
    id: 23
  },
  {
    name: 'M P smear',
    unit: '',
    ideal: '',
    min: '',
    max: '',
    group: 3,
    id: 24
  }
]

export const groupMap = groups.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {})

export const testMap = tests.reduce((acc, cur) => {
  const prev = { ...acc }
  // @ts-ignore
  if (prev[cur.group].tests) {
    // @ts-ignore
    prev[cur.group].tests.push(cur)
  } else {
    // @ts-ignore
    prev[cur.group].tests = [cur]
  }


  return { ...prev }
}, { ...groupMap })

export const initForm = tests.reduce((acc, cur) => ({ ...acc, [cur.id]: { test: cur.id, group: cur.group, value: null } }), {})