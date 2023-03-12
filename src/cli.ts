import * as readline from "readline";
import main from "./csiro";
var path = require("path");

let rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function cliLoop() {
  while (true) { //ask for an answer by resolving the question() promise which provides a string
    const answer = await new Promise<string>((resolve) => {
      rl.question("Enter filename: \n", resolve);
    });
    const fileName = answer.toLowerCase();
    const ext = path.extname(fileName);
    const fileType: number = ext == ".csv" ? 0 : ext == ".json" ? 1 : -1;

    //helper that's just going to stop it failing if you type in something that doesn't exist
    let out = 0;
    if (out = main(fileType, fileName)) { //on error exit
      console.log("sucessfully processed\n----\n");
    } else {
      console.log("\n----\n");
    }
  }
}

cliLoop(); //start the loop
