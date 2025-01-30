const { jest } = await import("@jest/globals");
import "fake-indexeddb/auto";

global.jest = jest;

export { };