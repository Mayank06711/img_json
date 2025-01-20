import { spawn } from "child_process";
import path from "path";

const extractDataFromImage = (imagePath) => {
  return new Promise((resolve, reject) => {
    // Path to Python script relative to this file
    const scriptPath = new URL(
      "../imageParser/easyocr_script.py",
      import.meta.url
    );
    const pythonScriptPath = decodeURIComponent(scriptPath.pathname.slice(1));

    // Use Python from virtual environment
    const pythonPath = path.join(
      process.cwd(),
      "src",
      "imageParser",
      "venv",
      "Scripts",
      "python.exe"
    );

    // Spawn Python process with explicit path
    const pythonProcess = spawn(pythonPath, [pythonScriptPath, imagePath]);
    let result = "";

    // Collect data from script
    pythonProcess.stdout.on("data", (data) => {
      console.log(data.toString());
      result += data.toString();
      console.log(result);
    });

    // Handle errors
    pythonProcess.stderr.on("data", (data) => {
      console.error(`Error: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
        return;
      }

      try {
        // Clean the result string and parse the last valid JSON
        const lines = result.trim().split("\n");
        let lastValidJson = null;

        for (const line of lines) {
          try {
            lastValidJson = JSON.parse(line.trim());
          } catch (e) {
            // Skip invalid JSON lines
            continue;
          }
        }

        if (!lastValidJson) {
          reject(new Error("No valid JSON output found"));
          return;
        }

        // Check for Python script errors
        if (lastValidJson.error) {
          reject(new Error(lastValidJson.error));
          return;
        }

        // Extract text from OCR result
        const text = lastValidJson.map((item) => item.text).join(" ");

        // Parse the extracted text
        const jsonData = parseTextToJSON(text);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    });
  });
};
const parseTextToJSON = (text) => {
  // Clean and normalize the text
  const cleanText = text.replace(/[₹₨]/g, "₹").replace(/\s+/g, " ").trim();

  // Split text into sections
  const sections = cleanText.split("Current Establishment Details");
  const upperSection = sections[0];
  const lowerSection = sections[1];

  // Parse establishment details
  const establishmentDetails = {};
  if (lowerSection) {
    const lines = lowerSection.split("Est.");
    lines.forEach((line) => {
      if (line.includes("Name")) {
        establishmentDetails.establishmentName = line
          .split("Name")[1]
          .split("Id")[0]
          .trim();
      }
      if (line.includes("Id")) {
        establishmentDetails.establishmentId = line
          .split("Id")[1]
          .split("Member")[0]
          .trim();
      }
    });

    // Extract Member Id
    const memberIdMatch = lowerSection
      .split("Member Id")[1]
      ?.split("Date")[0]
      ?.trim();
    if (memberIdMatch) establishmentDetails.memberId = memberIdMatch;

    // Extract Date of Joining
    const dateMatch = lowerSection
      .split("Date of Joining")[1]
      ?.split("Experience")[0]
      ?.trim();
    if (dateMatch)
      establishmentDetails.dateOfJoining = dateMatch.replace(/\s*=\s*$/, "");

    // Extract Experience
    const experienceMatch = lowerSection.split("Experience")[1]?.trim();
    if (experienceMatch)
      establishmentDetails.experience = experienceMatch.replace(
        /\s*NT\s*$/,
        ""
      );
  }

  // Parse member wise balances
  const memberWiseBalances = [];
  if (upperSection.includes("Member Wise Balance")) {
    // Extract total balance
    let totalBalance = null;
    if (upperSection.includes("Total Available Balance")) {
      const balancePart = upperSection.split("Total Available Balance")[1];
      const balanceMatch = balancePart.match(/[\d,\.]+/);
      if (balanceMatch) {
        totalBalance = balanceMatch[0].replace(/\./g, ",");
      }
    }

    // Extract all member IDs
    const memberIdPattern = /(THTHA|TNMAS|PYBOM|THTHAQ|GNGGN|PYPNY)[A-Z0-9]+/g;
    const memberIds = upperSection.match(memberIdPattern) || [];

    // Create member wise balances array
    const uniqueMemberIds = [...new Set(memberIds)];
    uniqueMemberIds.forEach((memberId, index) => {
      memberWiseBalances.push({
        memberId,
        balance: index === 0 && totalBalance ? `₹ ${totalBalance}` : "₹ 0",
      });
    });

    return {
      home: {
        currentEstablishmentDetails: Object.keys(establishmentDetails).length
          ? establishmentDetails
          : null,
        memberWiseBalances,
        totalBalance,
      },
    };
  }

  return {
    home: {
      currentEstablishmentDetails: null,
      memberWiseBalances: [],
      totalBalance: null,
    },
  };
};

export default extractDataFromImage;
