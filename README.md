# Toon Format + Gemini — PoC 🎬

> **Companion repository for the YouTube video.**
> All code shown in the video lives here so you can follow along, run the experiments yourself, and explore the results.

---

## 📺 Watch the Video

[![Watch on YouTube](https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=VIDEO_ID)

> 🔗 **Video URL:** `https://www.youtube.com/watch?v=VIDEO_ID`
> _(`VIDEO_ID` to be added)_

---

## 📖 What This Repo Is About

This repository demonstrates how the **[Toon Format](https://github.com/toon-format/toon)** — a compact, token-efficient data serialisation format — compares to plain JSON when used as structured input for **Google Gemini** prompts.

The core thesis: _Toon-encoded data consumes significantly fewer tokens than equivalent JSON, which means lower cost and faster responses when feeding structured data to an LLM._

### Proof-of-Concept Scenarios

| PoC                  | Script                         | What it does                                                               |
| -------------------- | ------------------------------ | -------------------------------------------------------------------------- |
| **Simple (JSON)**    | `npm run poc:simple`           | Sends a moderation dataset encoded as JSON to Gemini                       |
| **Simple (Toon)**    | `npm run poc:simple-toon`      | Same dataset, encoded with Toon instead                                    |
| **Token Comparison** | `npm run poc:token-comparison` | Side-by-side token count for JSON vs Toon on the same payload              |
| **Moderation**       | `npm run poc:moderation`       | Classifies chat messages and proposes moderation actions                   |
| **Log Analysis**     | `npm run poc:logs`             | Gemini performs root-cause analysis on a set of log events                 |
| **Incident Report**  | `npm run poc:report`           | Gemini generates a leadership-ready incident report from raw incident data |
| **All**              | `npm run poc:all`              | Runs every PoC sequentially                                                |

---

## 🚀 Getting Started

### Prerequisites

- Node.js **22.x**
- A **Google Gemini API key** — grab one at [aistudio.google.com](https://aistudio.google.com)

### Installation

```bash
git clone https://github.com/your-username/toon-gemini-poc.git
cd toon-gemini-poc
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

### Running a PoC

```bash
# Token comparison — the core demo from the video
npm run poc:token-comparison

# Content moderation with Toon-encoded input
npm run poc:moderation

# Log root-cause analysis
npm run poc:logs

# Incident report generation
npm run poc:report
```

---

## 🗂️ Project Structure

```
src/
├── poc/          # Individual proof-of-concept entry points
├── prompt/       # Mustache prompt templates (.prompt.md)
├── data/         # Sample datasets (JSON / Toon)
└── shared/       # Shared helpers (Gemini runner, prompt renderer, env)
scripts/          # Dev utility scripts
tests/            # Vitest unit tests
```

---

## 🛠️ Tech Stack

- **TypeScript** (strict mode)
- **Google Gemini** via `@google/genai`
- **Toon Format** via `@toon-format/toon`
- **Mustache** for prompt templating
- **tsx** for running TypeScript directly

---

## 📄 License

MIT
