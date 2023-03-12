import { CodeableConcept, DiagnosticReport } from "fhir/r4"; //we are assuming v4

import * as fs from "fs"; //file io
import { parse } from "csv-parse/sync"; //csv parsing
const path = require("path"); //path

//ultimately we are just mapping from input to output
//define inputFormat expected
//transform
//map to FHIR objects
//return FHIR obj's as JSON
//validate** somewhere in the process

//define input -> we could create our own DiagnosticReport using StructureDefinition...

//we are assuming that these fields are always present in the input and won't require validation
interface SystemOneInput {
  patientId: string; //DiagnosticReport.subject => Patient?
  differentialDiagnosis: string[]; //custom field?
  confimedDiagnosis: string; //has a fhir type?  conclusion => DiagnosticReport.conclusionCode	no code but can use free text
  //Observations
  //no category no id or status we will handle later
  test_type: string; //Observation.method ?? -> Code or string
  test_date: string; //Observation.date
}

interface SystemTwoInput extends SystemOneInput { //could just be an optional studentID
  studentID: string;
}

//to parse JSON into supplied format
type InputList = SystemOneInput[];

interface MyDiagnosticReport extends DiagnosticReport {
  //   patientID: Reference; //we assume is always a Patient
  studentID?: string;
  differentialDiagnosis: CodeableConcept[]; //custom field
  //   confirmedDiagnosis?: Coding; // conclusion on DiagnosticReport
  //result: Reference[] => [{reference:string}]
  //   test_type: string; //result.method
  //   test_date: string; //result.date
}

function mapInputObjectToFHIR(systemObj: SystemOneInput) {
  // we have no ID's supplied for the Observation

  const loincCode: string = "xxxx-x";

  const diagnosticReport: MyDiagnosticReport = {
    resourceType: "DiagnosticReport",
    status: "unknown",
    subject: { //assumes we always have a Patient and ID
      reference: `Patient/${systemObj.patientId}`,
    },
    effectiveDateTime: systemObj.test_date,
    conclusion: systemObj.confimedDiagnosis,
    code: { //
      coding: [{
        system: "http://loinc.org",
        code: loincCode,
        display: "JSONSystem Diagnostic Report", //should use loinc + appropriate code for diagnosis?
      }],
      text: "JSONSystem Diagnostic Report",
    },
    conclusionCode: [
      {
        coding: [
          {
            system: "http://loinc.org",
            code: loincCode,
            display: systemObj.confimedDiagnosis,
          },
        ],
        text: "JSONSystem Confirmed Diagnosis",
      },
    ],
    differentialDiagnosis: systemObj.differentialDiagnosis.map( //map string to CodeableConcept
      (diffDiag: string) => {
        return {
          coding: [
            {
              system: "http://loinc.org",
              code: loincCode,
              display: diffDiag,
            },
          ],
          text: diffDiag,
        };
      },
    ),
  };

  return diagnosticReport;
}

//system1
function processJsonFile(filename: string) {
  const inputList = objListFromJsonFile(filename);
  const out = createFHIRObjArray(inputList);
  return out;
}

//system2
function processCSVFile(filename: string) {
  const objectList = objListFromCsvFile(filename);
  const out = createFHIRObjArray(objectList);
  return out;
}

//helper
function createFHIRObjArray(objectList: SystemOneInput[]) {
  const out = objectList.reduce<MyDiagnosticReport[]>((accumulator, report) => {
    accumulator.push(mapInputObjectToFHIR(report));
    return accumulator;
  }, []);
  return out;
}

//helper
function getDataFromFile(filename: string, encoding?: BufferEncoding) {
  //assumes we have valid inputs and local files
  const fileFolder = "input";
  const folderPath = "..";
  const filePath = path.join(__dirname, folderPath, fileFolder, filename);

  const fileName = filePath;
  console.log(filename);

  const encoded = encoding || "utf-8";

  //sync read csv (could stream)
  const data = fs.readFileSync(fileName, encoded);
  return data;
}

function writeDataToFile(
  filename: string,
  data: string,
  encoding?: BufferEncoding,
) {
  const fileFolder = "output";
  const folderPath = "..";
  const filePath = path.join(__dirname, folderPath, fileFolder, filename);

  fs.writeFile(filePath, data, (err) => {
    if (err) {
      console.error(`Error writing file: ${err.message}`);
      return 0;
    }
  });
  console.log(`File written: ${filename}`);
  return 1;
}

//system1
function objListFromJsonFile(filename: string) {
  const data = getDataFromFile(filename); //synchronous
  const input: InputList = JSON.parse(data); //ISO String datetime
  return input;
}

//system2
function objListFromCsvFile(filename: string) {
  //assumes we have valid inputs not malformed
  const encoding: BufferEncoding = "utf-8";
  //sync read csv (could stream and async)
  const data = getDataFromFile(filename, encoding);
  //apply parse + transform functions
  const records: SystemTwoInput[] = parse(data, {
    columns: true,
    encoding: encoding,
    on_record: (record, lines) => {
      return parseCSVRecord(record, lines);
    },
  });
  return records;
}

//system2 helper
function parseCSVRecord(record: any, context: any) {
  const parsedDate: string = ddmmyyytoISO(record.test_date); //date format is assumed to be DD/MM/YYYY
  const x: SystemTwoInput = {
    studentID: record.stud_num,
    patientId: record.pat_id,
    test_type: record.test_type,
    test_date: parsedDate,
    differentialDiagnosis: [
      record.dif_diag_1,
      record.dif_diag_2,
      record.dif_diag_3,
    ],
    confimedDiagnosis: record.final_diag,
  };
  return x;
}

//system2 helper
function ddmmyyytoISO(ddmmyyy: string) {
  //handle the completely ambiguous date string ... 1/3/11 march? jan? 1911?

  const dateFields = ddmmyyy.split("/").map(Number); //split and cast to a number
  const [dd, mm, yy] = dateFields;
  const yyyy = 2000 + yy; // handle two-digit years being the 1900's
  const date: string = new Date(yyyy, mm - 1, dd).toISOString(); //jan == 0
  return date;
}

//should occur somewhere but we're assuming happy path + correct inputs
function validateOutput(input: MyDiagnosticReport) {
  //validate outputted DiagnosticReport meets the FHIR standard

  //we validated output JSON against the schema using https://jsonschemalint.com/#!/version/draft-07/markup/json
  //we could do better
  return true;
}

//helper
function verifyInputExists(filename: string, inputFolder?: string) {
  const fileFolder = "input";
  const folderPath = "..";
  const filePath = path.join(__dirname, folderPath, fileFolder, filename);

  if (fs.existsSync(filePath)) {
    return 1;
  } else {
    console.error("File does not exist");
    return 0;
  }
}

function main(inputType: number, filename: string) {
  //we're just assuming that we receive a JSON / CSV and then switch on them
  let reports: MyDiagnosticReport[];
  let out = 0;
  const saveas = path.basename(filename, path.extname(filename));

  //just going to hack this in here because it makes it easier to demo if you can CLI run it for an output
  if (verifyInputExists(filename)) {
    switch (inputType) {
      case 0: {
        console.log(`\nprocessing csv: ${filename}`);
        reports = processCSVFile(filename);
        writeDataToFile(
          saveas.concat("-csv.json"),
          JSON.stringify(reports, undefined, 2),
        );
        out = 1;
        break;
      }
      case 1: {
        console.log(`\nprocessing json: ${filename}`);
        reports = processJsonFile(filename);
        writeDataToFile(
          `json-${saveas}.json`,
          JSON.stringify(reports, undefined, 2),
        );
        out = 1;
        break;
      }
      default: {
        //returns -1
        break;
      }
    }
  }

  return out;
}

export default main;
