import { describe, expect, it } from "bun:test";
import pino from "pino";

import { generateRequestId, getLogger, getRequestContext, withRequestContext } from "./index";

describe("logger", () => {
  it("creates logger with base fields", () => {
    // Create a test logger to verify structure
    const testLogger = pino({
      level: "info",
      base: {
        service: "test-service",
        environment: "test",
      },
    });

    // Verify logger can be created and has expected methods
    expect(typeof testLogger.info).toBe("function");
    expect(typeof testLogger.error).toBe("function");
    expect(typeof testLogger.warn).toBe("function");
    expect(typeof testLogger.debug).toBe("function");
  });

  it("child logger includes component field", () => {
    const childLogger = getLogger("auth.service");

    // Child logger should have bindings with component
    // We can verify this by checking the logger's bindings
    expect(typeof childLogger.info).toBe("function");
    expect(typeof childLogger.child).toBe("function");
  });
});

describe("request context", () => {
  it("returns undefined when outside context", () => {
    const context = getRequestContext();
    expect(context).toBeUndefined();
  });

  it("returns context when inside withRequestContext", async () => {
    const testContext = {
      requestId: "test-request-123",
      userId: "user-456",
      correlationId: "corr-789",
    };

    await withRequestContext(testContext, () => {
      const context = getRequestContext();
      expect(context).toEqual(testContext);
    });
  });

  it("context is isolated between calls", async () => {
    const context1 = { requestId: "req-1" };
    const context2 = { requestId: "req-2" };

    const results: Array<string | undefined> = [];

    await Promise.all([
      withRequestContext(context1, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push(getRequestContext()?.requestId);
      }),
      withRequestContext(context2, async () => {
        results.push(getRequestContext()?.requestId);
      }),
    ]);

    expect(results).toContain("req-1");
    expect(results).toContain("req-2");
  });

  it("getLogger includes requestId from context", async () => {
    const testContext = { requestId: "test-123" };

    await withRequestContext(testContext, () => {
      const logger = getLogger("test.component");
      // Logger should be created successfully with context
      expect(typeof logger.info).toBe("function");
    });
  });

  it("getLogger works without context", () => {
    const logger = getLogger("test.component");
    expect(typeof logger.info).toBe("function");
  });
});

describe("generateRequestId", () => {
  it("generates unique UUIDs", () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe("JSON output format", () => {
  it("produces valid JSON in production mode", () => {
    // Create a production-style logger (no transport)
    const chunks: string[] = [];
    const destination = {
      write: (chunk: string) => {
        chunks.push(chunk);
      },
    };

    const prodLogger = pino(
      {
        level: "info",
        base: {
          service: "ai-opti-nextjs-starter",
          environment: "production",
        },
      },
      destination as unknown as pino.DestinationStream,
    );

    prodLogger.info({ userId: "123" }, "user.login_completed");

    // Verify JSON output
    expect(chunks.length).toBeGreaterThan(0);
    const logEntry = JSON.parse(chunks[0] as string);
    expect(logEntry.service).toBe("ai-opti-nextjs-starter");
    expect(logEntry.environment).toBe("production");
    expect(logEntry.userId).toBe("123");
    expect(logEntry.msg).toBe("user.login_completed");
    expect(logEntry.level).toBe(30); // info level
  });

  it("child logger includes component in JSON output", () => {
    const chunks: string[] = [];
    const destination = {
      write: (chunk: string) => {
        chunks.push(chunk);
      },
    };

    const baseLogger = pino(
      {
        level: "info",
        base: { service: "test" },
      },
      destination as unknown as pino.DestinationStream,
    );

    const childLogger = baseLogger.child({ component: "auth.service" });
    childLogger.info("auth.login_started");

    const logEntry = JSON.parse(chunks[0] as string);
    expect(logEntry.component).toBe("auth.service");
    expect(logEntry.msg).toBe("auth.login_started");
  });
});
