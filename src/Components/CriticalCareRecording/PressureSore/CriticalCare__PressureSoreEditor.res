let str = React.string
open CriticalCare__Types

@module("../CriticalCare__API")
external updateDailyRound: (string, string, Js.Json.t, _ => unit, _ => unit) => unit =
  "updateDailyRound"

type state = {
  braden_scale_front: option<int>,
  braden_scale_back: option<int>,
  front_parts_selected: array<bool>,
  back_parts_selected: array<bool>,
  saving: bool,
  dirty: bool,
}

let front_parts: array<PressureSore.type_for_path> = [
  {
    d: "M443,135.809",
    transform: "translate(-362.967 -95.599)",
    label: "",
  },
  {
    d: "M535.244,212.572c32.253.43,32.684-31.823,32.684-31.823,9.891-.215,14.191-19.783,13.331-23.653s-7.526-1.5-7.526-1.5c3.656-30.1-9.676-48.38-17.847-53.756S535.244,95.6,535.244,95.6h.43s-12.472.86-20.643,6.236-21.5,23.653-17.846,53.756c0,0-6.666-2.365-7.526,1.5s3.44,23.438,13.331,23.653c0,0,.43,32.253,32.684,31.823Z",
    transform: "translate(-362.967 -95.599)",
    label: "Head",
  },
  {
    d: "M512.129,213.97s31.608,4.954,47.574-1.394v14.456s-26.287,4.355-47.574,0Z",
    transform: "translate(-362.967 -95.599)",
    label: "Neck",
  },
  {
    d: "M505.355,231.279s-56.766,25.8-69.452,34.4c0,0,15.7,20.857,21.072,66.872C456.975,332.555,469.417,246.838,505.355,231.279Z",
    transform: "translate(-362.967 -95.599)",
    label: "Right Shoulder",
  },
  {
    d: "M526.482,232.838l.806,137.346s-46.607-22.2-67.745,18.762C459.543,388.946,455.685,234.612,526.482,232.838Z",
    transform: "translate(-362.967 -95.599)",
    label: "Right Chest",
  },
  {
    d: "M433.108,269.768s34.728,55.552,18.279,141.992c0,0-19.57-9.107-33.761-7.333,0,0-1.613-106.276,0-110.952S429.721,271.058,433.108,269.768Z",
    transform: "translate(-362.967 -95.599)",
    label: "Right Arm",
  },
  {
    d: "M415.207,408.781s27.254-.968,35.963,11.45c0,0-7.58,59.024-13.547,77.57s-19.03,56.766-19.03,56.766l-22.254-2.742s1.451-34.672,1.29-45.477,5-49.993,9.514-62.249S415.207,408.781,415.207,408.781Z",
    transform: "translate(-362.967 -95.599)",
    label: "Right Forearm",
  },
  {
    d: "M396.6,556.524l18.245,2.606a1.808,1.808,0,0,1,1.565,1.776c.049,6.373.053,30.692-2.6,41.987-2.568,10.951-16.244,28.022-26.205,35.726a4.126,4.126,0,0,1-6.575-2.7c-.192-1.322-.39-2.923-.584-4.855a1.828,1.828,0,0,0-2.054-1.637l-4.174.551a1.818,1.818,0,0,1-2.026-2.171c.631-3.043,1.887-8.187,3.72-11.529,2.591-4.724,5.9-18.948,5.442-26.76a1.79,1.79,0,0,0-1.514-1.635,7.118,7.118,0,0,0-5.448,1c-1.364,1.043-3.83,4.558-5.963,7.825-1.941,2.973-6.715.452-5.152-2.736.018-.037.037-.074.056-.111,1.936-3.71,13.063-18.708,16.288-24.513,2.9-5.221,13.627-8.747,15.171-11.984A1.706,1.706,0,0,1,396.6,556.524Z",
    transform: "translate(-362.967 -95.599)",
    label: "Right Hand",
  },
  {
    d: "M674.037,556.2l-18.244,2.606a1.808,1.808,0,0,0-1.566,1.776c-.049,6.373-.052,30.692,2.6,41.988,2.569,10.951,16.244,28.021,26.205,35.726a4.126,4.126,0,0,0,6.576-2.7c.191-1.322.389-2.922.584-4.855a1.827,1.827,0,0,1,2.053-1.637l4.174.551a1.818,1.818,0,0,0,2.027-2.17c-.632-3.043-1.888-8.188-3.721-11.53-2.59-4.723-5.9-18.948-5.442-26.76a1.79,1.79,0,0,1,1.515-1.634,7.114,7.114,0,0,1,5.447,1c1.364,1.043,3.83,4.558,5.964,7.826,1.94,2.973,6.715.451,5.151-2.736-.018-.038-.037-.075-.056-.112-1.935-3.709-13.063-18.707-16.288-24.513-2.9-5.221-13.627-8.746-15.171-11.984A1.707,1.707,0,0,0,674.037,556.2Z",
    transform: "translate(-362.967 -95.599)",
    label: "Left Hand",
  },
  {
    d: "M544.705,232.838h19.137s18.062,15.643,20,19.513,29.888,42.79,26.878,128.154c0,0-16.557-16.556-31.178-15.051,0,0,2.365-33.114-34.834-34.619Z",
    transform: "translate(-362.967 -95.599)",
    label: "Left Chest",
  },
  {
    d: "M569.432,231.279s61.927,31.824,65.153,35.694c0,0-12.9,9.752-18.707,73.791C615.878,340.764,610.072,268.048,569.432,231.279Z",
    transform: "translate(-362.967 -95.599)",
    label: "Left Shoulder",
  },
  {
    d: "M638.455,271.058s14.407,18.923,14.837,23.223-1.291,105.362.86,108.8c0,0-26.233,1.29-34.834,9.891,0,0-4.3-51.176.86-78.484S633.079,279.659,638.455,271.058Z",
    transform: "translate(-362.967 -95.599)",
    label: "Left Arm",
  },
  {
    d: "M621.038,419s16.342-12.257,33.974-10.537c0,0,7.741,26.233,8.816,34.189s10.321,49.241,9.246,66.658.087,41.069.087,41.069-16.214,3.44-20.084,4.731c0,0-17.2-46.661-18.062-52.036S620.982,426.52,621.038,419Z",
    transform: "translate(-362.967 -95.599)",
    label: "Left Forearm",
  },
  {
    d: "M510.758,934.272s-20.723,1.451-24.973,1.5a56.32,56.32,0,0,0-1.556,10.672c0,4.355.484,25.481-.645,28.061s-21.771,27.254-23.383,30.641.645,8.386,1.935,9.192,2.1,4.757,4.193,5.644c1.807.765,3.064,3.709,5.644,4.032s10.482-.645,12.418.726c0,0,.887,3.144,2.58,3.306.864.082,5.644,1.774,10.644-5.967s13.04-35.019,13.439-37.791c.249-1.732-1.183-2.125-1.506-5.189a112.484,112.484,0,0,1,1.855-20.64C513.419,948.3,510.758,934.272,510.758,934.272Z",
    transform: "translate(-362.967 -95.599)",
    label: "Right Foot",
  },
  {
    d: "M563.251,934.191s20.756.564,25.006.616c0,0,.151,7.125.151,11.479s.162,24.351,1.29,26.932,22.531,27.576,24.144,30.963-.645,8.386-1.935,9.192-2.1,4.758-4.193,5.645c-1.807.764-3.064,3.709-5.645,4.031s-10.482-.645-12.417.726c0,0-.887,3.145-2.581,3.306-.864.082-5.644,1.774-10.643-5.967s-13.04-35.018-13.439-37.79c-.25-1.733,1.182-2.126,1.5-5.19a112.484,112.484,0,0,0-1.855-20.64C560.623,947.334,563.251,934.191,563.251,934.191Z",
    transform: "translate(-362.967 -95.599)",
    label: "Left Foot",
  },
  {
    d: "M485.2,932.363l24.513-1.4s1.666-37.2,2.526-41.285,4.731-85.149,4.086-99.771c0,0-30,2.527-49.348-3.924,0,0-6.451,44.026-1.828,62.841C467.775,859.527,484.874,929.6,485.2,932.363Z",
    transform: "translate(-362.967 -95.599)",
    label: "Right Leg",
  },
  {
    d: "M469.231,420.715s-5.966-30.318-4.515-34.834a115.141,115.141,0,0,1,16.772-10.966c10.428-5.483,29.727-6.773,36.339-3.548,5.81,2.834,4.972,2.548,13.439,4.73l.054-142.13h9.192V334.92s32.415,1.291,31.931,33.06a72.9,72.9,0,0,0,8.869,2.419c5.322,1.129,23.062,9.031,25.642,19.675,0,0-4.945,22.2-3.655,32.684,0,0-39.4-29.835-47.306-31.609s-12.959,2.31-16.933,2.8c-4.483.547-11.71-.628-18.142-2.9C514.306,388.7,475.2,414.909,469.231,420.715Z",
    transform: "translate(-362.967 -95.599)",
    label: "",
  },
  {
    d: "M461.813,481.665c2.43-11.313,8.042-43.207,7.1-55.467,0,0,48.3-30.56,50.88-30.4s12.122,5.564,23.841,2.338c0,0,6.719-3.225,13.331.162s34.874,24.149,46.324,28.987c0,0-.524,28.746,1.573,37.777s10.159,42.091,10.966,46.123,0,.806,0,.806-58.057,50.155-59.669,52.574c0,0-6.451-6.29-20.481-6.774s-20.643,6.774-20.643,6.774l-60.152-51.122S460.965,485.617,461.813,481.665Z",
    transform: "translate(-362.967 -95.599)",
    label: "Abdomen",
  },
  {
    d: "M554.381,790.77s30.748,3.226,51.39-4.945c0,0,3.441,40.424,0,63.432s-16.449,76.871-17.094,81.816c0,0-23.33.108-25.91-1.4,0,0-3.011-33.328-3.871-43S550.08,810.982,554.381,790.77Z",
    transform: "translate(-362.967 -95.599)",
    label: "Left Leg",
  },
  {
    d: "M454.072,520.056s-4.515,29.35-6.128,48.7.323,59.346,6.128,81.278,21.288,89.343,14.514,131.272c0,0,20.464,8.064,47.808,4.516,0,0,7.2-74.822,6.7-87.73,0,0,3.333-50.745,3.333-58.7s1.72-27.738,1.72-27.738-20.642-10.106-14.837-44.08C513.311,567.576,462.351,524.571,454.072,520.056Z",
    transform: "translate(-362.967 -95.599)",
    label: "Right Thigh",
  },
  {
    d: "M553.114,785.825s37.713,2.741,50.615-3.548c0,0-6.451-35.8-1.129-63.325s19.943-77.408,20.8-92.03,2.33-87.3-7.221-108.371l-56.426,49.455s3.441,37.629-18.922,44.725c0,0,7.741,68.807,7.741,78.913S554.857,777.654,553.114,785.825Z",
    transform: "translate(-362.967 -95.599)",
    label: "Left Thigh",
  },
  {
    d: "M535.624,610.466s16.722-10.1,18.818-27.355-3.386-17.578-5.805-18.545-13.063-1.291-13.063-1.291h.1s-10.644.323-13.063,1.291-7.9,1.29-5.806,18.545S535.624,610.466,535.624,610.466Z",
    transform: "translate(-362.967 -95.599)",
    label: "Groin",
  },
]

let back_parts: array<PressureSore.type_for_path> = [
  {
    d: "M 506.9838 158.0121 C 509.6029 173.1336 512.1258 187.9477 521.5039 184.4407 C 517.7283 191.6346 525.6919 202.9266 528.0919 210.8841 C 544.9623 208.3461 562.3174 208.3461 579.1878 210.8841 C 581.5893 202.9236 589.5363 191.6662 585.7863 184.4511 C 595.6744 187.4586 596.8188 174.3021 600.3813 158.5926 C 600.1173 156.4611 595.9999 158.5806 594.7788 159.0816 C 597.7384 128.3122 591.2088 97.1811 553.7104 97.22 C 516.1444 97.1497 509.5249 128.2116 512.5008 159.0891 C 511.0564 158.4651 508.4914 157.0971 506.9838 158.0121 Z",
    transform: "translate(-390.349 -94.472)",
    label: "Head",
  },
  {
    d: "M 503.129 213.97 s 30.871 -1.97 46.871 0.03 v 12.456 s -26 -2.456 -47.574 0 Z",
    transform: "translate(-362.967 -95.599)",
    label: "Neck",
  },
  {
    d: "M532.993,209.3",
    transform: "translate(-390.349 -94.472)",
    label: "",
  },
  {
    d: "M545.584,228.037V361.6s-13.6,10.828-25.282,13.145c-10.077,2-36.162,3.374-36.766-.857S478.9,239.117,545.584,228.037Z",
    transform: "translate(-390.349 -94.472)",
    label: "Left Chest",
  },
  {
    d: "M563.865,228.037V361.6s13.6,10.828,25.282,13.145c10.076,2,36.161,3.374,36.766-.857S630.546,239.117,563.865,228.037Z",
    transform: "translate(-390.349 -94.472)",
    label: "Right Chest",
  },
  {
    d: "M550.973,228.188h8.914l.151,136.435s20.7,17.828,59.681,16.317c0,0-4.684,38.528-1.057,56.508s9.216,41.248,9.216,41.248-77.812,30.218-145.954-.151c0,0,9.67-35.96,9.972-58.321a167.6,167.6,0,0,0-4.23-39.888s37.924,5.439,62.1-15.713C549.764,364.623,550.52,228.188,550.973,228.188Z",
    transform: "translate(-390.349 -94.472)",
    label: "Abdomen",
  },
  {
    d: "M523.223,230.857s-40.694,20.548-50.968,25.182-11.08,5.439-11.08,5.439,15.512,18.735,18.533,70.509C479.708,331.987,489.58,244.354,523.223,230.857Z",
    transform: "translate(-390.349 -94.472)",
    label: "Left Shoulder",
  },
  {
    d: "M587.084,230.857s40.693,20.548,50.968,25.182,11.08,5.439,11.08,5.439S633.62,280.213,630.6,331.987C630.6,331.987,620.726,244.354,587.084,230.857Z",
    transform: "translate(-390.349 -94.472)",
    label: "Right Shoulder",
  },
  {
    d: "M457.951,265.306s-12.49,14.706-13.5,29.613,1.813,82.194.6,95.691c0,0,15.512-1.209,22.16,3.022s9.872,4.23,9.872,4.23,3.223-32.232,1.41-53.385S467.823,277.393,457.951,265.306Z",
    transform: "translate(-390.349 -94.472)",
    label: "Left Arm",
  },
  {
    d: "M444.655,394.639s3.627-1.209,8.864,1.612,21.153,4.835,21.153,4.835a241.987,241.987,0,0,1-6.245,50.968c-6.446,27.8-23.167,79.977-22.966,81.992,0,0-17.325-4.03-20.951-3.828,0,0,1.209-21.354,1.612-31.427s.2-42.91,6.648-63.659S444.454,396.049,444.655,394.639Z",
    transform: "translate(-390.349 -94.472)",
    label: "Left Forearm",
  },
  {
    d: "M423.5,533.844s-4.029,2.82-7.454,5.036-12.49,13.1-15.311,18.131-11.482,15.915-10.274,16.923,5.44.2,7.454-2.216,7.051-8.663,10.476-7.253c0,0,1.007,12.087-3.224,22.966s-4.633,13.7-4.633,13.7,2.591,2.22,7.063.809q.291-.091.592-.2s1.612,4.835.806,8.864,3.022,3.425,7.655,1.007,21.959-22.562,24.175-35.053,1.611-40.895,1.611-40.895S427.33,534.65,423.5,533.844Z",
    transform: "translate(-390.349 -94.472)",
    label: "Left Hand",
  },
  {
    d: "M650.678,265.306s12.49,14.706,13.5,29.613-1.813,82.194-.6,95.691c0,0-15.512-1.209-22.16,3.022s-9.871,4.23-9.871,4.23-3.224-32.232-1.41-53.385S640.807,277.393,650.678,265.306Z",
    transform: "translate(-390.349 -94.472)",
    label: "Right Arm",
  },
  {
    d: "M663.974,394.639s-3.626-1.209-8.864,1.612-21.153,4.835-21.153,4.835a242.066,242.066,0,0,0,6.245,50.968c6.447,27.8,23.168,79.977,22.966,81.992,0,0,17.325-4.03,20.951-3.828,0,0-1.208-21.354-1.611-31.427s-.2-42.91-6.648-63.659S664.175,396.049,663.974,394.639Z",
    transform: "translate(-390.349 -94.472)",
    label: "Right Forearm",
  },
  {
    d: "M685.127,533.844s4.029,2.82,7.453,5.036,12.491,13.1,15.311,18.131,11.483,15.915,10.274,16.923-5.439.2-7.454-2.216-7.051-8.663-10.475-7.253c0,0-1.008,12.087,3.223,22.966s4.633,13.7,4.633,13.7-2.59,2.22-7.062.809q-.291-.091-.593-.2s-1.612,4.835-.806,8.864-3.022,3.425-7.655,1.007-21.958-22.562-24.174-35.053-1.612-40.895-1.612-40.895S681.3,534.65,685.127,533.844Z",
    transform: "translate(-390.349 -94.472)",
    label: "Right Hand",
  },
  {
    d: "M552.635,495.366s0,66.279-.6,69.9c-.051.277-.126.982-.2,2.065-5.691,6.673-27.473,28.254-58.673,9.04a10.164,10.164,0,0,1-1.738-1.309c-23.066-21.783-7.076-50.968-6.371-52.2l-2.216-1.234c-.176.327-17.652,32.107,6.849,55.249a14.16,14.16,0,0,0,2.166,1.662c9.519,5.842,18.232,8.033,25.988,8.033,16.116,0,27.977-9.519,33.642-15.235-1.661,20.07-6.144,82.369-6.5,86-.4,4.231-7.605,77.51-7.605,80.935,0,0-36.111-4.785-45.579-2.972,0,0,.2-37.672-2.821-59.63s-14.5-65.473-15.914-101.936-1.411-65.473,7.453-91.46C480.514,482.272,499.048,497.582,552.635,495.366Z",
    transform: "translate(-390.349 -94.472)",
    label: "Left Thigh and Buttock",
  },
  {
    d: "M555.471,495.366s0,66.279.6,69.9c.051.277.126.982.2,2.065,5.691,6.673,27.473,28.254,58.673,9.04a10.164,10.164,0,0,0,1.738-1.309c23.066-21.783,7.076-50.968,6.371-52.2l2.216-1.234c.176.327,17.652,32.107-6.85,55.249a14.151,14.151,0,0,1-2.165,1.662c-9.519,5.842-18.232,8.033-25.988,8.033-16.116,0-27.977-9.519-33.643-15.235,1.662,20.07,6.145,82.369,6.5,86,.4,4.231,7.605,77.51,7.605,80.935,0,0,36.111-4.785,45.579-2.972,0,0-.2-37.672,2.82-59.63s14.5-65.473,15.915-101.936,1.41-65.473-7.453-91.46C627.592,482.272,609.058,497.582,555.471,495.366Z",
    transform: "translate(-390.349 -94.472)",
    label: "Right Thigh and Buttock",
  },
  {
    d: "M492.2,739.529s21.354-2.418,42.909,3.425c0,0,3.627,43.312,1.612,61.846s-7.655,75.445-6.849,80.078c0,0-19.944.907-25.988,2.518,0,0-2.619-29.009-9.267-49.154S486.961,754.839,492.2,739.529Z",
    transform: "translate(-390.349 -94.472)",
    label: "Left Leg",
  },
  {
    d: "M617.088,739.529s-21.354-2.418-42.909,3.425c0,0-3.626,43.312-1.612,61.846s7.655,75.445,6.85,80.078c0,0,19.944.907,25.987,2.518,0,0,2.619-29.009,9.267-49.154S622.326,754.839,617.088,739.529Z",
    transform: "translate(-390.349 -94.472)",
    label: "Right Leg",
  },
  {
    d: "M504.387,891.023s17.728-.806,24.879-2.619c0,0,2.015,6.245,1.209,18.131s-1.007,21.555-.6,23.771,1.813,9.67-1.209,15.512S520,967.172,516.978,972.007s-10.275,5.439-11.886-1.611c0,0-1.813,3.424-7.857,1.41s-9.67-1.209-11.483-5.44-4.835-11.684-1.41-16.922,18.937-18.534,20.145-25.182S505.6,895.455,504.387,891.023Z",
    transform: "translate(-390.349 -94.472)",
    label: "Left Foot",
  },
  {
    d: "M604.752,891.023s-17.728-.806-24.88-2.619c0,0-2.014,6.245-1.209,18.131s1.008,21.555.605,23.771-1.813,9.67,1.209,15.512,8.662,21.354,11.684,26.189,10.274,5.439,11.886-1.611c0,0,1.813,3.424,7.856,1.41s9.67-1.209,11.483-5.44,4.835-11.684,1.41-16.922-18.936-18.534-20.145-25.182S603.543,895.455,604.752,891.023Z",
    transform: "translate(-390.349 -94.472)",
    label: "Right Foot",
  },
]

type action =
  | SetFrontViewBradenScale(int)
  | SetBackViewBradenScale(int)
  | AddIndexToSelectedFrontParts(int)
  | AddIndexToSelectedBackParts(int)
  | SetSaving
  | ClearSaving

let reducer = (state, action) => {
  switch action {
  | SetFrontViewBradenScale(risk_severity_value) => {
      ...state,
      braden_scale_front: Some(risk_severity_value),
      dirty: true,
    }
  | SetBackViewBradenScale(risk_severity_value) => {
      ...state,
      braden_scale_back: Some(risk_severity_value),
      dirty: true,
    }
  | AddIndexToSelectedFrontParts(ind) => {
      let tmp = state.front_parts_selected
      tmp[ind] = !tmp[ind]
      {
        ...state,
        front_parts_selected: tmp,
        dirty: true,
      }
    }
  | AddIndexToSelectedBackParts(ind) => {
      let tmp = state.back_parts_selected
      tmp[ind] = !tmp[ind]
      {
        ...state,
        back_parts_selected: tmp,
        dirty: true,
      }
    }
  | SetSaving => {...state, saving: true}
  | ClearSaving => {...state, saving: false}
  }
}

let setPayload = state => {
  let fields = Js.Dict.empty()

  DictUtils.setOptionalNumber("braden_scale_front", state.braden_scale_front, fields)
  DictUtils.setOptionalNumber("braden_scale_back", state.braden_scale_back, fields)
  Js.Dict.set(fields, "front_parts_selected", Js.Json.booleanArray(state.front_parts_selected))
  Js.Dict.set(fields, "back_parts_selected", Js.Json.booleanArray(state.back_parts_selected))
  [fields]
}

let makePayload = state => {
  let payload = Js.Dict.empty()
  Js.Dict.set(payload, "pressure_sore", Js.Json.objectArray(setPayload(state)))
  payload
}

let successCB = (send, updateCB, data) => {
  send(ClearSaving)
  updateCB(CriticalCare__DailyRound.makeFromJs(data))
}

let errorCB = (send, _error) => {
  send(ClearSaving)
}

let saveData = (id, consultationId, state, send, updateCB) => {
  send(SetSaving)
  updateDailyRound(
    consultationId,
    id,
    Js.Json.object_(makePayload(state)),
    successCB(send, updateCB),
    errorCB(send),
  )
}

let initialSelected = endValue => {
  let initialPartsSelected = ref([])
  let i = ref(0)
  while i.contents <= endValue {
    initialPartsSelected.contents = Js.Array.concat([false], initialPartsSelected.contents)
    i := i.contents + 1
  }
  initialPartsSelected.contents
}

let initialState = psp => {
  {
    braden_scale_front: PressureSore.braden_scale_front(psp),
    braden_scale_back: PressureSore.braden_scale_back(psp),
    front_parts_selected: Js.Array.length(PressureSore.front_parts_selected(psp)) > 0
      ? PressureSore.front_parts_selected(psp)
      : initialSelected(23),
    back_parts_selected: Js.Array.length(PressureSore.back_parts_selected(psp)) > 0
      ? PressureSore.back_parts_selected(psp)
      : initialSelected(21),
    saving: false,
    dirty: false,
  }
}

@react.component
let make = (~pressureSoreParameter, ~updateCB, ~id, ~consultationId) => {
  let (state, send) = React.useReducer(reducer, initialState(pressureSoreParameter))

  <div className="my-5">
    <h2> {str("Pressure Sore")} </h2>
    <div className="text-2xl font-bold mt-10"> {str("Front")} </div>
    <div className="flex justify-center max-w-2xl mx-auto">
      <svg className="h-screen py-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 344.7 932.661">
        {front_parts
        |> Array.mapi((renderIndex, part) => {
          <path
            key={"part1" ++ Belt.Int.toString(renderIndex)}
            d={PressureSore.d(part)}
            transform={PressureSore.transform(part)}
            className={state.front_parts_selected[renderIndex]
              ? "text-blue-500 tooltip"
              : "text-gray-400  hover:text-blue-400 tooltip"}
            fill="currentColor"
            onClick={_ => {
              send(AddIndexToSelectedFrontParts(renderIndex))
            }}>
            <title className=""> {str(PressureSore.label(front_parts[renderIndex]))} </title>
          </path>
        })
        |> React.array}
      </svg>
    </div>
    <div className="flex flex-col">
      <Slider
        title={"Braden Scale (Risk Severity)"}
        start={"1"}
        end={"5"}
        interval={"1"}
        value={Belt.Option.mapWithDefault(state.braden_scale_front, "", string_of_int)}
        step={1.0}
        setValue={s => send(SetFrontViewBradenScale(int_of_string(s)))}
        getLabel={_ => ("", "#ff0000")}
      />
    </div>
    <div className="text-2xl font-bold mt-10"> {str("Back")} </div>
    <div className="flex justify-center max-w-2xl mx-auto">
      <svg
        className="h-screen py-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 327.931 881.194">
        {back_parts
        |> Array.mapi((renderIndex, part) => {
          <path
            key={"part2" ++ Belt.Int.toString(renderIndex)}
            d={PressureSore.d(part)}
            transform={PressureSore.transform(part)}
            className={state.back_parts_selected[renderIndex]
              ? "text-blue-500 tooltip"
              : "text-gray-400  hover:text-blue-400 tooltip"}
            fill="currentColor"
            onClick={_ => {
              send(AddIndexToSelectedBackParts(renderIndex))
            }}>
            <title className=""> {str(PressureSore.label(back_parts[renderIndex]))} </title>
          </path>
        })
        |> React.array}
      </svg>
    </div>
    <div className="flex flex-col">
      <Slider
        title={"Braden Scale (Risk Severity)"}
        start={"1"}
        end={"5"}
        interval={"1"}
        value={Belt.Option.mapWithDefault(state.braden_scale_back, "", string_of_int)}
        step={1.0}
        setValue={s => send(SetBackViewBradenScale(int_of_string(s)))}
        getLabel={_ => ("", "#ff0000")}
      />
    </div>
    <button
      className="flex w-full bg-blue-600 text-white p-2 text-lg hover:bg-blue-800 justify-center items-center rounded-md"
      onClick={_ => saveData(id, consultationId, state, send, updateCB)}>
      {str("Done")}
    </button>
  </div>
}
