---
title: "Inducing Sustained Creativity and Diversity in Large Language Models"
url: /quest/
aliases:
  - /publication/inducing-sustained-creativity-and-diversity-in-large-language-models/
date: 2026-03-01
authors:
  - Queenie Luo
  - Gary King
  - Michael Puett
  - Michael D. Smith
publication_types:
  - "article-journal"
abstract: |-
  We address a not-widely-recognized subset of exploratory search, where a researcher choosing a project begins a "search quest" — for qualitative cases, game tree primitives, survey questions, unintended policy consequences, etc. The first few outputs of large language models (LLMs) help but are insufficient, since the quest requires understanding the search space and evaluating diverse and creative possibilities along the way. Although LLMs encode an impressive fraction of the world's knowledge, decoding methods narrowly optimize for prompts with correct answers and thus return mostly common answers to open ended questions and repeat themselves when asked for more. This also poses homogenizing risks to scholarship by giving the same answers to everyone asking similar questions. We develop an easy-to-implement decoding scheme that induces sustained diversity in LLMs, producing as many conceptually distinct results as desired. The algorithm unlocks an LLM's vast knowledge, both orthodox and heterodox, for social science and beyond.
links:
  - type: pdf
    url: "files/Inducing-Sustained-Creativity-LLM.pdf"
  - type: appendix
    url: "files/Inducing-Sustained-Creativity-LLM-supplement.pdf"
    label: Appendix
---

<div class="not-prose" style="overflow-x:auto;width:100%;margin:1rem 0 0;">
<img src="{{< staticrel "files/inducing-sustained-creativity/RD-1.5x.gif" >}}" width="1500" height="300" alt="Animation: ordinary decoding versus recoding decoding (RD)" style="max-width:100%;width:100%;height:auto;display:block;min-height:120px;" loading="lazy" />
</div>
