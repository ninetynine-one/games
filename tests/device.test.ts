import assert from "node:assert/strict"
import { test } from "node:test"

import { deviceContext, withDevice } from "../src/lib/device.ts"

const headers = (h: Record<string, string>) => new Headers(h)
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"
const ANDROID_REDUCED =
  "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36"
const ANDROID_FIREFOX =
  "Mozilla/5.0 (Android 14; Mobile; rv:131.0) Gecko/131.0 Firefox/131.0"
const SAMSUNG_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-A536E) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36"
const MAC_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"
const WIN_EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0"

test("iPhone is Apple on iOS Safari, with the Vercel country", () => {
  assert.deepEqual(
    deviceContext(
      headers({ "user-agent": IPHONE, "x-vercel-ip-country": "CL" })
    ),
    { country: "CL", browser: "Safari", os: "iOS", brand: "Apple", model: null }
  )
})

test("reduced Android UA takes the brand from the model client hint", () => {
  const c = deviceContext(
    headers({ "user-agent": ANDROID_REDUCED, "sec-ch-ua-model": '"SM-S918B"' })
  )
  assert.equal(c.brand, "Samsung")
  assert.equal(c.model, "SM-S918B")
  assert.equal(c.browser, "Chrome")
  const xiaomi = deviceContext(
    headers({
      "user-agent": ANDROID_REDUCED,
      "sec-ch-ua-model": '"23021RAAEG"',
    })
  )
  assert.equal(xiaomi.brand, "Xiaomi")
})

test("Android without a model is just Android", () => {
  assert.equal(
    deviceContext(headers({ "user-agent": ANDROID_REDUCED })).brand,
    "Android"
  )
  assert.equal(
    deviceContext(headers({ "user-agent": ANDROID_FIREFOX })).brand,
    "Android"
  )
})

test("full Android UA still yields the model", () => {
  const c = deviceContext(headers({ "user-agent": SAMSUNG_UA }))
  assert.equal(c.browser, "Samsung Internet")
  assert.equal(c.model, "SM-A536E")
  assert.equal(c.brand, "Samsung")
})

test("desktop has browser and system but no brand", () => {
  assert.deepEqual(deviceContext(headers({ "user-agent": MAC_SAFARI })), {
    country: null,
    browser: "Safari",
    os: "macOS",
    brand: null,
    model: null,
  })
  const edge = deviceContext(headers({ "user-agent": WIN_EDGE }))
  assert.equal(edge.browser, "Edge")
  assert.equal(edge.os, "Windows")
})

test("a bogus country header is dropped", () => {
  assert.equal(
    deviceContext(headers({ "x-vercel-ip-country": "<script>" })).country,
    null
  )
})

test("only session_start gets the context, overriding the client", () => {
  const events = [
    { type: "session_start", data: { device: "mobile", country: "XX" } },
    { type: "level_start", data: {} },
  ]
  const out = withDevice(
    events,
    headers({ "user-agent": IPHONE, "x-vercel-ip-country": "AR" })
  )
  assert.equal(out[0].data.country, "AR")
  assert.equal(out[0].data.device, "mobile")
  assert.deepEqual(out[1].data, {})
})
