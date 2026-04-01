import { task, schedules } from "@trigger.dev/sdk/v3";

export const ingestAstronomyEvents = schedules.task({
  id: "ingest-astronomy-events",
  cron: "0 0 * * *",
  run: async () => {
    console.log("Ingesting daily astronomy events");
    // TODO: Fetch from astronomy APIs and upsert to DB
  },
});
