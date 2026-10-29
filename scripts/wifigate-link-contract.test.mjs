import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

// Execute the actual template controller, preserving opaque protocol fields.
// This is a source contract; browser and phone handoffs have separate evidence.
const template = readFileSync(new URL("../templates/wifigate-link.template.html", import.meta.url), "utf8");
const controller = [...template.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).find(script => script.includes("function buildDeepLink("));
assert.ok(controller, "the utility template supplies its invitation controller");

const cases = [
  ["missing", "/wifigate-link/", ""],
  ["unknown fields alone", "/wifigate-link/?unknown=retained", ""],
  ["explicit link", "/wifigate-link/?link=%20https%3A%2F%2Fexample.test%2Fopen%3Fep%3Dopaque%20&ep=ignored", "https://example.test/open?ep=opaque"],
  ["gate legacy chip", "/wifigate-link/?chip=synthetic&ep=opaque&ao=1", "wifigate://gate/synthetic?chip=synthetic&ep=opaque&ao=1&id=synthetic"],
  ["gate aliases precedence", "/wifigate-link/?i=first&id=second&chip=third", "wifigate://gate/first?i=first&id=second&chip=third"],
  ["opaque encrypted gate", "/wifigate-link/?ep=a%2Bb%2Fc%3D&ao=0&extra=%E2%9C%93", "wifigate://gate/invite?ep=a%2Bb%2Fc%3D&ao=0&extra=%E2%9C%93&id=invite"],
  ["group alias", "/wifigate-link/?groupId=synthetic%20group&ep=opaque", "wifigate://group/synthetic%20group?groupId=synthetic+group&ep=opaque&gid=synthetic+group&id=synthetic+group"],
  ["group route", "/group/synthetic?ep=opaque&ao=1", "wifigate://group/synthetic?ep=opaque&ao=1&gid=synthetic&id=synthetic"],
  ["dual alias", "/wifigate-link/?dualControlId=dual&ep=opaque", "wifigate://dual-control/dual?dualControlId=dual&ep=opaque&dcid=dual&id=dual"],
  ["dual route", "/dual-control/dual?ep=opaque", "wifigate://dual-control/dual?ep=opaque&dcid=dual&id=dual"],
  ["dual takes precedence", "/wifigate-link/?gid=group&dcid=dual&id=existing", "wifigate://dual-control/dual?gid=group&dcid=dual&id=existing"],
  ["duplicate opaque fields", "/wifigate-link/?gid=group&ep=one&ep=two&ao=1&ao=0", "wifigate://group/group?gid=group&ep=one&ep=two&ao=1&ao=0&id=group"],
  ["blank existing id is preserved", "/wifigate-link/?ep=opaque&id=", "wifigate://gate/invite?ep=opaque&id="],
  ["demo wins over explicit link", "/wifigate-link/?ep=v1.demo_synthetic&link=https%3A%2F%2Fexample.test", ""],
  ["embedded demo never opens", "/wifigate-link/?link=https%3A%2F%2Fexample.test%2F%3Fep%3Dv1.demo_synthetic", ""],
];

for (const [name, relative, expected] of cases) {
  test(`invitation mapping: ${name}`, () => {
    const result = runInNewContext(controller + "\nbuildDeepLink();", {
      URL, URLSearchParams, atob,
      window: { location: { href: "https://wifigate.io" + relative } },
      document: { addEventListener() {} },
    });
    assert.equal(result, expected);
  });
}
