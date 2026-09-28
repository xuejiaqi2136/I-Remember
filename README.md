# 我记着呢

给拖延症用户的温柔备忘录。待办、想法、答应别人的事，还有那些「等会儿再说」的念头，都可以先随手记下。它不催你、不骂你、不给你打分，只在你需要的时候轻轻提醒：这件事还在，我替你记着呢。

你慢慢来，我记着呢。

## 功能

- 快速记下备忘 / 待办（本地 SQLite）
- 定时 / 反复轻提醒（一次、每天、每周）
- 拖延时的动力文案
- 大任务拆成小步骤
- 完成反馈与小成就感
- 「指南」页：高性价比人生指南提问模板（本地检索 + 中转站整理）
- 备忘详情「帮我拆开」：简单列成步骤，并可一键「把建议收成步骤」

## 开始使用（iOS）

```bash
npm install
npm start
```

本机用 Expo Go 扫码打开，或：

```bash
npm run ios
```

真机通知与中转站连通性请在 iPhone 上验证。

## 中转站设置

打开 App → **设置**：

1. **API Base URL**：中转站地址，支持 `https://host` 或 `https://host/v1`
2. **API Key**：你的密钥（存本机 SecureStore，不上云）
3. **模型名**：中转站要求的模型字符串
4. 点 **测试连接** 确认可用

在备忘详情里点 **按指南参谋** 即可。未配置时会温柔引导你来设置。

请求形态为 OpenAI 兼容：

`POST {baseUrl}/v1/chat/completions`

## 书本数据

「按指南参谋」使用离线索引 `assets/hltb/index.json`，由 [HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter)（Unlicense）构建：

```bash
git clone --depth 1 https://github.com/eternity4719/HowToLiveBetter.git /tmp/hltb
npm run build:hltb
```

流程对齐 `life-decision-guide`：先本地查条目，再让模型只基于检出原文回答；查不到就明确说「书里没写」。

## 脚本

```bash
npm test          # URL 规范化与检索单测
npm run typecheck # TypeScript
npm run build:hltb
```

## 技术栈

Expo（React Native）+ TypeScript + expo-router + expo-sqlite + expo-notifications + expo-secure-store
