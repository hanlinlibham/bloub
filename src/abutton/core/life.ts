import { onBeforeUnmount, onMounted, ref, shallowRef, type Ref } from 'vue'
import { expressionOf, type AltKind, type FaceParams } from './expressions'
import { stillPose, type Mode, type Pose } from './face'
import { clamp, lerp, rand, spring, stepSpring } from './math'

export type Lock = 'auto' | 'idle' | 'gaze' | 'thinking' | 'speaking' | 'sleep'

export interface Tuning {
  speed: number
  breath: number
  bounce: number
  damping: number
  gaze: number
  squash: number
  sleepAfter: number
  debug: boolean
}

export const DEFAULT_TUNING: Tuning = {
  speed: 1,
  breath: 1,
  bounce: 0.2,
  damping: 0.7,
  gaze: 1,
  squash: 1,
  sleepAfter: 20,
  debug: false
}

export const STATUS: Record<Mode, string> = {
  idle: 'IDLE · 发呆',
  gaze: 'GAZE · 注视',
  thinking: 'THINKING · 思考',
  speaking: 'SPEAKING · 说话',
  sleep: 'SLEEP · 变回纽扣',
  press: 'CLICK · 被戳',
  drag: 'STRETCH · 被拉',
  flip: 'FLIP · 翻面'
}

export interface Pop {
  id: number
  text: string
  x: number
}

const POPS = ['Duang!', '啵～', '嘿!', '弹!', '哎呀']
const LINES = [
  '你好呀！我是扣扣，一颗会思考的小纽扣。有什么想法，我们一起把它扣上？',
  '收到～我把这件事缝进清单啦，接下来交给我。',
  '嗯嗯，这个思路扣得很紧，我再帮你把细节理一理！'
]

interface Options {
  mood: Ref<string>
  lock: Ref<Lock>
  tuning: Ref<Tuning>
  stageRect: () => DOMRect | null
}

export function useButtonLife(o: Options) {
  const pose = shallowRef<Pose>(stillPose('dormant'))
  const mode = ref<Mode>('sleep')
  const bubble = ref<{ on: boolean; text: string; thinking: boolean }>({ on: false, text: '', thinking: false })
  const pops = ref<Pop[]>([])
  const fps = ref(60)

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.4 : 1
  const E: FaceParams = { ...expressionOf('dormant').face }
  let kindL: AltKind = 'arc'
  let kindR: AltKind = 'arc'

  const sx = spring(1)
  const sy = spring(1)
  const rot = spring(0)
  const dx = spring(0)
  const dy = spring(0)
  let jumpY = 0
  let jumpV = 0
  const look = { x: 0, y: 0, tx: 0, ty: 0 }

  let now = 0
  let last = 0
  let raf = 0
  let task: 'thinking' | 'speaking' | null = null
  let pressing = false
  let pressOrigin = { x: 0, y: 0 }
  let drag = { x: 0, y: 0, d: 0 }
  let dormant = true
  let introDone = false
  let lastActivity = 0
  let lastMove = -1e9
  let pointer = { x: 0, y: 0, has: false }
  let inputFocused = false
  let inputLen = 0
  let flashQ: [string, number][] = []
  let flashUntil = 0
  let flashName: string | null = null
  let lid = 1
  let nextBlink = 0
  let blinkEnd = 0
  let nextGlance = 0
  let glance = { x: 0, y: 0 }
  let nextYawn = 12000
  let yawnUntil = 0
  let nextShimmy = 9000
  let shimmyUntil = 0
  let talkOpen = 0
  let nextHop = 0
  let phase = 0
  let arc = 0
  let flipStart = -1
  let presses: number[] = []
  let dizzyUntil = 0
  let speakTimer: ReturnType<typeof setTimeout> | undefined
  let popId = 0
  let lineIdx = 0
  let frames = 0
  let fpsAt = 0

  function flash(seq: [string, number][]) {
    flashQ = seq.slice()
    flashUntil = 0
  }

  function activity() {
    lastActivity = now
    if (dormant && introDone && o.lock.value !== 'sleep') wake()
  }

  function wake() {
    dormant = false
    jumpV = -7 * reduced
    flash([['surprise', 380], ['smile', 700]])
  }

  function center() {
    const r = o.stageRect()
    if (!r) return null
    return { x: r.left + r.width * 0.5, y: r.top + r.height * (204 / 400), w: r.width }
  }

  function onPointer(x: number, y: number) {
    pointer = { x, y, has: true }
    lastMove = now
    if (pressing) {
      const r = o.stageRect()
      const k = r ? 400 / r.width : 1
      drag = { x: (x - pressOrigin.x) * k, y: (y - pressOrigin.y) * k, d: 0 }
      drag.d = Math.hypot(drag.x, drag.y)
    }
    activity()
  }

  function pressStart(x?: number, y?: number) {
    activity()
    pressing = true
    pressOrigin = { x: x ?? pointer.x, y: y ?? pointer.y }
    drag = { x: 0, y: 0, d: 0 }
  }

  function pressEnd() {
    if (!pressing) return
    pressing = false
    const wasDrag = drag.d > 14
    drag = { x: 0, y: 0, d: 0 }
    if (wasDrag) {
      jumpV = -8 * reduced
      flash([['surprise', 200], ['joy', 800]])
      pop('嗖～')
      return
    }
    jumpV = -11 * reduced * o.tuning.value.squash
    sy.v += 0.1 * reduced
    sx.v -= 0.06 * reduced
    presses = [...presses.filter((t) => now - t < 1600), now]
    if (presses.length >= 4) {
      presses = []
      dizzyUntil = now + 1800
      flash([['dizzy', 1800], ['smile', 600]])
      pop('晕～')
      return
    }
    flash([['surprise', 260], ['joy', 950]])
    pop(POPS[Math.floor(Math.random() * POPS.length)]!)
  }

  function pop(text: string) {
    const id = ++popId
    pops.value = [...pops.value, { id, text, x: 50 + rand(-18, 18) }]
    setTimeout(() => (pops.value = pops.value.filter((p) => p.id !== id)), 950)
  }

  function flip() {
    activity()
    if (flipStart >= 0) return
    flipStart = now
    jumpV = -10 * reduced
  }

  function stopSpeak() {
    clearTimeout(speakTimer)
    speakTimer = undefined
  }

  function think() {
    stopSpeak()
    activity()
    task = 'thinking'
    bubble.value = { on: true, text: '', thinking: true }
  }

  function speak(text: string, after?: () => void) {
    stopSpeak()
    activity()
    task = 'speaking'
    bubble.value = { on: true, text: '', thinking: false }
    let i = 0
    const s = () => Math.max(0.25, o.tuning.value.speed)
    const tick = () => {
      if (i >= text.length) {
        talkOpen = 0
        speakTimer = setTimeout(() => {
          task = null
          bubble.value = { ...bubble.value, on: false }
          flash([['smile', 900]])
          after?.()
        }, 1300 / s())
        return
      }
      const ch = text[i++]!
      bubble.value = { on: true, text: bubble.value.text + ch, thinking: false }
      const punct = /[，。！？、～,.!?…\s]/.test(ch)
      talkOpen = punct ? 0 : rand(0.5, 1)
      speakTimer = setTimeout(tick, (punct ? 240 : 58) / s())
    }
    tick()
  }

  function speakLine(after?: () => void) {
    speak(LINES[lineIdx++ % LINES.length]!, after)
  }

  function reply(userText: string, onSpeak?: () => void, after?: () => void) {
    think()
    const short = userText.length > 14 ? userText.slice(0, 14) + '…' : userText
    speakTimer = setTimeout(() => {
      onSpeak?.()
      speak(`听到啦：「${short}」。让我把它和其他线索扣在一起，慢慢想明白～`, after)
    }, 1700 / Math.max(0.25, o.tuning.value.speed))
  }

  function clearTask() {
    stopSpeak()
    task = null
    bubble.value = { on: false, text: '', thinking: false }
  }

  function react() {
    activity()
    jumpV = -6 * reduced
  }

  function setInput(focused: boolean, len: number) {
    inputFocused = focused
    inputLen = len
    if (focused) activity()
  }

  function effectiveMode(): Mode {
    const lock = o.lock.value
    if (lock === 'sleep') return 'sleep'
    if (task) return task
    if (lock === 'idle') return 'idle'
    if (lock === 'gaze') return 'gaze'
    return inputFocused || now - lastMove < 2500 ? 'gaze' : 'idle'
  }

  function frame(real: number) {
    const dt = last ? Math.min(real - last, 50) : 16.7
    last = real
    const T = o.tuning.value
    const s = clamp(T.speed, 0.1, 3)
    const step = (dt / 16.7) * s
    now += dt * s
    const t = now / 1000

    frames++
    if (real - fpsAt > 500) {
      fps.value = Math.round((frames * 1000) / (real - fpsAt))
      frames = 0
      fpsAt = real
    }

    const m = effectiveMode()
    if (m === 'sleep' && !dormant) dormant = true
    if (m !== 'sleep' && o.lock.value !== 'auto' && dormant && introDone) wake()
    if (!dormant && introDone && m === 'idle' && !pressing && T.sleepAfter > 0 && now - lastActivity > T.sleepAfter * 1000) {
      dormant = true
    }

    if (flashQ.length && now >= flashUntil) {
      const [n, d] = flashQ.shift()!
      flashName = n
      flashUntil = now + d
    } else if (!flashQ.length && now >= flashUntil) flashName = null

    if (m === 'idle' && !dormant && !flashName && now > nextYawn) {
      yawnUntil = now + 1700
      nextYawn = now + rand(14000, 22000)
    }
    if (m === 'idle' && !dormant && !flashName && now > nextShimmy && now > yawnUntil) {
      shimmyUntil = now + 900
      nextShimmy = now + rand(10000, 16000)
    }

    // flip
    let flipCos = 1
    if (flipStart >= 0) {
      const k = clamp((now - flipStart) / 800, 0, 1)
      const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
      flipCos = Math.cos(e * Math.PI * 2)
      if (k >= 1) {
        flipStart = -1
        flipCos = 1
        flash([['joy', 900]])
      }
    }
    const back = flipCos < 0

    const mood = o.mood.value
    const dragging = pressing && drag.d > 14
    let ex: string
    if (back || dormant) ex = 'dormant'
    else if (dragging) ex = 'strain'
    else if (pressing) ex = 'squeeze'
    else if (flashName) ex = flashName
    else if (m === 'thinking') ex = 'think'
    else if (m === 'speaking') ex = 'talk'
    else if (now < yawnUntil) ex = 'yawn'
    else if (m === 'gaze' && mood === 'neutral') {
      const c = center()
      const near = c && pointer.has && Math.hypot(pointer.x - c.x, pointer.y - c.y) < c.w * 0.32
      ex = near ? 'smile' : 'neutral'
    } else ex = mood

    const X = expressionOf(ex)
    const target = { ...X.face }
    if (ex === 'talk') {
      target.mh = 8 + talkOpen * 22
      target.mw = 26 + talkOpen * 8
    }
    if (target.altL > 0.5) kindL = X.kindL
    if (target.altR > 0.5) kindR = X.kindR
    const baseRate = back ? 1 : ex === 'dormant' || (E.mg > 2 && !dormant) ? 0.09 : 0.22
    const rate = Math.min(1, baseRate * step)
    for (const k in target) {
      const key = k as keyof FaceParams
      E[key] = lerp(E[key], target[key], rate)
    }
    talkOpen *= Math.pow(0.9, step)

    // blink
    if (!dormant && ex !== 'yawn' && ex !== 'sleepy') {
      if (now > nextBlink) {
        blinkEnd = now + 130
        nextBlink = now + rand(2200, 5200)
        if (Math.random() < 0.2) nextBlink = now + 260
      }
      lid = now < blinkEnd ? 0.08 : lerp(lid, 1, Math.min(1, 0.35 * step))
    } else lid = lerp(lid, 1, Math.min(1, 0.3 * step))

    // where to look
    const c = center()
    if (dormant || back) {
      look.tx = 0
      look.ty = 0
    } else if (dragging) {
      look.tx = clamp(drag.x / 60, -1, 1)
      look.ty = clamp(drag.y / 60, -1, 1)
    } else if (m === 'thinking') {
      look.tx = 0.45 + Math.sin(t * 1.4) * 0.45
      look.ty = -0.75
    } else if (m === 'speaking') {
      look.tx = Math.sin(t * 0.9) * 0.18
      look.ty = 0.15
    } else if (m === 'gaze') {
      if (inputFocused && now - lastMove > 800) {
        look.tx = clamp((inputLen - 12) / 18, -1, 1) * 0.5 + 0.5
        look.ty = 0.8
      } else if (pointer.has && c) {
        look.tx = clamp((pointer.x - c.x) / (c.w * 0.55), -1, 1) * T.gaze
        look.ty = clamp((pointer.y - c.y) / (c.w * 0.55), -1, 1) * T.gaze
      }
    } else {
      if (now > nextGlance) {
        glance = Math.random() < 0.45 ? { x: 0, y: 0 } : { x: rand(-0.8, 0.8), y: rand(-0.6, 0.5) }
        nextGlance = now + rand(1800, 4200)
      }
      look.tx = glance.x
      look.ty = glance.y
    }
    look.tx = clamp(look.tx, -1.4, 1.4)
    look.ty = clamp(look.ty, -1.4, 1.4)
    const lr = Math.min(1, (m === 'gaze' ? 0.16 : 0.08) * step)
    look.x = lerp(look.x, look.tx, lr)
    look.y = lerp(look.y, look.ty, lr)

    // body
    const br = T.breath * reduced
    const breath = Math.sin(t * 2.1) * 0.014 * br
    let tsx = 1 - breath * 0.6
    let tsy = 1 + breath
    let trot = 0
    if (dormant) {
      const b = Math.sin(t * 1.2) * 0.012 * br
      tsx = 1 - b * 0.5
      tsy = 1 + b
    } else if (m === 'idle') trot = Math.sin(t * 0.9) * 2.2 * reduced + look.x * 3
    else if (m === 'gaze') trot = look.x * 8 * reduced * T.gaze
    else if (m === 'speaking') {
      trot = Math.sin(t * 4.6) * 2.6 * reduced
      tsy += Math.abs(Math.sin(t * 9)) * 0.025 * reduced
    } else if (m === 'thinking') {
      trot = Math.sin(t * 17) * 1.6 * reduced
      if (jumpY === 0 && now > nextHop) {
        jumpV = -rand(3, 5.5) * reduced
        nextHop = now + rand(180, 340)
      }
    }
    if (now < shimmyUntil && !dormant) {
      trot = Math.sin(t * 22) * 7 * reduced
      tsy += Math.abs(Math.sin(t * 22)) * 0.03
    }
    if (now < dizzyUntil) trot = Math.sin(t * 9) * 9 * reduced
    if (ex === 'yawn') {
      tsy = 1.07
      tsx = 0.95
      trot = -3 * reduced
    }

    let tdx = 0
    let tdy = 0
    if (dragging) {
      tdx = clamp(drag.x * 0.45, -70, 70)
      tdy = clamp(drag.y * 0.35, -80, 24)
      const st = clamp(drag.d / 220, 0, 0.35)
      tsx = 1 - st * 0.55
      tsy = 1 + st
      trot = clamp(drag.x * 0.12, -18, 18)
    } else if (pressing) {
      const q = clamp(T.squash, 0.3, 1.8)
      tsx = 1 + 0.18 * q
      tsy = 1 - 0.3 * q
      trot = 0
    }

    sx.t = tsx
    sy.t = tsy
    rot.t = trot
    dx.t = tdx
    dy.t = tdy
    const k = T.bounce
    const d = T.damping
    stepSpring(sx, k, d, step)
    stepSpring(sy, k, d, step)
    stepSpring(rot, k * 0.6, Math.min(0.95, d + 0.08), step)
    stepSpring(dx, k * 0.7, d, step)
    stepSpring(dy, k * 0.7, d, step)

    jumpV += 0.9 * step
    jumpY += jumpV * step
    if (jumpY >= 0) {
      if (jumpV > 2.5) {
        sy.v -= jumpV * 0.011 * reduced * T.squash
        sx.v += jumpV * 0.008 * reduced * T.squash
      }
      jumpY = 0
      jumpV = 0
    }
    if (pressing) {
      jumpY = 0
      jumpV = 0
    }

    if (m === 'thinking' && !pressing) {
      phase = t
      arc += 9 * step
    }
    const arcTarget = m === 'thinking' ? 1 : 0

    const shown: Mode = flipStart >= 0 ? 'flip' : dragging ? 'drag' : pressing ? 'press' : dormant ? 'sleep' : m
    if (mode.value !== shown) mode.value = shown

    const prev = pose.value
    pose.value = {
      x: dx.x,
      y: jumpY + dy.x,
      rot: rot.x,
      sx: sx.x * flipCos,
      sy: sy.x,
      face: { ...E },
      kindL,
      kindR,
      open: lid,
      lookX: look.x,
      lookY: look.y,
      thinking: m === 'thinking' && !pressing && !dormant,
      phase,
      arc: lerp(prev.arc, arcTarget, Math.min(1, 0.15 * step)),
      spin: arc % 360,
      flip: flipCos,
      lift: clamp(-jumpY / 120, 0, 1),
      mode: shown,
      expression: ex,
      dormant
    }

    raf = requestAnimationFrame(frame)
  }

  onMounted(() => {
    raf = requestAnimationFrame(frame)
    setTimeout(() => {
      introDone = true
      if (o.lock.value !== 'sleep') wake()
    }, 1100)
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(raf)
    stopSpeak()
  })

  return {
    pose,
    mode,
    bubble,
    pops,
    fps,
    onPointer,
    pressStart,
    pressEnd,
    flip,
    think,
    speakLine,
    reply,
    clearTask,
    react,
    setInput,
    activity
  }
}

export type ButtonLife = ReturnType<typeof useButtonLife>
