import { describe, it, expect } from "vitest";
import {
  notificationSettingsSchema,
  notificationMethodEnum,
} from "./notification";

describe("notificationMethodEnum", () => {
  it("accepts valid methods", () => {
    expect(notificationMethodEnum.safeParse("telegram").success).toBe(true);
    expect(notificationMethodEnum.safeParse("sms").success).toBe(true);
    expect(notificationMethodEnum.safeParse("none").success).toBe(true);
  });

  it("rejects invalid methods", () => {
    expect(notificationMethodEnum.safeParse("email").success).toBe(false);
    expect(notificationMethodEnum.safeParse("").success).toBe(false);
    expect(notificationMethodEnum.safeParse(null).success).toBe(false);
  });
});

describe("notificationSettingsSchema", () => {
  describe("when method is none", () => {
    it("accepts without target", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "none",
      });
      expect(result.success).toBe(true);
    });

    it("accepts with empty target", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "none",
        notification_target: "",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("when method is telegram", () => {
    it("requires notification_target", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "telegram",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.notification_target).toBeDefined();
      }
    });

    it("accepts valid numeric chat ID", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "telegram",
        notification_target: "123456789",
      });
      expect(result.success).toBe(true);
    });

    it("accepts negative chat ID (groups)", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "telegram",
        notification_target: "-1001234567890",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid username with @", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "telegram",
        notification_target: "@myusername",
      });
      expect(result.success).toBe(true);
    });

    it("accepts username with numbers and underscores", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "telegram",
        notification_target: "@user_name_123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects username without @", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "telegram",
        notification_target: "myusername",
      });
      expect(result.success).toBe(false);
    });

    it("rejects username starting with number", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "telegram",
        notification_target: "@123user",
      });
      expect(result.success).toBe(false);
    });

    it("rejects too short username", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "telegram",
        notification_target: "@abc", // 4 chars including @, but pattern expects 5-32 after @
      });
      expect(result.success).toBe(false);
    });
  });

  describe("when method is sms", () => {
    it("requires notification_target", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "sms",
      });
      expect(result.success).toBe(false);
    });

    it("accepts +855 format", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "sms",
        notification_target: "+85512345678",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 0 prefix format", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "sms",
        notification_target: "012345678",
      });
      expect(result.success).toBe(true);
    });

    it("accepts longer phone numbers", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "sms",
        notification_target: "+855123456789",
      });
      expect(result.success).toBe(true);
    });

    it("accepts phone numbers with spaces", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "sms",
        notification_target: "+855 12 345 678",
      });
      expect(result.success).toBe(true);
    });

    it("accepts phone numbers with dashes", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "sms",
        notification_target: "012-345-678",
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid phone format", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "sms",
        notification_target: "1234567",
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-Cambodian phone numbers", () => {
      const result = notificationSettingsSchema.safeParse({
        notification_method: "sms",
        notification_target: "+1234567890",
      });
      expect(result.success).toBe(false);
    });
  });
});
