// Shared wording for Host and Manager system lists.
export function systemsEmptyCopy(language) {
  return language === "he"
    ? { title: "אין מערכות להצגה כרגע.", description: "הוסיפו מערכת מאפליקציית WIFIGATE כדי לנהל אותה כאן." }
    : { title: "No systems to display yet.", description: "Add a system from the WIFIGATE app to manage it here." };
}
