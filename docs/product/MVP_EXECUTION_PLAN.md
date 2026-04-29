# AlphaQuest MVP 执行拆解与 Codex 多 Agent 并行开发方案 v1.0

## 1. 文档目标

本文档基于 `docs/product/PRD.md`，将 AlphaQuest Web3 增长任务平台拆解为可执行的 MVP 开发计划，包含：

1. MVP 功能优先级清单。
2. 原型页面结构。
3. 技术开发任务列表。
4. Codex 多 Agent 并行开发方案。
5. Sprint 排期、PR 流程和验收标准。

目标是让产品、设计、前端、后端、合约、测试、运营和 Codex 编码 Agent 可以围绕同一个执行蓝图并行推进。

---

## 2. MVP 总体边界

### 2.1 MVP 核心闭环

```text
项目方创建活动
  → 配置任务
  → 用户完成任务
  → 用户获得积分
  → 用户邀请好友
  → 用户使用积分参与奖励池
  → 奖励池链上公平开奖
  → 用户领取奖励
  → 项目方查看数据
  → 项目方复购
```

### 2.2 MVP 不做什么

MVP 不开发：

1. iOS 原生 App。
2. Android 原生 App。
3. 平台币。
4. 积分提现。
5. 积分转让。
6. 积分交易市场。
7. 多级返佣。
8. 充值积分参与随机夺宝。
9. 复杂公会系统。
10. KOL Marketplace。
11. 完整 AI 推荐系统。
12. 完整白标 SaaS。

### 2.3 MVP 推荐产品形态

首发形态：

1. 用户端 Web / H5。
2. 项目方 Dashboard。
3. 平台管理后台。
4. API / Webhook。
5. 链上奖励池合约。

P1 再做：

1. Telegram Mini App。
2. PWA。
3. 项目方 Widget。
4. JS SDK。

---

# Part A：MVP 功能优先级清单

## 3. 优先级定义

| 优先级 | 定义 |
|---|---|
| P0 | MVP 必须完成，没有它核心闭环无法成立 |
| P1 | MVP 后第一阶段增强，提升转化、留存、规模化 |
| P2 | 后续版本功能，不影响 MVP 验证 |
| P3 | 长期战略功能，暂不进入前两个版本 |

---

## 4. P0 功能清单

## 4.1 用户账户系统

| 功能 | 说明 | 验收标准 | 依赖 |
|---|---|---|---|
| 钱包登录 | 用户通过钱包签名登录 | 可连接钱包、签名、创建账户、再次登录 | 前端钱包库、后端 Auth |
| 用户资料 | 展示钱包、昵称、头像、等级、积分 | 用户可查看和编辑基础资料 | 用户表 |
| 邀请码生成 | 每个用户自动生成唯一邀请码 | 新用户注册后生成 referral_code | 用户系统 |
| 社交绑定占位 | 预留 X / Telegram / Discord 绑定状态 | 页面可展示绑定状态 | OAuth / Bot 后续接入 |

验收：

1. 用户首次连接钱包后自动创建账户。
2. 同一钱包重复登录不会重复创建账户。
3. 登录签名包含 nonce、域名、时间戳。
4. 用户中心能展示钱包地址、积分、邀请信息。

---

## 4.2 任务系统

| 功能 | 说明 | 验收标准 | 依赖 |
|---|---|---|---|
| 任务列表 | 用户可查看可参与任务 | 支持按项目、类型、状态筛选 | Campaign / Task 数据 |
| 任务详情 | 展示任务规则和完成按钮 | 用户能按步骤完成任务 | 前端页面 |
| 每日签到任务 | 用户每日签到获得积分 | 每用户每天只能签到一次 | 积分系统 |
| 答题任务 | 用户答题后系统判分 | 达到分数自动发积分 | 题库配置 |
| 链上交易任务 | 用户提交交易哈希，系统验证 | 能验证 chainId、contract、event、txHash | Indexer / RPC |
| 人工审核任务 | 用户提交截图/链接，后台审核 | 审核通过后发积分 | 管理后台 |
| 任务状态机 | available / pending / completed / failed | 状态流转正确且可追踪 | task_submissions |

验收：

1. 至少支持 4 类任务：签到、答题、链上交易、人工审核。
2. 用户完成任务后生成 task_submission。
3. 任务通过后产生积分流水。
4. 同一任务不可重复刷取，除非配置为可重复。

---

## 4.3 积分系统

| 功能 | 说明 | 验收标准 | 依赖 |
|---|---|---|---|
| 积分余额 | 用户可查看 available / pending / locked | 余额准确 | point_transactions |
| 积分流水 | 所有变动生成流水 | 不允许物理删除流水 | 数据库 |
| 积分发放 | 任务完成后发放积分 | 支持 pending 和 available | 任务系统 |
| 积分锁定 | 参与奖励池时锁定或消耗积分 | 活动取消可退回 | 奖励池系统 |
| 积分冲正 | 管理员可冲正异常积分 | 保留原流水和冲正流水 | 管理后台 |

验收：

1. 任何积分变化都有流水。
2. 用户余额由流水汇总或安全快照计算。
3. 参与奖励池后积分状态变化正确。
4. 活动取消后积分可退回。

---

## 4.4 邀请系统

| 功能 | 说明 | 验收标准 | 依赖 |
|---|---|---|---|
| 邀请链接 | 用户可复制邀请链接 | 链接包含邀请码 | 用户系统 |
| 邀请绑定 | 新用户通过链接注册后绑定邀请人 | 一个用户只能绑定一个邀请人 | 注册流程 |
| 邀请统计 | 显示邀请人数、有效人数、奖励 | 数据准确 | referrals 表 |
| 邀请奖励 pending | 被邀请人完成任务后奖励进入 pending | 高风险不立即释放 | 风控系统 |
| 邀请奖励释放 | 满足条件后释放积分 | 生成积分流水 | 积分系统 |

验收：

1. A 邀请 B，B 注册后 referrals 生成记录。
2. B 完成有效任务后，A 获得 pending 奖励。
3. 风控通过或延迟期结束后，A 奖励释放。
4. 同设备或异常邀请可被后台标记无效。

---

## 4.5 项目方系统

| 功能 | 说明 | 验收标准 | 依赖 |
|---|---|---|---|
| 项目方注册 | 项目方创建组织账户 | 可提交项目资料 | Auth |
| 项目资料管理 | 编辑项目名称、Logo、官网、社媒 | 数据可保存和展示 | projects 表 |
| Campaign 创建 | 项目方创建活动 | 支持草稿、提交审核、发布 | campaigns 表 |
| 任务配置 | 项目方为活动添加任务 | 支持任务类型、奖励、规则配置 | tasks 表 |
| 奖励池配置 | 项目方创建奖励池 | 可配置目标积分、奖品、参与规则 | draw_rounds |
| 数据看板 | 查看活动数据 | 展示访问、参与、任务、积分等数据 | Analytics |

验收：

1. 项目方可创建项目。
2. 项目方可创建活动。
3. 项目方可创建任务。
4. 项目方可看到活动参与和任务完成数据。
5. 项目方不能直接发布未审核高风险活动。

---

## 4.6 链上公平奖励池

| 功能 | 说明 | 验收标准 | 依赖 |
|---|---|---|---|
| 奖励池创建 | 项目方创建奖励池 | 后端和合约状态一致 | 合约 |
| 奖池托管 | 项目方将奖品进入合约 | 前端展示合约地址和 txHash | PrizeVault |
| 用户参与 | 用户用积分获得 ticket | 生成 draw_entries 和 ticket 区间 | 积分系统 |
| Merkle Root | 活动封存后生成 root 并上链 | Root 可复算 | Merkle 服务 |
| VRF 风格开奖 | 合约请求随机数 | 返回随机数并计算 winningTicket | VRF / Mock VRF |
| Claim | 中奖用户提交 proof 领取奖励 | 不可重复领取 | 合约 / 前端 |
| 结果展示 | 用户可查看开奖过程 | 展示 root、random、ticket、winner | 前端 |

验收：

1. 奖池必须先托管再开放开奖。
2. 用户参与后 ticket 区间不可在开奖后篡改。
3. 开奖前提交 finalRoot。
4. `winningTicket = randomNumber % totalTickets + 1`。
5. 中奖用户可 claim，非中奖用户不可 claim。

---

## 4.7 风控系统

| 功能 | 说明 | 验收标准 | 依赖 |
|---|---|---|---|
| 基础风险评分 | IP、设备、钱包、邀请关系 | 返回 risk_score | 风控服务 |
| 积分延迟 | 中风险用户积分 pending | 不直接 available | 积分系统 |
| 邀请异常检测 | 同设备、同 IP、批量注册 | 标记异常邀请 | referrals |
| 人工风控处理 | 后台可冻结用户/积分 | 生成操作日志 | 管理后台 |
| 黑名单 | 钱包、IP、设备加入黑名单 | 禁止参与活动 | Auth / Task |

验收：

1. 用户注册时生成基础 risk_score。
2. 高风险用户不能参与奖励池。
3. 中风险任务积分进入 pending。
4. 管理员可以冻结用户或积分。

---

## 4.8 API / Webhook

| 功能 | 说明 | 验收标准 | 依赖 |
|---|---|---|---|
| API Key | 项目方创建 API Key | secret 只展示一次 | Dashboard |
| HMAC 签名 | 写入请求必须签名 | timestamp + nonce 防重放 | API Gateway |
| 查询用户资格 | 项目方查询钱包是否 eligible | 返回任务、积分、风险状态 | 用户 / 任务 |
| 创建任务 API | 项目方通过 API 创建任务 | 权限校验正确 | Task Service |
| 积分发放 API | 项目方发放积分 | 生成积分流水并受限额控制 | Point Service |
| Webhook | 推送 task.completed 等事件 | 支持签名、重试、失败日志 | Queue |

验收：

1. API 请求必须带 key 和签名。
2. 非授权项目方不能操作其他项目数据。
3. Webhook 失败后自动重试。
4. 所有 API 写入有审计日志。

---

## 4.9 管理后台

| 功能 | 说明 | 验收标准 |
|---|---|---|
| 项目审核 | 审核项目方资料 | 支持通过/拒绝/暂停 |
| 活动审核 | 审核 Campaign | 审核后才能发布 |
| 任务审核 | 审核任务配置 | 防钓鱼、防违规 |
| 用户管理 | 查看用户和积分 | 可冻结、解封、冲正 |
| 风控中心 | 查看高风险用户和邀请 | 支持处理 |
| 奖励池监控 | 查看链上状态 | 异常告警 |
| 运营位配置 | 首页推荐、热门任务 | 可配置权重 |

---

## 5. P1 功能清单

| 模块 | 功能 | 价值 |
|---|---|---|
| Telegram Mini App | TG 内完成任务、邀请、提醒 | 增强币圈用户裂变 |
| PWA | 添加到桌面、推送提醒 | 替代早期原生 App |
| 项目方 Widget | 项目官网嵌入任务组件 | 提高 B 端接入效率 |
| JS SDK | 项目方前端快速集成 | 提升开发者体验 |
| 用户等级 | 等级、徽章、经验值 | 提升留存 |
| 排行榜 | 积分榜、邀请榜、任务榜 | 提升竞争和传播 |
| 内容任务审核 | AI 初审 + 人工复审 | 扩展高价值任务 |
| 高级风控 | 钱包聚类、社交质量评分 | 降低刷子成本 |
| 数据报告 | 项目方 ROI 报告 | 提升复购 |
| 白名单抽签 | 项目方抽取白名单资格 | 增强 Web3 项目适配 |

---

## 6. P2 功能清单

| 模块 | 功能 | 价值 |
|---|---|---|
| iOS / Android App | 原生客户端 | 用户规模大后提升留存 |
| AI 任务推荐 | 个性化推荐任务 | 提升任务完成率 |
| KOL Marketplace | 项目方发布 KOL 推广任务 | 扩大商业化 |
| 公会系统 | 用户组队完成任务 | 社区裂变 |
| 白标 SaaS | 独立任务中心 | 大客户收入 |
| 多链扩展 | EVM + Solana 等 | 扩大任务类型 |
| 声誉 Passport | 用户链上/任务声誉 | 长期护城河 |
| 赛季系统 | Season 积分和奖励 | 提升长期留存 |

---

# Part B：原型页面结构

## 7. 页面信息架构总览

```text
AlphaQuest
│
├── 用户端 Web / H5
│   ├── 首页
│   ├── 登录 / 钱包连接
│   ├── 任务中心
│   ├── 任务详情
│   ├── 项目详情
│   ├── Campaign 详情
│   ├── 奖励池详情
│   ├── 开奖结果页
│   ├── 积分中心
│   ├── 邀请中心
│   ├── 用户中心
│   └── 设置
│
├── 项目方 Dashboard
│   ├── 项目方登录
│   ├── 项目列表
│   ├── 项目设置
│   ├── 活动列表
│   ├── 创建活动
│   ├── 活动详情
│   ├── 任务配置
│   ├── 奖励池配置
│   ├── 数据看板
│   ├── API Key 管理
│   ├── Webhook 配置
│   └── 账单
│
├── 管理后台 Admin
│   ├── 数据总览
│   ├── 项目审核
│   ├── 活动审核
│   ├── 任务审核
│   ├── 用户管理
│   ├── 风控中心
│   ├── 积分流水
│   ├── 奖励池监控
│   ├── 运营位管理
│   └── 系统配置
│
└── 开发者中心
    ├── API 文档
    ├── API Key
    ├── Webhook Logs
    ├── SDK 下载
    └── 示例代码
```

---

## 8. 用户端页面结构

### 8.1 首页

页面目标：让用户快速看到今日可做任务、热门项目、奖励池、积分和邀请入口。

模块：

1. 顶部导航：Logo、任务中心、奖励池、项目、排行榜、钱包连接按钮。
2. 用户状态卡片：钱包地址、AP 余额、签到状态、用户等级。
3. 今日签到卡片：连续签到天数、今日奖励、签到按钮。
4. 热门任务区域：任务卡片、奖励积分、任务类型、截止时间、参与人数。
5. 即将开奖区域：奖池金额、目标进度、开奖状态。
6. 新项目区域：项目 Logo、赛道、活动数量、风险标签。
7. 邀请卡片：邀请链接、已邀请人数、可获得奖励。

关键交互：未登录用户点击任务弹出钱包连接；已登录用户点击签到生成积分流水；点击奖励池进入详情；点击邀请复制链接。

### 8.2 登录 / 钱包连接页

模块：产品价值说明、支持钱包列表、签名登录提示、风险提示、邀请码识别提示。

关键交互：选择钱包、签名、后端验证、创建或登录账户、跳回原页面。

### 8.3 任务中心

模块：搜索、分类筛选、状态筛选、排序、任务卡片列表。

任务卡片字段：项目 Logo、任务标题、任务类型、奖励 AP、预计耗时、参与人数、状态、CTA。

### 8.4 任务详情页

模块：任务标题、项目方信息、奖励积分、任务说明、完成步骤、验证方式、风险提示、提交区、审核状态、相关任务推荐。

不同任务提交组件：签到一键完成；答题题目组件；链上任务 txHash 输入框 + 自动检测；人工审核链接输入 + 图片上传；邀请任务邀请链接 + 进度条。

### 8.5 项目详情页

模块：项目头图、Logo 和名称、认证状态、风险标签、官网 / X / Telegram / Discord 链接、项目介绍、当前 Campaign、任务列表、历史活动、用户参与记录。

### 8.6 Campaign 详情页

模块：Campaign 标题、所属项目、活动时间、活动规则、活动任务列表、总奖励预算、参与人数、我的完成进度、奖励池入口、邀请入口。

### 8.7 奖励池详情页

页面目标：让用户清楚知道奖池是否真实、规则是否透明、开奖是否公平。

模块：奖励池标题、项目方信息、奖品展示、奖池合约地址、奖池托管交易哈希、目标积分进度、totalTickets、参与人数、我的 AP 余额、参与输入框、我的 ticket 区间、活动规则、免费参与说明、链上验证信息、开奖条件。

参与弹窗：输入 AP 数量、展示 ticket 数、规则确认、确认参与、成功后展示 ticket 区间。

### 8.8 开奖结果页

模块：活动名称、奖励池状态、final Merkle Root、VRF requestId、randomNumber、totalTickets、winningTicket、中奖用户、Claim 状态、验证教程、区块浏览器链接。

### 8.9 积分中心

模块：可用 AP、Pending AP、Locked AP、总获得 AP、积分流水列表、筛选、积分规则说明。

### 8.10 邀请中心

模块：邀请码、邀请链接、邀请海报、总邀请人数、有效邀请人数、Pending 奖励、Available 奖励、邀请记录、邀请规则说明。

### 8.11 用户中心

模块：钱包地址、用户等级、积分余额、完成任务数、参与活动数、中奖记录、邀请记录、社交绑定状态、风险状态提示、设置入口。

---

## 9. 项目方 Dashboard 页面结构

### 9.1 项目列表页

模块：我的项目列表、创建项目按钮、项目认证状态、活动数量、本月参与用户、本月任务完成量。

### 9.2 项目设置页

模块：基础资料、Logo 上传、官网和社媒链接、项目描述、团队成员、权限角色、项目认证资料。

### 9.3 活动列表页

模块：Campaign 列表、状态筛选、创建活动按钮、活动参与人数、任务完成数、积分发放数、活动预算。

### 9.4 创建活动页

采用 Stepper：

1. 基础信息：标题、描述、时间、地区限制、风险等级。
2. 选择模板：冷启动、社区增长、链上交互、白名单、公平奖励池。
3. 配置任务：添加任务、奖励、验证方式、完成上限。
4. 配置奖励：积分预算、奖励池、白名单、NFT。
5. 预览与提交审核：用户端预览、规则确认、提交审核。

### 9.5 任务配置页

模块：任务列表、添加任务弹窗、任务类型选择、奖励设置、验证条件设置、任务排序、启用 / 禁用。

### 9.6 奖励池配置页

模块：奖励池类型、奖品类型、奖品数量、目标积分、单用户上限、免费参与入口配置、合约托管状态、提交审核。

### 9.7 数据看板

模块：总览指标、用户增长趋势、任务完成漏斗、钱包连接数、链上任务完成数、邀请增长、风险用户比例、成本 / 有效用户、用户列表、导出按钮。

### 9.8 API Key 管理页

模块：API Key 列表、创建 Key、权限范围、调用限制、最近使用时间、禁用 / 删除、API 文档入口。

### 9.9 Webhook 配置页

模块：Webhook URL、订阅事件、Secret、测试发送、最近请求日志、失败重试记录。

---

## 10. 管理后台页面结构

### 10.1 数据总览

模块：注册用户、活跃用户、项目方数量、Campaign 数、任务完成数、积分发行量、奖励池数量、风险用户数、平台收入。

### 10.2 项目审核

模块：待审核项目列表、项目资料详情、风险检查、审核操作、审核日志。

### 10.3 活动审核

模块：待审核 Campaign、活动规则、任务列表、奖励配置、合规风险提示、通过 / 拒绝 / 要求修改。

### 10.4 用户管理

模块：用户搜索、钱包地址、积分余额、风控分、任务记录、邀请关系、冻结 / 解冻、积分冲正。

### 10.5 风控中心

模块：高风险用户列表、异常邀请关系、同设备多账号、同 IP 批量账号、积分异常、人工处理队列、风控规则配置。

### 10.6 奖励池监控

模块：奖励池列表、合约状态、奖池托管状态、Merkle Root 状态、VRF 状态、Claim 状态、异常告警。

---

# Part C：技术开发任务列表

## 11. 推荐代码仓库结构

建议采用 monorepo：

```text
alphaquest/
│
├── apps/
│   ├── web/                  # 用户端 Web / H5
│   ├── dashboard/            # 项目方 Dashboard
│   ├── admin/                # 管理后台
│   └── api/                  # 后端 API 服务
│
├── packages/
│   ├── ui/                   # 共享 UI 组件
│   ├── config/               # eslint/tsconfig/tailwind 配置
│   ├── sdk/                  # JS SDK，P1
│   ├── types/                # 共享类型
│   └── utils/                # 通用工具
│
├── contracts/
│   ├── src/                  # Solidity 合约
│   ├── test/                 # Foundry 测试
│   ├── script/               # 部署脚本
│   └── deployments/          # 部署记录
│
├── services/
│   ├── indexer/              # 链上事件监听服务
│   ├── worker/               # 异步任务队列
│   └── risk-engine/          # 风控服务，可先合并到 api
│
├── docs/
│   ├── api/                  # API 文档
│   ├── product/              # PRD 和原型说明
│   └── runbooks/             # 运维手册
│
├── AGENTS.md                 # Codex Agent 项目指令
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 12. 后端开发任务

### 12.1 Auth Service

任务：

1. 实现钱包 nonce 生成接口。
2. 实现钱包签名验证接口。
3. 实现 JWT access token / refresh token。
4. 实现用户自动创建。
5. 实现邀请码识别和绑定。
6. 实现登录审计日志。

API：

```http
GET /auth/nonce?wallet=0x...
POST /auth/wallet-login
POST /auth/refresh
POST /auth/logout
```

验收：nonce 使用后失效；同一钱包只对应一个用户；邀请关系只在首次注册时绑定。

### 12.2 User Service

任务：用户资料 CRUD、积分概览、任务统计、邀请统计、等级字段预留、社交绑定状态字段预留。

API：

```http
GET /me
PATCH /me
GET /me/stats
GET /users/:wallet/profile
```

### 12.3 Project Service

任务：项目方创建项目、项目资料编辑、项目审核状态、项目成员和角色、项目公开详情页数据。

API：

```http
POST /projects
GET /projects
GET /projects/:id
PATCH /projects/:id
POST /projects/:id/submit-review
```

### 12.4 Campaign Service

任务：Campaign 创建、草稿保存、提交审核、发布、状态机、用户端列表、项目方数据。

API：

```http
POST /campaigns
GET /campaigns
GET /campaigns/:id
PATCH /campaigns/:id
POST /campaigns/:id/submit-review
POST /campaigns/:id/publish
POST /campaigns/:id/pause
```

### 12.5 Task Service

任务：任务创建、列表和详情、任务提交、签到任务、答题判分、链上任务 txHash 校验、人工审核、状态机、防重复领取。

API：

```http
POST /tasks
GET /tasks
GET /tasks/:id
PATCH /tasks/:id
POST /tasks/:id/submit
POST /tasks/:id/verify
POST /tasks/:id/review
```

### 12.6 Point Ledger Service

任务：积分账户、积分流水、发放、锁定、解锁、消耗、冲正、并发安全、余额快照。

API：

```http
GET /points/balance
GET /points/transactions
POST /points/grant
POST /points/lock
POST /points/unlock
POST /points/spend
POST /points/reverse
```

技术要求：积分操作必须使用数据库事务；并发参与奖励池不得超扣；所有积分变动必须有 source_type 和 source_id；不允许直接修改余额而不记录流水。

### 12.7 Referral Service

任务：邀请关系创建、邀请统计、邀请奖励 pending、邀请奖励释放、异常邀请标记、邀请排行榜 P1。

API：

```http
GET /referrals/me
GET /referrals/me/stats
POST /referrals/release
POST /referrals/:id/flag
```

### 12.8 Draw Service

任务：奖励池创建、用户参与、ticket 区间分配、活动进度计算、活动封存、Merkle Tree 生成、Merkle Root 上链调用、VRF 请求调用、中奖结果同步、Claim proof 生成。

API：

```http
POST /draws
GET /draws
GET /draws/:id
POST /draws/:id/join
POST /draws/:id/seal
POST /draws/:id/request-randomness
GET /draws/:id/result
GET /draws/:id/proof
```

### 12.9 Risk Engine

任务：注册风险评分、任务提交风险评分、邀请关系风险评分、奖励池参与风险检查、黑名单检查、管理员风控处理。

API：

```http
POST /risk/evaluate-user
POST /risk/evaluate-task-submission
POST /risk/evaluate-referral
POST /risk/evaluate-draw-entry
GET /risk/users
POST /risk/users/:id/freeze
```

### 12.10 API Platform Service

任务：API Key 创建、权限模型、HMAC 签名验证中间件、Rate limit、审计日志、Webhook 订阅、Webhook 发送队列、重试机制、日志查询。

---

## 13. 前端开发任务

### 13.1 Web 用户端

任务包：搭建 Next.js 应用、钱包连接和登录流程、首页、任务中心、任务详情、项目详情、Campaign 详情、奖励池详情、开奖结果页、积分中心、邀请中心、用户中心、通用 Toast / Modal / Loading / Error、移动端适配。

关键组件：WalletConnectButton、PointsBalanceCard、TaskCard、CampaignCard、DrawPoolCard、TicketRangeDisplay、ProgressBar、ReferralInviteCard、TransactionStatus、RiskWarning。

### 13.2 项目方 Dashboard

任务包：Dashboard 布局和权限、项目列表、项目设置、活动列表、创建活动 Stepper、任务配置表单、奖励池配置表单、数据看板、API Key 管理、Webhook 配置、账单页占位。

关键组件：CampaignWizard、TaskConfigForm、RewardConfigForm、DrawConfigForm、AnalyticsCards、FunnelChart、ApiKeyTable、WebhookLogTable。

### 13.3 Admin 管理后台

任务包：Admin 登录和角色权限、数据总览、项目审核、活动审核、任务审核、用户管理、风控中心、积分流水、奖励池监控、运营位管理。

关键组件：ReviewQueue、RiskUserTable、PointTransactionTable、DrawMonitorTable、AdminActionModal、AuditLogDrawer。

---

## 14. 合约开发任务

### 14.1 合约模块

#### PrizeVault.sol

职责：托管奖励资产。

函数：depositERC20Prize、depositNFTPrize、lockPrizeForRound、releasePrizeToWinner、refundPrizeToSponsor、pause、unpause。

#### DrawRoundManager.sol

职责：管理奖励池状态和开奖。

函数：createRound、commitBatchRoot、sealRound、requestRandomness、fulfillRandomWords、finalizeRound、claimPrize、cancelRound。

#### MerkleEntryVerifier.sol

职责：验证用户 ticket 区间。

函数：verifyEntry、verifyWinningEntry。

#### AccessControl 配置

角色：DEFAULT_ADMIN_ROLE、OPERATOR_ROLE、PAUSER_ROLE、ROUND_CREATOR_ROLE、TREASURY_ROLE。

### 14.2 合约测试任务

1. 创建奖励池测试。
2. 奖品托管测试。
3. 提交 batchRoot 测试。
4. 提交 finalRoot 测试。
5. VRF mock 测试。
6. winningTicket 计算测试。
7. claim 成功测试。
8. 非中奖 claim 失败测试。
9. 重复 claim 失败测试。
10. pause 后关键操作失败测试。
11. 权限控制测试。
12. 活动取消和退款测试。

---

## 15. Indexer / Worker 开发任务

### 15.1 Indexer

任务：监听 PrizeDeposited、BatchCommitted、RoundSealed、RandomnessRequested、RoundFinalized、PrizeClaimed；同步链上状态到数据库；异常重试和区块回滚处理。

### 15.2 Worker

任务：任务审核异步队列、链上交易验证队列、Merkle Tree 生成队列、Webhook 发送队列、邀请奖励释放队列、风控评分队列、积分 pending 转 available 队列。

---

## 16. 测试任务

### 16.1 单元测试

Auth 签名验证、积分流水、任务状态机、邀请奖励、奖励池 ticket 分配、Merkle proof、HMAC 签名、风控评分。

### 16.2 集成测试

用户完成任务获得积分、用户邀请好友获得奖励、用户参与奖励池、奖励池封存和开奖、中奖用户 claim、项目方创建活动并查看数据、Webhook 推送。

### 16.3 E2E 测试

C 端完整路径、B 端完整路径、Admin 审核路径、链上开奖路径。

### 16.4 安全测试

API 重放攻击、积分并发超扣、越权访问、Webhook 伪造、合约重复领取、合约权限滥用。

---

## 17. DevOps / Infra 任务

1. 初始化 monorepo。
2. 配置 CI。
3. 配置 lint、typecheck、test。
4. 配置数据库迁移。
5. 配置测试环境。
6. 配置 staging 环境。
7. 配置生产环境。
8. 配置日志和监控。
9. 配置错误追踪。
10. 配置 secrets 管理。
11. 配置合约部署脚本。
12. 配置回滚流程。

---

# Part D：Codex 多 Agent 并行开发方案

## 18. Codex 使用原则

Codex 适合被拆成多个独立任务并行执行。每个任务应做到：

1. 输入清晰。
2. 范围有限。
3. 有明确验收标准。
4. 有测试要求。
5. 尽量不跨越太多模块。
6. 输出为可 review 的 Pull Request。

核心原则：

```text
一个 Agent = 一个清晰任务包 = 一个分支 = 一个 PR = 一组测试结果
```

---

## 19. Codex 项目准备

### 19.1 仓库初始化

先由人工或 Lead Agent 完成：

1. 创建 GitHub 仓库。
2. 初始化 monorepo。
3. 配置 pnpm workspace。
4. 配置 apps/web、apps/dashboard、apps/admin、apps/api、contracts。
5. 配置数据库 schema 初版。
6. 配置 README。
7. 配置 AGENTS.md。
8. 配置 CI。

### 19.2 AGENTS.md 建议内容

```md
# AlphaQuest Agent Instructions

## Product Context
AlphaQuest is a Web3 growth quest platform with user tasks, points, referrals, project dashboards, and on-chain fair reward pools.

## Tech Stack
- Monorepo: pnpm workspace
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: NestJS or Node.js TypeScript
- Database: PostgreSQL
- Cache/Queue: Redis + BullMQ
- Contracts: Solidity + Foundry + OpenZeppelin
- Web3: viem / wagmi

## Rules
- Keep changes small and reviewable.
- Add or update tests for every feature.
- Do not hardcode secrets.
- Do not bypass authorization checks.
- Do not mutate point balances without point_transactions.
- Any point change must be auditable.
- Any API write action must have permission checks.
- Any contract change must include Foundry tests.
- Do not implement platform token issuance, point withdrawal, point trading, multi-level referral commissions, or paid-credit random draws.

## Commands
- Install: pnpm install
- Typecheck: pnpm typecheck
- Lint: pnpm lint
- Test: pnpm test
- API test: pnpm --filter api test
- Web test: pnpm --filter web test
- Contract test: cd contracts && forge test
```

---

## 20. 多 Agent 角色设计

建议设置 11 个 Codex Agent 任务线。

| Agent | 角色 | 主要任务 | 并行性 |
|---|---|---|---|
| Agent 0 | Tech Lead / 架构协调 | 初始化仓库、规范、CI、接口契约 | 第一优先启动 |
| Agent 1 | 用户端前端 | Web/H5 用户端页面 | 可并行 |
| Agent 2 | 项目方 Dashboard 前端 | B 端后台页面 | 可并行 |
| Agent 3 | Admin 前端 | 管理后台页面 | 可并行 |
| Agent 4 | Auth/User 后端 | 登录、用户、邀请码 | 可并行 |
| Agent 5 | Task/Point 后端 | 任务系统、积分账本 | 依赖基础 schema |
| Agent 6 | Campaign/Project 后端 | 项目方、活动、数据 | 可并行 |
| Agent 7 | Referral/Risk 后端 | 邀请、风控 | 可并行 |
| Agent 8 | Draw/Worker 后端 | 奖励池、Merkle、队列 | 依赖积分和合约接口 |
| Agent 9 | Smart Contract | PrizeVault、DrawManager、测试 | 可并行 |
| Agent 10 | API/Webhook/SDK | API Key、HMAC、Webhook | 可并行 |
| Agent 11 | QA / E2E | 测试用例、E2E、验收脚本 | 后期并行 |

---

## 21. 并行开发批次

### 21.1 Batch 0：基础设施，必须最先完成

Agent 0：架构初始化。

任务：初始化 monorepo、创建基础 app、配置 TypeScript / ESLint / Prettier / Tailwind、配置数据库 ORM、配置基础 CI、创建 AGENTS.md、定义共享类型、定义 API response 格式。

验收：pnpm install、pnpm lint、pnpm typecheck 成功；apps 可启动；CI 可运行。

### 21.2 Batch 1：可完全并行开发

1. Agent 1：用户端 UI 骨架。
2. Agent 2：项目方 Dashboard UI 骨架。
3. Agent 3：Admin UI 骨架。
4. Agent 4：Auth/User 后端。
5. Agent 6：Project/Campaign 后端。
6. Agent 9：合约开发第一版。

### 21.3 Batch 2：依赖 Batch 1 的核心业务

1. Agent 5：Task/Point 后端。
2. Agent 7：Referral/Risk 后端。
3. Agent 10：API Key / Webhook。

### 21.4 Batch 3：奖励池完整闭环

1. Agent 8：Draw/Worker 后端。
2. Agent 1：用户端真实接口接入。
3. Agent 2：Dashboard 真实接口接入。
4. Agent 3：Admin 真实接口接入。

### 21.5 Batch 4：测试、联调、上线

Agent 11：QA / E2E。

任务：编写 E2E 测试、种子数据、本地演示脚本、staging smoke test、完整业务闭环验证、上线 checklist。

---

## 22. Codex 并行开发工作流

每个 Agent 的标准工作流：

```text
读取 AGENTS.md
  → 读取 docs/product/PRD.md 和 docs/product/MVP_EXECUTION_PLAN.md
  → 创建独立分支
  → 实现功能
  → 添加测试
  → 运行 lint/typecheck/test
  → 生成 PR
  → 人工 Review
  → Codex 修复 Review 意见
  → 合并
```

分支命名：

```text
feat/auth-wallet-login
feat/web-user-ui-skeleton
feat/dashboard-campaign-wizard
feat/contracts-draw-manager
feat/api-point-ledger
feat/draw-service
feat/webhook-platform
```

PR 模板：

```md
## Summary

## Scope

## Changed Files

## Screenshots

## Tests Run

## Security Considerations

## Known Limitations

## Checklist
- [ ] Lint passed
- [ ] Typecheck passed
- [ ] Tests passed
- [ ] No secrets committed
- [ ] Authorization checked
- [ ] Audit logs added where needed
```

---

## 23. Agent 任务依赖图

```text
Agent 0 架构初始化
    ↓
    ├── Agent 1 用户端 UI
    ├── Agent 2 Dashboard UI
    ├── Agent 3 Admin UI
    ├── Agent 4 Auth/User
    ├── Agent 6 Project/Campaign
    └── Agent 9 Contracts

Agent 4 + Agent 6
    ↓
Agent 5 Task/Point
    ↓
Agent 7 Referral/Risk
    ↓
Agent 8 Draw Service

Agent 6
    ↓
Agent 10 API/Webhook

Agent 1 + Agent 2 + Agent 3 + Agent 5 + Agent 8 + Agent 9
    ↓
Agent 11 QA/E2E
```

---

## 24. 建议开发里程碑

### Sprint 0：项目初始化，1 周

目标：仓库、架构、规范、CI。

交付：Monorepo、AGENTS.md、基础 app、数据库连接、CI、合约工程。

### Sprint 1：基础 UI + Auth + Project，2 周

目标：基础页面和基础后端。

交付：用户端静态 UI、Dashboard 静态 UI、Admin 静态 UI、钱包登录、用户资料、项目和 Campaign 后端、合约第一版。

### Sprint 2：Task + Point + Referral，2 周

目标：任务和积分闭环。

交付：任务创建、任务提交、签到、答题、人工审核、积分账本、邀请关系、基础风控。

### Sprint 3：Draw + Contract Integration，2 周

目标：奖励池闭环。

交付：用户参与奖励池、ticket 区间、Merkle Tree、合约封存、VRF mock、Claim、结果页。

### Sprint 4：API/Webhook + Analytics，2 周

目标：项目方接入和数据复盘。

交付：API Key、HMAC、Webhook、数据看板、API 文档、Admin 审核联动。

### Sprint 5：测试、安全、Beta，上线前 2 周

目标：可上线。

交付：E2E、压测、安全检查、合约审计准备、Beta 项目接入、上线 checklist。

---

## 25. MVP 最小上线验收清单

### 25.1 用户端

1. 用户可以连接钱包。
2. 用户可以完成签到。
3. 用户可以完成任务。
4. 用户可以查看积分。
5. 用户可以邀请好友。
6. 用户可以参与奖励池。
7. 用户可以查看 ticket。
8. 用户可以查看开奖结果。
9. 中奖用户可以领取奖励。

### 25.2 项目方

1. 项目方可以创建项目。
2. 项目方可以创建活动。
3. 项目方可以配置任务。
4. 项目方可以配置奖励池。
5. 项目方可以查看数据。
6. 项目方可以创建 API Key。
7. 项目方可以配置 Webhook。

### 25.3 管理后台

1. 管理员可以审核项目。
2. 管理员可以审核活动。
3. 管理员可以审核任务。
4. 管理员可以冻结用户。
5. 管理员可以冲正积分。
6. 管理员可以查看奖励池状态。

### 25.4 后端

1. 所有写操作有权限校验。
2. 积分操作事务安全。
3. API 有审计日志。
4. Webhook 有重试。
5. 风控能阻断高风险用户。
6. 数据库迁移可重复执行。

### 25.5 合约

1. 奖池可托管。
2. Round 可创建。
3. Merkle Root 可提交。
4. 随机数可返回。
5. winningTicket 可计算。
6. 用户可 claim。
7. 不可重复 claim。
8. 权限和暂停有效。

---

## 26. 建议立即创建的 Codex 任务队列

### 第一批任务，马上启动

1. Agent 0：初始化 monorepo、CI、AGENTS.md。
2. Agent 1：用户端 Web UI 骨架。
3. Agent 2：项目方 Dashboard UI 骨架。
4. Agent 3：Admin UI 骨架。
5. Agent 4：Auth/User 后端。
6. Agent 6：Project/Campaign 后端。
7. Agent 9：合约 MVP。

### 第二批任务，第一批有基础后启动

1. Agent 5：Task/Point 后端。
2. Agent 7：Referral/Risk 后端。
3. Agent 10：API/Webhook。

### 第三批任务，业务模型稳定后启动

1. Agent 8：Draw Service。
2. Agent 1：用户端真实接口接入。
3. Agent 2：Dashboard 真实接口接入。
4. Agent 3：Admin 真实接口接入。

### 第四批任务，上线前启动

1. Agent 11：E2E 和 QA。
2. Agent 9：合约测试补全和审计准备。
3. Agent 0：CI/CD、部署、监控。

---

## 27. 给 Codex 的总控 Prompt

```text
We are building AlphaQuest, a Web3 growth quest platform.

Before coding, read:
- docs/product/PRD.md
- docs/product/MVP_EXECUTION_PLAN.md
- AGENTS.md if it exists

The MVP must support:
- wallet login
- user profiles
- project owner dashboard
- campaign and task creation
- user task completion
- auditable point ledger
- referrals
- basic risk engine
- on-chain fair reward pools with Merkle root and VRF-style randomness
- admin review panel
- API keys, HMAC signatures, and webhooks

Use the repository AGENTS.md as the source of project conventions.
Keep your task small and focused.
Create tests for your changes.
Run lint, typecheck, and relevant tests.
Do not implement out-of-scope features like token issuance, point withdrawal, point trading, multi-level referral commissions, or paid-credit random draws.
Return a concise PR summary with tests run and known limitations.
```

---

## 28. 第一批 Codex Agent Prompt

### Agent 0：初始化 AlphaQuest Web3 monorepo

```text
You are the Tech Lead Agent for AlphaQuest.

Read and follow:
- docs/product/PRD.md
- docs/product/MVP_EXECUTION_PLAN.md

Initialize a production-ready Web3 monorepo with:
- apps/web
- apps/dashboard
- apps/admin
- apps/api
- packages/ui
- packages/config
- packages/types
- packages/utils
- contracts/src
- contracts/test
- services/indexer
- services/worker
- services/risk-engine
- docs/api
- docs/contracts
- docs/runbooks

Use pnpm workspace, TypeScript, Next.js, Tailwind, Node/NestJS-style API structure, Solidity, Foundry, and OpenZeppelin.

Create AGENTS.md with project rules:
- Keep changes small and reviewable.
- Add tests for every feature.
- Do not hardcode secrets.
- Do not bypass authorization checks.
- Do not mutate point balances without point_transactions.
- Any point change must be auditable.
- Any API write action must have permission checks.
- Any contract change must include Foundry tests.
- Do not implement token issuance, point withdrawal, point trading, multi-level referral commissions, or paid-credit random draws.

Return summary, commands, assumptions, and next tasks.
```

### Agent 1：用户端 Web/H5 UI 骨架

```text
You are Agent 1 working on apps/web.
Build the user-facing Web/H5 UI skeleton using Next.js, TypeScript and Tailwind.
Implement routes: /, /tasks, /tasks/[id], /projects/[id], /campaigns/[id], /draws/[id], /draws/[id]/result, /points, /referrals, /me, /settings.
Use mock data only. Do not call real APIs yet.
Create reusable components: WalletConnectButton, PointsBalanceCard, TaskCard, CampaignCard, DrawPoolCard, TicketRangeDisplay, ReferralInviteCard, ProgressBar, RiskWarning, TransactionStatus.
Ensure mobile-first responsive layout.
Run lint and typecheck.
```

### Agent 2：项目方 Dashboard UI 骨架

```text
You are Agent 2 working on apps/dashboard.
Build the project owner dashboard UI skeleton with mock data.
Implement routes: /dashboard, /dashboard/projects, /dashboard/projects/new, /dashboard/projects/[id]/settings, /dashboard/campaigns, /dashboard/campaigns/new, /dashboard/campaigns/[id], /dashboard/campaigns/[id]/tasks, /dashboard/campaigns/[id]/draw, /dashboard/campaigns/[id]/analytics, /dashboard/api-keys, /dashboard/webhooks, /dashboard/billing.
Create reusable components: CampaignWizard, TaskConfigForm, DrawConfigForm, AnalyticsCards, ApiKeyTable, WebhookLogTable.
Run lint and typecheck.
```

### Agent 3：Admin UI 骨架

```text
You are Agent 3 working on apps/admin.
Build the admin panel UI skeleton with mock data.
Implement routes: /admin, /admin/projects/review, /admin/campaigns/review, /admin/tasks/review, /admin/users, /admin/risk, /admin/points, /admin/draws, /admin/cms, /admin/settings.
Create tables, filters, review action modals, and audit log drawer components.
Run lint and typecheck.
```

### Agent 4：Auth/User 后端

```text
You are Agent 4 working on apps/api.
Implement wallet authentication and user profile services.
Add models for users and wallet_nonces.
Implement endpoints: GET /auth/nonce, POST /auth/wallet-login, POST /auth/refresh, GET /me, PATCH /me.
Wallet login must verify a signed message containing wallet, domain, nonce and timestamp.
Generate a unique referral_code for every new user.
If an invite code is provided during first login, bind inviter_id once.
Add unit tests for nonce invalidation, duplicate wallet prevention, and referral binding.
```

### Agent 6：Project/Campaign 后端

```text
You are Agent 6 working on apps/api.
Implement Project and Campaign services.
Add database models for projects, project_members, campaigns, and campaign_status_history.
Implement project owner permissions.
Implement endpoints for creating, updating, submitting for review, publishing and pausing campaigns.
Campaign status transitions must be validated.
Add tests for authorization and invalid status transitions.
```

### Agent 9：合约 MVP

```text
You are Agent 9 working in contracts/.
Implement MVP smart contracts for AlphaQuest reward pools.
Contracts: PrizeVault, DrawRoundManager, MerkleEntryVerifier.
Use Solidity, Foundry, OpenZeppelin AccessControl, Pausable, ReentrancyGuard, IERC20, and MerkleProof.
Support ERC20 prize deposits, round creation, final merkle root sealing, mocked randomness fulfillment, winningTicket calculation, and claim with Merkle proof.
Add Foundry tests for deposit, seal, randomness, claim success, claim failure, duplicate claim, pause, and access control.
Run forge test.
```

---

## 29. 结论

AlphaQuest MVP 的开发重点不是一次性做完所有功能，而是用 Codex 多 Agent 并行方式快速打通以下闭环：

```text
Auth/User
  + Project/Campaign
  + Task/Point
  + Referral/Risk
  + Draw/Contract
  + Web/Dashboard/Admin
  + API/Webhook
  + QA/E2E
```

最推荐的执行方式：

1. 先由 Agent 0 完成工程架构和 AGENTS.md。
2. UI 三条线、后端两条线、合约一条线并行。
3. 第二批再接入任务、积分、邀请、风控。
4. 第三批完成奖励池和链上开奖。
5. 最后一批做 E2E、安全、部署和 Beta 上线。

这样可以把原本串行 12-16 周的工作，压缩成更高并行度的 8-12 周 MVP 开发周期。前提是任务边界清晰、接口契约稳定、人工 Review 严格。

---

## 12. 面向本次需求的分模块交付清单（用户端 Web/H5 UI、项目方 Dashboard UI、Admin UI、后端与合约 MVP）

> 本节用于把你提出的 6 个大模块直接映射到可并行开发的工程任务，默认对应 P0 MVP。

### 12.1 用户端 Web/H5 UI

1. 认证与账户
   - 钱包连接（EVM）
   - SIWE 签名登录
   - 登录态持久化与退出
2. 任务中心
   - 任务列表（可用 / 进行中 / 已完成）
   - 任务详情（规则、奖励、状态）
   - 签到、答题、链上交易、人工审核提交入口
3. 积分与邀请
   - 积分余额卡片（available / pending / locked）
   - 积分流水列表
   - 邀请链接与邀请统计
4. 奖励池
   - 奖池列表与详情
   - 参与记录与 ticket 展示
   - 开奖结果与 claim 入口
5. 风控反馈
   - pending 原因提示
   - 高风险用户限制提示

验收基线：
- 新用户 5 分钟内可完成“登录→签到→查看积分→复制邀请链接”。
- 任务完成后 UI 能展示明确状态变更和到账类型（pending/available）。

### 12.2 项目方 Dashboard UI

1. 项目管理
   - 项目资料编辑（名称、Logo、官网、社媒）
2. Campaign 管理
   - 新建 / 编辑 / 草稿 / 提交审核 / 发布
3. 任务配置器
   - 4 类任务配置：签到、答题、链上交易、人工审核
4. 奖励池管理
   - 奖励池创建、奖品参数、开放/封存状态
5. 数据看板
   - 参与人数、任务完成率、积分发放、转化漏斗
6. 开放平台
   - API Key 管理（secret 一次展示）
   - Webhook 配置（URL、签名状态、重试状态）

验收基线：
- 项目方可独立完成“创建活动→配置任务→提交审核→查看基础数据”。

### 12.3 Admin UI

1. 审核中心
   - 项目审核
   - Campaign 审核
   - 任务审核
2. 风控中心
   - 高风险账户列表
   - 冻结/解封操作
   - 异常邀请处理
3. 用户与积分
   - 用户检索、积分流水查询
   - 冲正操作（自动生成反向流水）
4. 奖励池监控
   - root、随机数、winner、claim 状态可视化
5. 运维与审计
   - 管理员操作日志
   - webhook 失败重试与告警列表

验收基线：
- 任意管理写操作均可追溯到审计日志。

### 12.4 Auth/User 后端

1. Auth
   - nonce 生成与过期
   - SIWE 验签
   - access/refresh token
2. User
   - 首次登录自动建档
   - 用户资料更新
   - referral_code 自动生成
3. Session & Security
   - 登录限频
   - 黑名单钱包拦截
   - 基础设备/IP 记录

关键数据表：users、auth_nonces、sessions、risk_profiles。

### 12.5 Project/Campaign 后端

1. Project Service
   - 项目 CRUD
   - 项目成员与角色权限（owner/editor/viewer）
2. Campaign Service
   - campaign 生命周期（draft/review/published/paused/closed）
3. Task Service
   - 任务模板与规则校验
   - task_submission 状态机
4. Point Ledger Service
   - 发放、锁定、释放、冲正
   - 余额由流水计算/快照
5. API & Webhook Service
   - API key + HMAC 签名
   - timestamp/nonce 防重放
   - webhook 重试队列

关键数据表：projects、project_members、campaigns、tasks、task_submissions、point_transactions、api_keys、webhooks、webhook_deliveries。

### 12.6 Smart Contracts MVP

1. PrizeVault
   - 奖品托管
   - 管理可提取规则（仅异常回滚场景）
2. DrawManager
   - round 创建与状态流转
   - finalMerkleRoot 提交
   - 随机数写入（VRF 或 MockVRF）
   - winningTicket 计算
3. ClaimVerifier
   - Merkle proof 验证
   - 防重复 claim
4. Event 标准化
   - RoundCreated / RootFinalized / RandomFulfilled / WinnerClaimed

合约验收基线：
- 必须包含 Foundry 单元测试和关键安全路径测试（重复领取、越权、空 root、未开奖 claim）。

### 12.7 并行实施顺序（建议）

- Wave 1（地基）：Auth/User 后端 + Project/Campaign 后端骨架 + 合约骨架
- Wave 2（主链路）：用户端 UI + Dashboard UI + 积分账本 + task_submission
- Wave 3（可信闭环）：奖励池链路（Merkle + 随机数 + claim）+ Admin 风控与审核
- Wave 4（对外能力）：API Key/HMAC/Webhook + 监控告警 + 回归测试

### 12.8 DoD（Definition of Done）

满足以下条件才视为 MVP 可演示：

1. C 端可完成至少 1 条完整任务并看到积分流水。
2. 项目方可发布 1 个活动并查看参与数据。
3. Admin 可审核活动并处理 1 个风控案例。
4. 链上奖励池可完成“封存→开奖→中奖 claim”全流程。
5. API 写请求均通过签名校验且有审计日志。
