import { describe, it, expect } from "vitest";
import express from "express";
import { listRoutes } from "../routeList.mjs";

describe("routeList", () => {
  it("រាយតែ route /api ហើយមិនស្ទួន", () => {
    const app = express();
    app.get("/api/a", () => {});
    app.post("/api/a", () => {});
    app.get("/api/b/:id", () => {});
    app.get("/other", () => {});
    const r = listRoutes(app);
    expect(r).toEqual([
      { method: "GET", path: "/api/a" },
      { method: "POST", path: "/api/a" },
      { method: "GET", path: "/api/b/:id" },
    ]);
  });
});
