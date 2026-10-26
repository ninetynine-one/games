import assert from "node:assert/strict"
import { test } from "node:test"

import { isSameOrigin, parseBatch } from "../src/lib/events.ts"

const slugs = ["jardineros", "chatarra"] as const
const uuid = "3f1c2a4e-8b7d-4c3a-9e2f-1a2b3c4d5e6f"
const event = {
  type: "level_end",
  at: "2026-10-25T21:00:00.000Z",
  level: 1,
  wave: 10,
  data: { result: "win", durationS: 612 },
}
const batch = (over = {}) =>
  JSON.stringify({
    game: "jardineros",
    version: "0.5.0",
    player: uuid,
    session: uuid,
    events: [event],
    ...over,
  })

test("valid batch passes through", () => {
  const result = parseBatch(batch(), slugs)
  assert.equal(result.status, 204)
  assert.ok(result.status === 204 && result.batch)
  assert.equal(result.batch.events[0].wave, 10)
})

test("malformed JSON and oversized bodies are 400", () => {
  assert.equal(parseBatch("{nope", slugs).status, 400)
  assert.equal(parseBatch("x".repeat(32 * 1024 + 1), slugs).status, 400)
})

test("contract violations are dropped silently", () => {
  const dropped = (over: object) => {
    const r = parseBatch(batch(over), slugs)
    return r.status === 204 && r.batch === null
  }
  assert.ok(dropped({ game: "ultima-hora" }))
  assert.ok(dropped({ player: "not-a-uuid" }))
  assert.ok(dropped({ events: [] }))
  assert.ok(dropped({ events: Array(51).fill(event) }))
  assert.ok(dropped({ events: [{ ...event, type: "click" }] }))
  assert.ok(dropped({ events: [{ ...event, level: 1.5 }] }))
  assert.ok(dropped({ events: [{ ...event, data: { nested: { a: 1 } } }] }))
  assert.ok(
    dropped({ events: [{ ...event, data: { big: "x".repeat(2100) } }] })
  )
})

test("only same origin", () => {
  const req = (headers: Record<string, string>) =>
    new Request("http://localhost/api/events", { method: "POST", headers })
  const origin = "http://localhost"
  assert.ok(isSameOrigin(req({ origin }), origin))
  assert.ok(!isSameOrigin(req({ origin: "https://evil.example" }), origin))
  assert.ok(isSameOrigin(req({ "sec-fetch-site": "same-origin" }), origin))
  assert.ok(!isSameOrigin(req({}), origin))
})
