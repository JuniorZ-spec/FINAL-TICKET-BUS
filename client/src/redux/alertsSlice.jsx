import { createSlice } from "@reduxjs/toolkit";

// loadingCount (pas un booléen) : plusieurs fetchs concurrents peuvent être en
// vol en même temps (ex. validation du token + chargement des données d'une
// page). Avec un simple booléen, le premier fetch terminé masque le loader
// alors qu'un autre est encore en cours, provoquant un scintillement.
const alertsSlice = createSlice({
  name: "alerts",
  initialState: {
    loadingCount: 0,
  },
  reducers: {
    ShowLoading: (state) => {
      state.loadingCount += 1;
    },
    HideLoading: (state) => {
      state.loadingCount = Math.max(0, state.loadingCount - 1);
    },
  },
});

export const { ShowLoading, HideLoading } = alertsSlice.actions;
export default alertsSlice.reducer;
