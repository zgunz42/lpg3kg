import { z } from "zod";
import { j } from "../jstack";
import axios from "axios";
import { MerchantResponse } from "../types";
import { HTTPException } from "hono/http-exception";

export const merchantsRouter = j.router({
  near: j.procedure.input(
    z.object({
      latitude: z.number().min(-90, { message: "Latitude must be at least -90." }).max(90, { message: "Latitude must be at most 90." }),
      longitude: z.number().min(-180, { message: "Longitude must be at least -180." }).max(180, { message: "Longitude must be at most 180." }),
    })
  ).query(async ({ c, input }) => {
    const { latitude, longitude } = input;
    const { data } = await axios.get<MerchantResponse>(
      'https://subsiditepatlpg.mypertamina.id/infolpg3kg/api/general/general/v1/merchants/near-location',
      {
        params: { latitude, longitude }
      },
    );

    if (!data || !data.success) {
      throw new HTTPException(500, {
        message: data.message
      })
    }

    return c.superjson({
      data: data.data.merchants,
      message: data.message,
      code: 200
    });
  }),
})
