import test from "node:test";
import assert from "node:assert/strict";
import { createExampleOrganization } from "../js/manager-example-organization.js";
import { createManagerExampleData } from "../js/manager-example-data.js";

test("example organization mutations stay isolated and preserve pending invitations", async () => {
  const a = createExampleOrganization(createManagerExampleData());
  const b = createExampleOrganization(createManagerExampleData());
  const before = await a.request(a.path);
  assert.equal(before.counts.users, 1);
  assert.equal(before.counts.administrators, 3);
  const invitation = await a.request(a.path + "/invitations", "POST", {
    email: " NEW@example.test ",
    role: "organization-user",
  });
  assert.equal(invitation.invitation.status, "pending");
  assert.equal((await a.request(a.path)).counts.users, 1);
  assert.equal(
    (await b.request(b.path + "/invitations?limit=100")).items.length,
    0,
  );
  await assert.rejects(
    a.request(a.path + "/invitations", "POST", {
      email: "new@example.test",
      role: "organization-user",
    }),
    /CONFLICT/,
  );
  await a.request(
    a.path + "/invitations/" + invitation.invitation.id + "/cancel",
    "POST",
  );
  assert.equal(
    (await a.request(a.path + "/invitations?limit=100")).items.length,
    0,
  );
  await a.request(a.path + "/members/demo-org-user/remove", "POST");
  assert.equal((await a.request(a.path)).counts.users, 0);
  assert.equal((await b.request(b.path)).counts.users, 1);
  await assert.rejects(
    a.request("/organizations/customer-account", "POST"),
    /EXAMPLE_SYSTEM_NOT_FOUND/,
  );
  await assert.rejects(
    a.request(a.path + "/logo", "POST", {
      expectedVersion: 999,
      logoDataUrl: null,
    }),
    /CONFLICT/,
  );
  await assert.rejects(
    a.request(a.path + "/logo", "POST", {
      expectedVersion: 1,
      logoDataUrl: "https://example.test/logo.svg",
    }),
    /INVALID_ORGANIZATION_LOGO/,
  );
  await a.request(a.path + "/logo", "POST", {
    expectedVersion: 1,
    logoDataUrl: null,
  });
  assert.equal((await a.request(a.path)).organization.version, 2);
  a.clear();
  assert.equal(
    (await a.request(a.path + "/members?limit=100")).items.length,
    0,
  );
});


test("example organization rename is versioned, validated and isolated", async()=>{
 const a=createExampleOrganization(createManagerExampleData()),b=createExampleOrganization(createManagerExampleData());
 const old=b.summary().name;
 await a.request(a.path+"/name","POST",{name:" Renamed demo ",expectedVersion:1});
 assert.equal(a.summary().name,"Renamed demo");assert.equal(a.summary().version,2);assert.equal(b.summary().name,old);
 await assert.rejects(a.request(a.path+"/name","POST",{name:"Stale",expectedVersion:1}),/CONFLICT/);
 await assert.rejects(a.request(a.path+"/name","POST",{name:" ",expectedVersion:2}),/INVALID_REQUEST/);
});
