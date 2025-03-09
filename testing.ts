import { get } from "./src/index.ts";

const x = await get("#klsjdfkl");

x.addTooltip("somestring", { accentColor: "red" });
