---
title: PillowBasics v0.1.0 Release
date: 2026-03-29
summary: Announcing the first public release of PillowBasics — what's in, what's coming, and how to contribute.
---

# PillowBasics v0.1.0 Released 🎉

We are thrilled to announce the first public release of the **PillowBasics** game engine: **v0.1.0**.

## What's Included

### Core Systems
- **Renderer** — OpenGL 4.6 backend with a configurable render graph
- **ECS** — Fast entity-component-system with archetype storage
- **Input** — Unified keyboard, mouse, and gamepad input layer
- **Audio** — OpenAL-based 2D and 3D audio system
- **Asset pipeline** — Hot-reloadable assets with a dependency tracker

### Scripting
- Lua 5.4 scripting with full engine bindings
- Live reload during development

## Breaking Changes

This is a `0.x` release, so the API is not yet stable. Expect changes between minor versions.

## How to Build

```bash
git clone https://github.com/ModulePillow/PillowBasics.git
cd PillowBasics
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

## Contributing

We welcome contributions of all kinds — bug reports, feature proposals, and pull requests. Please read `CONTRIBUTING.md` before opening a PR.

Looking forward to seeing what you build!
