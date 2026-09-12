// Swap seam: every feature hook imports from here, never from ./demo-client
// or ./api-client directly. Each domain migrates independently — named
// exports below shadow demo-client.ts's star-export (ES modules resolve
// this without ambiguity) for whichever domains have a real backend;
// everything else still comes from demo data. Once every domain is real,
// demo-client.ts and this file's star-export can be deleted.
export * from "./demo-client";
export {
  getMeasurements,
  createMeasurement,
  updateMeasurement,
  deleteMeasurement,
} from "./api-client";
