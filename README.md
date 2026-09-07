# LLM Gateway API

A backend API for interacting with multiple Large Language Model (LLM) providers through a unified interface.

Built with Node.js and Express, this project focuses on practical LLM application engineering, including API integration, prompt engineering, conversation context, streaming responses, error handling, retries, and multi-provider support.

---

## Overview

The LLM Gateway API provides a unified backend interface for communicating with different LLM providers.

Instead of connecting an application directly to a specific provider, the gateway acts as an abstraction layer between the client and the LLM providers.

```text
                    Client
                       |
                       v
              +----------------+
              |  LLM Gateway   |
              |      API       |
              +-------+--------+
                      |
              +-------+--------+
              |                |
              v                v
           OpenAI          Anthropic
              |                |
              v                v
          LLM Model        Claude Model
              |                |
              +-------+--------+
                      |
                      v
                   Response


Project Architecture
The application follows a layered backend architecture.

Client
  |
  v
Routes
  |
  v
Controllers
  |
  v
LLM Service
  |
  +-------------------+
  |                   |
  v                   v
OpenAI Service    Claude Service
  |                   |
  +---------+---------+
            |
            v
         Response
            |
            v
          Client

Node.js + Express
        |
        +----------------+
        |                |
        v                v
   PostgreSQL       LLM Gateway
                         |
                  +------+------+
                  |             |
                  v             v
               OpenAI        Claude
