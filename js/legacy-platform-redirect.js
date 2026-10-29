// Preserve saved links while retiring duplicate product administration screens.
(() => {
 const product = document.currentScript.dataset.product;
 const current = new URL(location.href);
 const legacy = /\/(manager|pay)\/platform\/$/.test(current.pathname) || current.pathname === "/dashboard/host/overview/" || (product === "host" && ["overview","Overview","Platform"].includes(current.searchParams.get("view")));
 if (!legacy) return;
 const query = new URLSearchParams({ product });
 if (current.searchParams.get("lang") === "he") query.set("lang", "he");
 location.replace("/dashboard/platform/?" + query);
})();
