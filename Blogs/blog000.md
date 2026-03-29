---
title: Welcome to PillowBasics Blog
date: 2026-03-29
summary: An introduction to the PillowBasics open-source game engine and what you can expect from this blog.
---

# Welcome to PillowBasics Blog

Hello and welcome! This is the official blog for **PillowBasics**, an open-source game engine built for simplicity and performance.

## What is PillowBasics?

PillowBasics is a lightweight, modular game engine designed to help indie developers build 2D and 3D games without the overhead of more complex engines. It is written in modern C++ and exposes a clean scripting API.

## What to Expect

In this blog, we will cover:

- **Release notes** — what changed in each version
- **Tutorials** — step-by-step guides for common use cases
- **Deep dives** — detailed technical write-ups on engine internals
- **Community highlights** — cool projects built with PillowBasics

## Getting Started

Head over to the [GitHub repository](https://github.com/ModulePillow) to download the latest release and read the documentation.

```cpp
// Your first PillowBasics scene
#include <pillow/engine.h>

int main() {
    Pillow::Engine engine;
    engine.createWindow("Hello, PillowBasics!", 1280, 720);
    engine.run();
    return 0;
}
```

Stay tuned for more posts!
