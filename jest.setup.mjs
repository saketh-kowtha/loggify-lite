const { jest } = await import("@jest/globals");
import "fake-indexeddb/auto";
import structuredClone from "@ungap/structured-clone";

global.structuredClone = structuredClone;
global.jest = jest;

export { };