import { pgTable, serial, text, timestamp, index, point } from "drizzle-orm/pg-core"

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("Post_name_idx").on(table.name)
  ]
)

export const merchants = pgTable(
  "merchants",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    address: text("address").notNull(),
    registrationId: text("registrationId").notNull().unique(),
    location: point("location", { mode: "xy"}).notNull(),
    province: text("province"),
    city: text("city"),
    district: text("district"),
    village: text("village"),
  },
  (table) => [
    index("Merchant_registrationId_idx").on(table.registrationId),
    index("Merchant_location_idx").on(table.location),
    index("Merchant_province_idx").on(table.province),
    index("Merchant_city_idx").on(table.city),
    index("Merchant_district_idx").on(table.district),
    index("Merchant_village_idx").on(table.village),
  ]
)