# **Ryōiki Tenkai** (領域展開)

A local-first, ultra-fast AI desktop domain built with Rust & Tauri. It sits silently on your screen, listens to your voice, executes lightning-fast tools, and enforces complete domain focus—zero cloud tethering required.

---

## **The Domain Philosophy**

Most desktop AI apps are bloated, memory-hungry web views wrapped in heavy shells that force you to open a massive window just to ask a question.

**Ryōiki Tenkai** operates differently:

* **Zero-Friction Overlay:** Expands directly over your active workspace without stealing focus.
* **Local-First Muscle:** Runs state-of-the-art STT, TTS, and tool execution locally on your hardware.
* **100% Source Access:** Pay once for a lifetime license. Get immediate access to the private GitHub repository—fork it, patch it, open PRs, or bend the domain to your own rules.

---

## **The Shikigami & Techniques (Features)**

Every component inside **Ryōiki Tenkai** is driven by specialized local daemons and precise model bindings:

```
                  ┌─────────────────────────────────────────┐
                  │       Ryōiki Tenkai (Tauri + Rust)      │
                  └────────────────────┬────────────────────┘
                                       │
         ┌──────────────────┬──────────┴─────────┬──────────────────┐
         ▼                  ▼                    ▼                  ▼
  [ Inumaki ]          [ Panda ]             [ Gojo ]           [ Toji ]
   Whisper STT        Kitten TTS           Six Eyes Vision     Needle 3 Engine
 (Local/Hosted)      (Local Voice)        (Anti-Distraction)  (35MB Fast Tools)
         │                  │                    │                  │
         └──────────────────┴──────────┬─────────┴──────────────────┘
                                       │
                                       ▼
                                  [ Todo ]
                             Boogie Woogie Overlay
                            (Floating Screen Widget)
                                       │
                                       ▼
                                 [ Megumi ]
                             Ten Shadows Router
                           (Local & Cloud APIs)

```

### **1. Inumaki (Toge Inumaki) — Speech-to-Text**

> *"Salmon. Flake. Execute."*

* **Technique:** Cursed Speech (*Juin*).
* **Under the Hood:** Powered by an optimized local Whisper pipeline (or hosted endpoints). It converts raw voice input directly into domain commands without requiring manual typing.

### **2. Panda — Local Text-to-Speech**

> *"I'm not a panda... but I talk."*

* **Technique:** Mutated Cursed Corpse.
* **Under the Hood:** Runs **Kitten TTS** locally. Gives your domain an instant, natural voice response with near-zero latency and zero network overhead.

### **3. Gojo (Satoru Gojo) — Six Eyes Vision Monitor**

> *"Throughout Heaven and Earth, I alone am the focused one."*

* **Technique:** Six Eyes (*Rikugan*) + Limitless (*Mukagen*).
* **Under the Hood:** Uses lightweight vision decision models (Jev / Clef) to continuously assess your screen context. If you drift off into doomscrolling or distractions, Gojo detects the state change and issues a direct domain alert to snap you back.

### **4. Toji (Toji Fushiguro) — Heavy Restriction Engine**

> *"Zero cursed bloat. Pure physical execution speed."*

* **Technique:** Heavenly Restriction (*Ten'yu Chobuku*).
* **Under the Hood:** Driven by **Needle 3**—a tiny **35MB single-binary tool-calling engine** running natively on-device. Strips away heavy LLM dependencies to execute function calls at extreme speeds.

### **5. Todo (Aoi Todo) — Boogie Woogie Overlay**

> *"What is your type of desktop interface?"*

* **Technique:** Boogie Woogie (Instant Context Swap).
* **Under the Hood:** The primary floating screen widget. Instead of opening a heavy window, Todo swaps into view over your active app with a simple keybind, bringing your AI tools directly to your cursor.

### **6. Megumi (Megumi Fushiguro) — Ten Shadows API Router**

> *"With this sacred treasure, I summon... the right model."*

* **Technique:** Ten Shadows (*Tokusa no Kage Bōjutsu*).
* **Under the Hood:** Your model orchestrator. Automatically routes requests based on task complexity—keeping simple queries inside local models (Ollama) and summoning external APIs (OpenAI, Claude Code, custom endpoints) when heavy firepower is needed.

---

## **Tech Stack**

* **Framework:** Tauri v2 + Rust (Native system performance, minimal footprint)
* **Frontend UI:** Floating translucent overlay widget
* **Speech-to-Text:** Whisper (Local C++ bindings or hosted API compatibility)
* **Text-to-Speech:** Kitten TTS (Local ONNX/Rust runner)
* **Tool Calling Engine:** Needle 3 (35MB ultra-compact binary)
* **Vision & Decision:** Jev / Clef image availability scoring pipeline

---

## **License & Source Access**

**Ryōiki Tenkai** operates under a **Pay-Once, Own-the-Source** model.

1. **Buy a License:** One-time purchase. No subscriptions.
2. **Repository Access:** Receive an invitation to the private GitHub repository.
3. **Build & Contribute:** Clone the codebase, write custom Rust modules, tailor local models to your setup, or submit Pull Requests directly back to the main domain.

---

## **Quickstart (Local Build)**

```bash
# Clone the repository (Access granted after license purchase)
git clone https://github.com/your-org/ryoiki-tenkai.git
cd ryoiki-tenkai

# Install dependencies and build the Rust core
cargo check

# Run the domain overlay in development mode
cargo tauri dev

```

---