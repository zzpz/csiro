// import {
//   CodeableConcept,
//   Coding,
//   DiagnosticReport,
//   Observation,
//   Patient,
//   Reference,
//   Resource,
// } from "fhir/r4"; //we are assuming v4
// //file io
// import * as fs from "fs";
// //csv parsing
// import { parse } from "csv-parse/sync";

// const path = require("path");

// //ultimately we are just mapping from input to output
// //define inputFormat expected
// //validate** somewhere in the process
// //transform
// //map to FHIR objects
// //return FHIR obj's as JSON

// //example
// // "patientId": "A0002",  //patient
// // "differentialDiagnosis": [ //diagnosis?
// //     "Distal renal tubular acidosis",
// //     "Sjogren syndrome"
// // ],
// // "confimedDiagnosis": "",
// // "test_type": "whole genome",
// // "test_date": "2020-01-23T10:25:43.411Z"

// //define input -> we could create our own DiagnosticReport using StructureDefinition...
// //for now we will put that on the back burner

// //we are assuming that these fields are always present in the input and won't require validation
// interface JSONSystemInput {
//   patientId: string; //DiagnosticReport.subject => Patient?
//   differentialDiagnosis: string[]; //custom field?
//   confimedDiagnosis: string; //has a fhir type?  conclusion => DiagnosticReport.conclusionCode	no code but can use free text
//   //Observations
//   //no category no id or status we will handle later
//   test_type: string; //Observation.method ?? -> Code or string
//   test_date: string; //Observation.date
// }

// interface CSVSystemInput extends JSONSystemInput {
//   studentID: string;
// }

// //to parse JSON into supplied format
// type InputList = JSONSystemInput[];

// interface MyDiagnosticReport extends DiagnosticReport {
//   //   patientID: Reference; //we assume is always a Patient
//   studentID?: string;
//   differentialDiagnosis: CodeableConcept[]; //custom field
//   //   confirmedDiagnosis?: Coding; // conclusion on DiagnosticReport
//   //result: Reference[] => [{reference:string}]
//   //   test_type: string; //result.method
//   //   test_date: string; //result.date
// }

// function mapInputObjectToFHIR(systemObj: JSONSystemInput) {
//   // we really only care about the confirmedDiagnosis
//   // we have no ID's supplied for the Observation

//   const loincCode: string = "xxxx-x";

//   const diagnosticReport: MyDiagnosticReport = {
//     resourceType: "DiagnosticReport",
//     status: "unknown",
//     subject: { //assumes we always have a Patient and ID
//       reference: `Patient/${systemObj.patientId}`,
//     },
//     effectiveDateTime: systemObj.test_date,
//     conclusion: systemObj.confimedDiagnosis,
//     code: { //
//       coding: [{
//         system: "http://loinc.org",
//         code: loincCode,
//         display: "JSONSystem Diagnostic Report", //should use loinc + code for diagnosis?
//       }],
//       text: "JSONSystem Diagnostic Report",
//     },
//     conclusionCode: [
//       {
//         coding: [
//           {
//             system: "http://loinc.org",
//             code: loincCode,
//             display: systemObj.confimedDiagnosis,
//           },
//         ],
//         text: "JSONSystem Confirmed Diagnosis",
//       },
//     ],
//     differentialDiagnosis: systemObj.differentialDiagnosis.map(
//       (diffDiag: string) => {
//         return {
//           coding: [
//             {
//               system: "http://loinc.org",
//               code: loincCode,
//               display: diffDiag,
//             },
//           ],
//           text: diffDiag,
//         };
//       },
//     ),
//   };

//   // return DiagnosticReport[]
//   return diagnosticReport;
// }

// function processJsonFile(filename: string) {
//   const inputList = objListFromJsonFile(filename);
//   const out = createFHIRObjArray(inputList);
//   return out;
// }

// function processCSVFile(filename: string) {
//   const objectList = objListFromCsvFile(filename);
//   const out = createFHIRObjArray(objectList);
//   return out;
// }

// //helper
// function createFHIRObjArray(objectList: JSONSystemInput[]) {
//   const out = objectList.reduce<MyDiagnosticReport[]>((accumulator, report) => {
//     accumulator.push(mapInputObjectToFHIR(report));
//     return accumulator;
//   }, []);
//   return out;
// }

// //helper
// function getDataFromFile(filename: string, encoding?: BufferEncoding) {
//   //assumes we have valid inputs and local files
//   const fileFolder = "";
//   const folderPath = "..";
//   const filePath = path.join(__dirname, folderPath, fileFolder, filename);
//   const fileName = filePath;
//   const encoded = encoding || "utf-8";

//   //sync read csv (could stream)
//   const data = fs.readFileSync(fileName, encoded);
//   return data;
// }

// function objListFromJsonFile(filename: string) {
//   const data = getDataFromFile(filename); //synchronous
//   const input: InputList = JSON.parse(data); //ISO String datetime
//   return input;
// }

// //helper
// function objListFromCsvFile(filename: string) {
//   //assumes we have valid inputs not malformed
//   const encoding: BufferEncoding = "utf-8";
//   //sync read csv (could stream and async)
//   const data = getDataFromFile(filename, encoding);
//   //apply parse + transform functions
//   const records: CSVSystemInput[] = parse(data, {
//     columns: true,
//     encoding: encoding,
//     on_record: (record, lines) => {
//       return parseCSVRecord(record, lines);
//     },
//   });
//   return records;
// }

// //helper
// function parseCSVRecord(record: any, context: any) {
//   const parsedDate: string = ddmmyyytoISO(record.test_date); //date format is assumed to be DD/MM/YYYY
//   const x: CSVSystemInput = {
//     studentID: record.stud_num,
//     patientId: record.pat_id,
//     test_type: record.test_type,
//     test_date: parsedDate,
//     differentialDiagnosis: [
//       record.dif_diag_1,
//       record.dif_diag_2,
//       record.dif_diag_3,
//     ],
//     confimedDiagnosis: record.final_diag,
//   };
//   return x;
// }

// //helper
// function ddmmyyytoISO(ddmmyyy: string) {
//   //handle the completely ambiguous date string ... 1/3/11 march? jan? 1911?

//   const dateFields = ddmmyyy.split("/").map(Number); //split and cast to a number
//   const [dd, mm, yy] = dateFields;
//   const yyyy = 2000 + yy; // handle two-digit years being the 1900's
//   const date: string = new Date(yyyy, mm - 1, dd).toISOString(); //jan == 0
//   return date;
// }

// function validateOutput(input: MyDiagnosticReport) {
//   //validate output DiagnosticReport meets standards

//   //we validated output JSON against the schema using https://jsonschemalint.com/#!/version/draft-07/markup/json
//   //we could do better
//   return true;
// }

// function main(inputType: number, filename: string) {
//   //we're just assuming that we receive a JSON / CSV and then switch on them
//   let out: MyDiagnosticReport[];

//   switch (inputType) {
//     case 0: {
//       out = processCSVFile(filename);
//       break;
//     }
//     case 1: {
//       out = processJsonFile(filename);
//       break;
//     }
//     default: {
//       //returns undefined
//       break;
//     }
//   }
//   return out;
// }

// export default main;

// console.log(JSON.stringify(main(0, "example.csv")));
// console.log("");
// console.log(JSON.stringify(main(1, "example.json")));

export default {};
