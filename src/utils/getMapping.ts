import * as fs from "fs";
import * as path from "path";

type Mapping = {
  type: string;
  from: string;
  to: string;
};

const mappingsPath = path.join(__dirname, "../..", "variableMappings.json"); // Adjust the path as necessary
const mappings: Mapping[] = JSON.parse(fs.readFileSync(mappingsPath, "utf8"));
const mappingsGrouppedByType = mappings.reduce((acc, mapping) => {
  if (!acc[mapping.type]) {
    acc[mapping.type] = {};
  }
  acc[mapping.type][mapping.from] = mapping.to;
  return acc;
}, {} as Record<string, Record<string, string>>);

export default function (type: string, name: string) {
  return mappingsGrouppedByType[type]?.[name];
}
