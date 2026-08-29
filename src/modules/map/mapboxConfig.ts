import Mapbox from "@rnmapbox/maps";

import { env } from "../../config/env";

// Imported for its side effect from App.tsx so the token is set once at startup,
// rather than from whichever map screen happens to mount first.
Mapbox.setAccessToken(env.MAPBOX_TOKEN);
