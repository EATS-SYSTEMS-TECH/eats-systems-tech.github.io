// Browser-test helper: passes the /login/ gate game with a real, curved drag.
// The first provider tap opens the game; the tap after the pass signs in.

export async function passGateGame(page, provider, { clock = false } = {}) {
  const button = page.locator(`[data-provider="${provider}"]`);
  await button.click();
  const car = page.locator(".gate-game__car");
  await car.waitFor();
  const carBox = await car.boundingBox();
  const gateBox = await page
    .locator('.gate-game__gate[data-open="true"]')
    .boundingBox();
  const start = { x: carBox.x + carBox.width / 2, y: carBox.y + carBox.height / 2 };
  const end = { x: gateBox.x + gateBox.width / 2, y: gateBox.y + gateBox.height / 2 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  const steps = 24;
  for (let index = 1; index <= steps; index += 1) {
    const t = index / steps;
    const eased = t * t * (3 - 2 * t);
    await page.mouse.move(
      start.x + (end.x - start.x) * eased,
      start.y + (end.y - start.y) * t + Math.sin(Math.PI * t) * 18,
    );
    if (clock) await page.clock.runFor(30);
    else await page.waitForTimeout(30);
  }
  await page.mouse.up();
  if (clock) await page.clock.runFor(1000);
  await page.locator("dialog.gate-game").waitFor({ state: "detached" });
  return button;
}
