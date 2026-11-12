import { configureStore } from "@reduxjs/toolkit";
import { api } from "@/lib/api/farmnomad";

export function makeStore() {
  return configureStore({
    reducer: { [api.reducerPath]: api.reducer },
    middleware: (gDM) => gDM().concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
